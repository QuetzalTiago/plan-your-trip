# RDS PostgreSQL Instance

# Random password for RDS master user
resource "random_password" "db_master_password" {
  length  = 32
  special = true
  # Avoid characters that can cause issues in connection strings
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store master password in Secrets Manager
resource "aws_secretsmanager_secret" "db_master_password" {
  name                    = "${local.name_prefix}-db-master-password"
  description             = "RDS PostgreSQL master password"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-master-password"
  })
}

resource "aws_secretsmanager_secret_version" "db_master_password" {
  secret_id = aws_secretsmanager_secret.db_master_password.id
  secret_string = jsonencode({
    username = var.db_master_username
    password = random_password.db_master_password.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = var.db_name
  })
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  name   = "${local.name_prefix}-pg17"
  family = "postgres17"

  # Performance and monitoring parameters
  parameter {
    name  = "log_statement"
    value = var.environment == "prod" ? "mod" : "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = var.environment == "prod" ? "1000" : "100" # Log slow queries (ms)
  }

  # Note: shared_preload_libraries is a static parameter that requires DB restart
  # It's set at instance creation, not via parameter group
  # parameter {
  #   name  = "shared_preload_libraries"
  #   value = "pg_stat_statements"
  # }

  parameter {
    name  = "pg_stat_statements.track"
    value = "all"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-parameter-group"
  })
}

# RDS Option Group
resource "aws_db_option_group" "main" {
  name                     = "${local.name_prefix}-pg17"
  option_group_description = "PostgreSQL 17 options"
  engine_name              = "postgres"
  major_engine_version     = "17"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-option-group"
  })
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-db"
  engine         = "postgres"
  engine_version = var.db_engine_version

  # Instance configuration
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  # IOPS can only be specified for storage >= 400GB
  # For smaller sizes, gp3 provides baseline 3000 IOPS
  iops = var.db_allocated_storage >= 400 ? var.db_iops : null

  # Database configuration
  db_name  = var.db_name
  username = var.db_master_username
  password = random_password.db_master_password.result
  port     = 5432

  # Network configuration
  # Public access with security group allowing PostgreSQL connections
  publicly_accessible    = true
  vpc_security_group_ids = [aws_security_group.rds.id]

  # High availability
  multi_az = var.environment == "prod" ? true : false

  # Backup configuration
  backup_retention_period   = var.environment == "prod" ? 30 : 7
  backup_window             = "03:00-04:00"         # UTC
  maintenance_window        = "mon:04:00-mon:05:00" # UTC
  delete_automated_backups  = var.environment == "prod" ? false : true
  skip_final_snapshot       = var.environment == "prod" ? false : true
  final_snapshot_identifier = var.environment == "prod" ? "${local.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Performance Insights
  performance_insights_enabled          = true
  performance_insights_retention_period = var.environment == "prod" ? 7 : 7
  enabled_cloudwatch_logs_exports       = ["postgresql", "upgrade"]

  # Monitoring
  monitoring_interval = 60 # Enhanced monitoring every 60 seconds
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Parameter and option groups
  parameter_group_name = aws_db_parameter_group.main.name
  option_group_name    = aws_db_option_group.main.name

  # Protection
  deletion_protection   = var.environment == "prod" ? true : false
  copy_tags_to_snapshot = true

  # Auto minor version upgrades
  auto_minor_version_upgrade = true
  apply_immediately          = var.environment == "prod" ? false : true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-postgresql"
  })

  lifecycle {
    ignore_changes = [
      # Ignore password changes (managed externally)
      password,
      # Ignore final snapshot identifier timestamp
      final_snapshot_identifier
    ]
  }
}

# IAM role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${local.name_prefix}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-monitoring-role"
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Log Groups for RDS
resource "aws_cloudwatch_log_group" "rds_postgresql" {
  name              = "/aws/rds/instance/${aws_db_instance.main.identifier}/postgresql"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-postgresql-logs"
  })
}

resource "aws_cloudwatch_log_group" "rds_upgrade" {
  name              = "/aws/rds/instance/${aws_db_instance.main.identifier}/upgrade"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-upgrade-logs"
  })
}

# Security Group for RDS - allows PostgreSQL from Lambda functions only
# Note: Since Lambda functions are NOT in a VPC (cost optimization),
# they connect via public internet with dynamic IPs, so we allow 0.0.0.0/0.
# Security is enforced by: PostgreSQL authentication, TLS/SSL, and strong password in Secrets Manager.
resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Allow PostgreSQL connections to RDS from Lambda functions"

  ingress {
    description = "PostgreSQL from Lambda functions (via public internet)"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Lambda has dynamic IPs, security via auth + TLS
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

# Database migration resource removed - using Fargate now
# Run migrations manually with: aws ecs run-task ...
