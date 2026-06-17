# ============================================================================
# ACM Certificate for ALB (us-east-1)
# NOTE: Validation records must be added manually to Squarespace DNS
# ============================================================================

resource "aws_acm_certificate" "alb" {
  count             = var.domain_name != "" ? 1 : 0
  domain_name       = "api.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-cert"
  })
}

# ============================================================================
# ACM Certificate for CloudFront (us-east-1 required)
# NOTE: Validation records must be added manually to Squarespace DNS
# ============================================================================

resource "aws_acm_certificate" "cloudfront" {
  count                     = var.domain_name != "" ? 1 : 0
  provider                  = aws
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudfront-cert"
  })
}
