# CloudWatch Log Groups

resource "aws_cloudwatch_log_group" "lambda_api" {
  name              = "/aws/lambda/${local.name_prefix}-api"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-api-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_migrate" {
  name              = "/aws/lambda/${local.name_prefix}-db-migrate"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-migrate-logs"
  })
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.name_prefix}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-apigateway-logs"
  })
}
