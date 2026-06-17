#!/usr/bin/env python3
import argparse
import os
import sys
from pathlib import Path

import psycopg2


def get_connection_params(env: str = "local") -> dict:
    """Get database connection parameters based on environment."""
    if env == "local":
        return {
            "host": os.getenv("POSTGRES_HOST", "localhost"),
            "port": int(os.getenv("POSTGRES_PORT", "5432")),
            "database": os.getenv("POSTGRES_DB", "voyager_local"),
            "user": os.getenv("POSTGRES_USER", "voyager_dev"),
            "password": os.getenv("POSTGRES_PASSWORD", "local_dev_password"),
        }
    elif env == "production":
        # For production, you might fetch from AWS Secrets Manager
        import boto3

        secret_name = os.getenv("POSTGRES_SECRET_NAME", "voyager/postgres-password")
        region = os.getenv("AWS_REGION", "us-east-1")

        client = boto3.client("secretsmanager", region_name=region)
        secret = client.get_secret_value(SecretId=secret_name)

        import json

        secret_dict = json.loads(secret["SecretString"])

        return {
            "host": os.getenv("POSTGRES_HOST"),
            "port": int(os.getenv("POSTGRES_PORT", "5432")),
            "database": os.getenv("POSTGRES_DB", "voyager"),
            "user": secret_dict.get("username"),
            "password": secret_dict.get("password"),
        }
    else:
        raise ValueError(f"Unknown environment: {env}")


def read_sql_file(filename: str) -> str:
    """Read SQL file from the sql directory."""
    sql_dir = Path(__file__).parent
    filepath = sql_dir / filename

    if not filepath.exists():
        raise FileNotFoundError(f"SQL file not found: {filepath}")

    return filepath.read_text(encoding="utf-8")


def execute_sql(conn, sql: str, description: str):
    """Execute SQL with error handling."""
    print(f"  → {description}...")
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        print(f"  ✓ {description} completed")
    except Exception as e:
        print(f"  ✗ {description} failed: {e}")
        raise


def migrate_database(env: str = "local", force: bool = False):
    """Run database migration."""
    print(f"\n{'='*60}")
    print(f"Voyager Database Migration - Environment: {env.upper()}")
    print(f"{'='*60}\n")

    # Get connection parameters
    try:
        params = get_connection_params(env)
        print(f"Connecting to: {params['host']}:{params['port']}/{params['database']}")
    except Exception as e:
        print(f"✗ Failed to get connection parameters: {e}")
        sys.exit(1)

    # Connect to database
    try:
        conn = psycopg2.connect(**params)
        print("✓ Connected to database\n")
    except psycopg2.OperationalError as e:
        print(f"✗ Failed to connect to database: {e}")
        print("\nTroubleshooting:")
        print("  1. Ensure PostgreSQL is running")
        print("  2. Check connection parameters")
        print("  3. Verify network access (security groups for RDS)")
        sys.exit(1)

    try:
        # Check if database is already initialized
        with conn.cursor() as cur:
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'trips'
                );
            """)
            already_initialized = cur.fetchone()[0]

        if already_initialized and not force:
            print("⚠ Database already initialized!")
            print("  Use --force to re-run migration (WARNING: May cause data loss)\n")
            response = input("Continue anyway? (yes/no): ")
            if response.lower() != "yes":
                print("Migration cancelled.")
                sys.exit(0)

        # Run schema migration
        print("\n" + "=" * 60)
        print("STEP 1: Creating Schema")
        print("=" * 60 + "\n")

        schema_sql = read_sql_file("schema.sql")
        execute_sql(conn, schema_sql, "Creating tables and indexes")

        # Run procedures migration
        print("\n" + "=" * 60)
        print("STEP 2: Creating Stored Procedures")
        print("=" * 60 + "\n")

        procedures_sql = read_sql_file("procedures.sql")
        execute_sql(conn, procedures_sql, "Creating stored procedures")

        # Verify installation
        print("\n" + "=" * 60)
        print("STEP 3: Verification")
        print("=" * 60 + "\n")

        with conn.cursor() as cur:
            # Check tables
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """)
            tables = [row[0] for row in cur.fetchall()]
            print(f"  ✓ Tables created: {', '.join(tables)}")

            # Check procedures
            cur.execute("""
                SELECT routine_name 
                FROM information_schema.routines 
                WHERE routine_schema = 'public' 
                AND routine_type = 'FUNCTION'
                ORDER BY routine_name;
            """)
            procedures = [row[0] for row in cur.fetchall()]
            print(f"  ✓ Procedures created: {len(procedures)} functions")

            # Check default user
            cur.execute("SELECT COUNT(*) FROM users;")
            user_count = cur.fetchone()[0]
            print(f"  ✓ Users in database: {user_count}")

        print("\n" + "=" * 60)
        print("✓ Migration completed successfully!")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Migrate Voyager PostgreSQL database")
    parser.add_argument(
        "--env",
        choices=["local", "production"],
        default="local",
        help="Environment to migrate (default: local)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force migration even if database is already initialized",
    )

    args = parser.parse_args()

    migrate_database(env=args.env, force=args.force)


if __name__ == "__main__":
    main()
