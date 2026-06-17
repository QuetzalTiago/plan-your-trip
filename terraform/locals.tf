locals {
  project = "voyager"

  # Resource naming pattern: {project}-{resource}-{environment}
  name_prefix = "${local.project}-${var.environment}"

  # Common tags
  common_tags = {
    Project     = local.project
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  # Lambda environment variables
  lambda_env_common = {
    # PostgreSQL database configuration
    DB_HOST        = aws_db_instance.main.address
    DB_PORT        = tostring(aws_db_instance.main.port)
    DB_NAME        = var.db_name
    DB_USER        = var.db_master_username
    DB_SECRET_NAME = aws_secretsmanager_secret.db_master_password.name

    # S3 exports
    EXPORT_BUCKET = aws_s3_bucket.exports.id

    # API secrets
    GEMINI_SECRET_NAME  = aws_secretsmanager_secret.gemini_api_key.name
    SERPAPI_SECRET_NAME = aws_secretsmanager_secret.serpapi_api_key.name

    # Authentication
    USER_POOL_ID        = aws_cognito_user_pool.main.id
    USER_POOL_CLIENT_ID = aws_cognito_user_pool_client.main.id

    # Region
    AWS_REGION_NAME = var.aws_region
  }
}
