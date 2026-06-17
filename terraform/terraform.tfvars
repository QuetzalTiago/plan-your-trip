# Default values for Voyager infrastructure
environment = "prod"
aws_region  = "us-east-1"

# Domain Configuration (leave empty to skip DNS/HTTPS)
# After buying domain, set this and point nameservers to Route53
domain_name = "tiago-romero.com"

# ECS configuration
ecs_task_cpu       = "256" # 0.25 vCPU (cheapest)
ecs_task_memory    = "512" # 512 MB
ecs_desired_count  = 1
ecs_container_port = 8000
ecs_image_uri      = "298984097344.dkr.ecr.us-east-1.amazonaws.com/voyager-prod-lambda:ecs-latest"


# RDS PostgreSQL configuration
db_name                  = "voyager"
db_master_username       = "postgres"
db_engine_version        = "17.2"
db_instance_class        = "db.t4g.micro" # Use db.t4g.medium or larger for production
db_allocated_storage     = 20
db_max_allocated_storage = 100
db_iops                  = 3000

# CloudFront
cloudfront_price_class = "PriceClass_100"

# Monitoring & Alarms
alarm_email = "quetzaltiago@gmail.com"
