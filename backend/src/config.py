"""Application settings and configuration."""

import logging
import os

logger = logging.getLogger(__name__)


def _get_secret(secret_name: str, region: str = "us-east-1") -> str | None:
    """Retrieve secret from AWS Secrets Manager."""
    try:
        import boto3
        import json as json_module
        from botocore.exceptions import ClientError

        client = boto3.client("secretsmanager", region_name=region)
        response = client.get_secret_value(SecretId=secret_name)

        if "SecretString" in response:
            secret_string = response["SecretString"]
            # Try to parse as JSON and extract password field if present
            try:
                secret_data = json_module.loads(secret_string)
                # If it's a dict with a password field, return that
                if isinstance(secret_data, dict) and "password" in secret_data:
                    return secret_data["password"]
            except (json_module.JSONDecodeError, KeyError):
                pass
            # Otherwise return the raw string
            return secret_string
        return None
    except ClientError as e:
        logger.warning(f"Failed to retrieve secret {secret_name}: {e}")
        return None
    except ImportError:
        logger.debug("boto3 not available, skipping Secrets Manager")
        return None
    except Exception as e:
        logger.warning(f"Unexpected error retrieving secret {secret_name}: {e}")
        return None


def _is_aws_environment() -> bool:
    """Detect if running in AWS (ECS, Lambda, EC2, etc.)."""
    return bool(
        os.getenv("AWS_EXECUTION_ENV")
        or os.getenv("AWS_LAMBDA_FUNCTION_NAME")
        or os.getenv("ECS_CONTAINER_METADATA_URI")
    )


class Settings:
    """Application configuration loaded from environment variables and AWS Secrets Manager."""

    def __init__(self):
        # AWS Region (for Secrets Manager)
        self.aws_region: str = os.environ.get("AWS_REGION", "us-east-1")

        # Detect environment
        self.is_aws: bool = _is_aws_environment()
        self.local_dev: bool = os.environ.get("LOCAL_DEV", "").lower() in (
            "true",
            "1",
            "yes",
        )

        # PostgreSQL configuration
        self.postgres_host: str = os.environ.get("POSTGRES_HOST", "localhost")
        self.postgres_port: int = int(os.environ.get("POSTGRES_PORT", "5432"))
        self.postgres_db: str = os.environ.get("POSTGRES_DB", "voyager_local")
        self.postgres_user: str = os.environ.get("POSTGRES_USER", "voyager_dev")

        # Database credentials
        postgres_secret_name = os.environ.get(
            "POSTGRES_SECRET_NAME", "voyager/postgres-password"
        )
        # AWS (ECS) uses DB_SECRET_NAME, local uses POSTGRES_SECRET_NAME
        db_secret_name = os.environ.get("DB_SECRET_NAME") or postgres_secret_name

        if self.is_aws and not self.local_dev:
            secret_value = _get_secret(db_secret_name, self.aws_region)
            self.postgres_password = secret_value or os.environ.get(
                "POSTGRES_PASSWORD", ""
            )
            # Override with AWS-specific vars if present
            self.postgres_host = os.environ.get("DB_HOST", self.postgres_host)
            self.postgres_port = int(os.environ.get("DB_PORT", self.postgres_port))
            self.postgres_db = os.environ.get("DB_NAME", self.postgres_db)
            self.postgres_user = os.environ.get("DB_USER", self.postgres_user)
        else:
            self.postgres_password = os.environ.get(
                "POSTGRES_PASSWORD", "local_dev_password"
            )

        # Auth
        self.user_pool_id: str = os.environ.get("USER_POOL_ID", "")
        self.user_pool_client_id: str = os.environ.get("USER_POOL_CLIENT_ID", "")
        self.local_user_id: str = os.environ.get(
            "LOCAL_USER_ID", "00000000-0000-0000-0000-000000000001"
        )

        # AI - try Secrets Manager in AWS
        gemini_secret_name = os.environ.get(
            "GEMINI_SECRET_NAME", "voyager/gemini-api-key"
        )
        if self.is_aws and not self.local_dev:
            secret_value = _get_secret(gemini_secret_name, self.aws_region)
            self.gemini_api_key = secret_value or os.environ.get("GEMINI_API_KEY", "")
        else:
            self.gemini_api_key = os.environ.get("GEMINI_API_KEY", "")

        self.mock_ai: bool = os.environ.get("MOCK_AI", "").lower() in (
            "true",
            "1",
            "yes",
        )

        # Serpapi - try Secrets Manager in AWS
        serpapi_secret_name = os.environ.get(
            "SERPAPI_SECRET_NAME", "voyager/serpapi-api-key"
        )
        if self.is_aws and not self.local_dev:
            secret_value = _get_secret(serpapi_secret_name, self.aws_region)
            self.serpapi_api_key = secret_value or os.environ.get("SERPAPI_API_KEY", "")
        else:
            self.serpapi_api_key = os.environ.get("SERPAPI_API_KEY", "")

        # S3
        self.export_bucket: str = os.environ.get("EXPORT_BUCKET", "")

        # CORS - Should be explicit domain in production
        self.cors_origin: str = os.environ.get("CORS_ORIGIN", "http://localhost:5173")


settings = Settings()
