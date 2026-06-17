# Secrets Manager - Gemini API Key
resource "aws_secretsmanager_secret" "gemini_api_key" {
  name        = "${local.name_prefix}/gemini-api-key"
  description = "Gemini API key for Voyager AI agent"

  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-gemini-api-key"
  })
}

# Secrets Manager - SerpAPI Key
resource "aws_secretsmanager_secret" "serpapi_api_key" {
  name        = "${local.name_prefix}/serpapi-api-key"
  description = "SerpAPI key for flight, hotel, and event searches"

  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-serpapi-api-key"
  })
}

# Note: Secret values must be populated manually or via separate process
# Use: aws secretsmanager put-secret-value --secret-id <name> --secret-string <value>
