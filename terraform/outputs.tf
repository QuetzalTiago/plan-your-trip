output "alb_dns_name" {
  description = "ALB DNS name for ECS API"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "Full ALB URL (HTTP or HTTPS)"
  value       = var.domain_name != "" ? "https://api.${var.domain_name}" : "http://${aws_lb.main.dns_name}"
}

output "app_url" {
  description = "Application URL (CloudFront or custom domain)"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

# ACM Certificate Validation Records (add these to Squarespace DNS)
output "acm_validation_records_alb" {
  description = "DNS validation records for ALB certificate (add to Squarespace)"
  value = var.domain_name != "" ? {
    for dvo in aws_acm_certificate.alb[0].domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  } : {}
}

output "acm_validation_records_cloudfront" {
  description = "DNS validation records for CloudFront certificate (add to Squarespace)"
  value = var.domain_name != "" ? {
    for dvo in aws_acm_certificate.cloudfront[0].domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  } : {}
}

# Final DNS Records (add these AFTER certificates are validated)
output "final_dns_records" {
  description = "DNS records to add to Squarespace after certificate validation"
  value = var.domain_name != "" ? {
    api_cname = {
      name  = "api.${var.domain_name}"
      type  = "CNAME"
      value = aws_lb.main.dns_name
    }
    root_cname = {
      name  = var.domain_name
      type  = "CNAME"
      value = aws_cloudfront_distribution.frontend.domain_name
    }
    www_cname = {
      name  = "www.${var.domain_name}"
      type  = "CNAME"
      value = aws_cloudfront_distribution.frontend.domain_name
    }
  } : {}
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for invalidations"
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_bucket_name" {
  description = "S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.id
}

output "export_bucket_name" {
  description = "S3 bucket for trip exports"
  value       = aws_s3_bucket.exports.id
}

output "ecr_repository_url" {
  description = "ECR repository URL for Lambda images"
  value       = aws_ecr_repository.lambda.repository_url
}

output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "db_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.db_master_password.arn
}

output "alarm_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  value       = aws_sns_topic.alarms.arn
}

# Lambda outputs removed - using Fargate now
