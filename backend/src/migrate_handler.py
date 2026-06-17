"""Database migration handler."""

import json
import logging
import os
import sys
from pathlib import Path

import psycopg2

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_db_connection():
    """Get database connection using environment variables and Secrets Manager."""
    import boto3

    # Get database password from Secrets Manager
    secret_name = os.environ.get("DB_SECRET_NAME")
    region = os.environ.get("AWS_REGION_NAME", "us-east-1")

    if not secret_name:
        raise ValueError("DB_SECRET_NAME environment variable not set")

    try:
        client = boto3.client("secretsmanager", region_name=region)
        response = client.get_secret_value(SecretId=secret_name)
        secret_string = response["SecretString"]

        # Parse JSON if it's a JSON string
        try:
            secret_data = json.loads(secret_string)
            password = secret_data.get("password", secret_string)
        except (json.JSONDecodeError, KeyError):
            # If not JSON or no password key, use as-is
            password = secret_string
    except Exception as e:
        logger.error(f"Failed to retrieve database password: {e}")
        raise

    # Build connection parameters
    params = {
        "host": os.environ.get("DB_HOST"),
        "port": int(os.environ.get("DB_PORT", "5432")),
        "database": os.environ.get("DB_NAME", "voyager"),
        "user": os.environ.get("DB_USER", "postgres"),
        "password": password,
        "connect_timeout": 10,
        "sslmode": "require",  # RDS requires SSL
    }

    logger.info(f"Connecting to {params['host']}:{params['port']}/{params['database']}")

    try:
        conn = psycopg2.connect(**params)
        logger.info("✓ Connected to database")
        return conn
    except psycopg2.OperationalError as e:
        logger.error(f"Failed to connect to database: {e}")
        raise


def read_sql_file(filename: str) -> str:
    """Read SQL file from the sql directory."""
    sql_dir = Path("/var/task/sql")
    filepath = sql_dir / filename

    if not filepath.exists():
        raise FileNotFoundError(f"SQL file not found: {filepath}")

    return filepath.read_text(encoding="utf-8")


def execute_sql(conn, sql: str, description: str):
    """Execute SQL with error handling."""
    logger.info(f"→ {description}...")
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        logger.info(f"✓ {description} completed")
    except Exception as e:
        logger.error(f"✗ {description} failed: {e}")
        raise


def handler(event, context):
    """Database migration handler."""
    logger.info("=" * 60)
    logger.info("Voyager Database Migration")
    logger.info("=" * 60)

    try:
        # Connect to database
        conn = get_db_connection()

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

        if already_initialized:
            logger.info("⚠ Database already initialized. Skipping migration.")
            return {
                "statusCode": 200,
                "body": json.dumps(
                    {"status": "skipped", "message": "Database already initialized"}
                ),
            }

        # Run schema migration
        logger.info("\nSTEP 1: Creating Schema")
        schema_sql = read_sql_file("schema.sql")
        execute_sql(conn, schema_sql, "Creating tables and indexes")

        # Run procedures migration
        logger.info("\nSTEP 2: Creating Stored Procedures")
        procedures_sql = read_sql_file("procedures.sql")
        execute_sql(conn, procedures_sql, "Creating stored procedures")

        # Verify installation
        logger.info("\nSTEP 3: Verification")
        with conn.cursor() as cur:
            # Check tables
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """)
            tables = [row[0] for row in cur.fetchall()]
            logger.info(f"✓ Tables created: {', '.join(tables)}")

            # Check procedures
            cur.execute("""
                SELECT routine_name 
                FROM information_schema.routines 
                WHERE routine_schema = 'public' 
                AND routine_type = 'PROCEDURE'
                ORDER BY routine_name;
            """)
            procedures = [row[0] for row in cur.fetchall()]
            logger.info(f"✓ Procedures created: {', '.join(procedures)}")

        conn.close()

        logger.info("\n" + "=" * 60)
        logger.info("✓ Migration completed successfully!")
        logger.info("=" * 60)

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "status": "success",
                    "tables": tables,
                    "procedures": procedures,
                    "message": "Database migration completed successfully",
                }
            ),
        }

    except Exception as e:
        logger.error(f"\n✗ Migration failed: {e}")
        logger.exception("Full traceback:")

        return {
            "statusCode": 500,
            "body": json.dumps({"status": "error", "message": str(e)}),
        }
