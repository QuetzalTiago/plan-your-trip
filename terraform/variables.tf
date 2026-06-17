variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
  default     = "prod"
}

variable "lambda_image_uri" {
  description = "ECR image URI for Lambda functions (updated by CI/CD)"
  type        = string
  default     = ""
}

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "lambda_memory_size_api" {
  description = "Memory size for API Lambda"
  type        = number
  default     = 2048 # Increased from 1024 to reduce cold start time
}

variable "lambda_timeout_api" {
  description = "Timeout for API Lambda in seconds"
  type        = number
  default     = 300
}

# ============================================================================
# RDS PostgreSQL Configuration
# ============================================================================

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "voyager"
}

variable "db_master_username" {
  description = "Master username for RDS"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "17.2"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro" # ARM-based, cost-effective for dev/small prod
}

variable "db_allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum storage for autoscaling in GB"
  type        = number
  default     = 100
}

variable "db_iops" {
  description = "Provisioned IOPS for gp3 storage"
  type        = number
  default     = 3000
}

# ============================================================================
# ECS Configuration
# ============================================================================

variable "ecs_task_cpu" {
  description = "CPU units for ECS task (256 = 0.25 vCPU)"
  type        = string
  default     = "256"
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = string
  default     = "512"
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecs_container_port" {
  description = "Port exposed by container"
  type        = number
  default     = 8000
}

variable "ecs_image_uri" {
  description = "ECR image URI for ECS tasks"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the application (e.g., example.com). Leave empty to skip DNS/HTTPS setup."
  type        = string
  default     = ""
}

# ============================================================================
# Monitoring & Alarms
# ============================================================================

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = ""
}
