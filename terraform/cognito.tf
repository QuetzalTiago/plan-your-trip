# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = local.name_prefix

  # Sign-in configuration
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy
  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # User pool deletion protection
  deletion_protection = var.environment == "prod" ? "ACTIVE" : "INACTIVE"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-user-pool"
  })
}

# User Pool Client
resource "aws_cognito_user_pool_client" "main" {
  name         = "${local.name_prefix}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Auth flows
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_CUSTOM_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  # Token validity
  id_token_validity      = 60 # 1 hour
  access_token_validity  = 60 # 1 hour
  refresh_token_validity = 30 # 30 days

  token_validity_units {
    id_token      = "minutes"
    access_token  = "minutes"
    refresh_token = "days"
  }

  # OAuth configuration
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls = [
    "http://localhost:5173",
    "https://localhost:5173",
    "https://${aws_cloudfront_distribution.frontend.domain_name}"
  ]
  logout_urls = [
    "http://localhost:5173",
    "https://localhost:5173",
    "https://${aws_cloudfront_distribution.frontend.domain_name}"
  ]

  generate_secret = false

  # Prevent accidental deletion
  prevent_user_existence_errors = "ENABLED"
}

# User Pool Groups
resource "aws_cognito_user_group" "free" {
  name         = "free"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Free tier - 10 trip plans/month"
}

resource "aws_cognito_user_group" "explorer" {
  name         = "explorer"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Explorer plan - unlimited"
}

resource "aws_cognito_user_group" "lifetime" {
  name         = "lifetime"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Lifetime access"
}
