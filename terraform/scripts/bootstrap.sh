#!/bin/bash
# Bootstrap Terraform state backend (S3 + DynamoDB)
# Run this ONCE before first terraform init

set -e

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="voyager-terraform-state-${AWS_ACCOUNT_ID}"
TABLE_NAME="voyager-terraform-locks"

echo "==================================="
echo "Terraform Backend Bootstrap"
echo "==================================="
echo "Region: $AWS_REGION"
echo "Account: $AWS_ACCOUNT_ID"
echo "Bucket: $BUCKET_NAME"
echo "Table: $TABLE_NAME"
echo ""

# Create S3 bucket for state
echo "Creating S3 bucket for Terraform state..."
if [ "$AWS_REGION" = "us-east-1" ]; then
    # us-east-1 doesn't use LocationConstraint
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$AWS_REGION" \
        2>/dev/null || echo "Bucket already exists"
else
    # Other regions need LocationConstraint
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$AWS_REGION" \
        --create-bucket-configuration LocationConstraint="$AWS_REGION" \
        2>/dev/null || echo "Bucket already exists"
fi

# Enable versioning
echo "Enabling versioning..."
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

# Enable encryption
echo "Enabling encryption..."
aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
      "Rules": [{
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }]
    }'

# Block public access
echo "Blocking public access..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Create DynamoDB table for locking
echo "Creating DynamoDB table for state locking..."
aws dynamodb create-table \
    --table-name "$TABLE_NAME" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$AWS_REGION" \
    2>/dev/null || echo "Table already exists"

echo ""
echo "✅ Backend infrastructure created successfully!"
echo ""
echo "Next steps:"
echo "1. Update backend.hcl with bucket name: $BUCKET_NAME"
echo "2. Run: terraform init -backend-config=backend.hcl"
echo ""
