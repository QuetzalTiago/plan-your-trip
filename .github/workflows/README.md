# GitHub Actions Setup for Voyager

This directory contains CI/CD workflows for automated deployment.

## Workflows

### 1. `deploy.yml` - Main Orchestrator

**Triggers:**

- Push to `main` branch
- Manual trigger via "Run workflow" button

**What it does:**

- Detects which parts changed (terraform, backend, frontend)
- Orchestrates infrastructure and frontend workflows

### 2. `infrastructure.yml` - Backend & Infrastructure

**What it does:**

1. Builds and pushes Docker image to ECR (if backend code changed)
2. Deploys/updates AWS infrastructure with Terraform
3. **Automatically runs database migrations** via Lambda invoke
4. Exports outputs for frontend (API URL, Cognito IDs)

### 3. `frontend.yml` - Frontend Deployment

**What it does:**

1. Gets Terraform outputs (API URL, Cognito IDs, S3 bucket, CloudFront ID)
2. Builds React app with environment variables injected
3. Uploads to S3 with cache headers
4. Invalidates CloudFront cache

### 4. `destroy.yml` - Infrastructure Teardown

**Triggers:**

- Manual trigger only (requires typing "destroy" to confirm)

**What it does:**

1. Empties S3 buckets
2. Runs `terraform destroy` to remove all AWS resources

## Required Secrets

Add these to your GitHub repository secrets (Settings → Secrets and variables → Actions):

```
AWS_ROLE_ARN              # AWS IAM role ARN for OIDC authentication
```

### Setting up AWS OIDC Authentication

**Why OIDC?** No long-lived AWS credentials in GitHub - uses short-lived tokens.

1. **Create OIDC Identity Provider** (AWS IAM Console):
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`

2. **Create IAM Role**:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
             "token.actions.githubusercontent.com:sub": "repo:<YOUR_ORG>/<YOUR_REPO>:ref:refs/heads/main"
           }
         }
       }
     ]
   }
   ```

3. **Attach Policies to Role**:
   - `PowerUserAccess` (or custom policy with S3, Lambda, ECR, CloudFront, RDS, API Gateway, Cognito permissions)

4. **Add Role ARN to GitHub Secrets**:
   - Copy the role ARN (e.g., `arn:aws:iam::123456789012:role/github-actions-voyager`)
   - Add as secret `AWS_ROLE_ARN`

## Terraform Backend

Ensure `backend.hcl` is configured for remote state:

```hcl
bucket         = "voyager-terraform-state"
key            = "prod/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "voyager-terraform-locks"
encrypt        = true
```

## Usage

### Deploy to Production

```bash
git push origin main
# Workflows automatically trigger based on changed files
```

Or manually trigger via **Actions** tab → **Deploy** → **Run workflow**

### Destroy Infrastructure

1. Go to **Actions** tab
2. Select **Destroy Voyager Infrastructure**
3. Click **Run workflow**
4. Type **"destroy"** to confirm
5. Click **Run workflow**

## What Gets Deployed Automatically

| Change         | Infrastructure | Backend Docker | Frontend |
| -------------- | -------------- | -------------- | -------- |
| `terraform/**` | ✅             | ❌             | ✅       |
| `backend/**`   | ✅             | ✅             | ✅       |
| `frontend/**`  | ❌             | ❌             | ✅       |

## Environment Variables (Frontend)

The frontend is automatically built with:

- `VITE_API_URL` - API Gateway endpoint
- `VITE_USER_POOL_ID` - Cognito User Pool ID
- `VITE_USER_POOL_CLIENT_ID` - Cognito Client ID

These are injected from Terraform outputs during the build process.

## Database Migrations

Migrations run **automatically** after Terraform apply:

- Lambda function `voyager-prod-db-migrate` is invoked
- Logs are shown in the workflow output
- Migration SQL is in `backend/sql/schema.sql` and `backend/sql/procedures.sql`

## Monitoring

After deployment:

- CloudWatch alarms monitor Lambda errors, API Gateway latency, RDS health
- Set `alarm_email` in `terraform.tfvars` to receive SNS notifications

## Cost Tracking

Estimated costs:

- **2 days**: ~$1.50
- **30 days**: ~$25/month (dev), ~$100/month (prod with Multi-AZ)
- Breakdown: RDS ($12-50), Lambda + API Gateway ($5-10), CloudFront + S3 ($3-5)

---

## Troubleshooting Common Issues

### 1. "Image manifest not supported" for Lambda

**Error:**

```
InvalidParameterValueException: The image manifest, config or layer media type
for the source image is not supported.
```

**Cause:** Docker BuildKit creates OCI multi-arch manifests that Lambda doesn't support.

**Fix:** The workflow now sets `DOCKER_BUILDKIT: 0` to use legacy builder.

### 2. S3 Bucket Creation Fails in us-east-1

**Error:**

```
InvalidLocationConstraint: The specified location-constraint is not valid
```

**Cause:** `us-east-1` doesn't accept LocationConstraint parameter.

**Fix:** The workflow now conditionally creates buckets based on region:

```bash
if [ "$AWS_REGION" == "us-east-1" ]; then
  aws s3api create-bucket --bucket "$BUCKET_NAME" --region us-east-1
else
  aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION" \
    --create-bucket-configuration LocationConstraint="$AWS_REGION"
fi
```

### 3. CloudWatch Log Group Already Exists

**Error:**

```
ResourceAlreadyExistsException: The specified log group already exists
```

**Cause:** RDS auto-creates CloudWatch log groups for PostgreSQL logs.

**Fix:** The workflow now imports existing log groups if Terraform apply fails:

```bash
terraform import aws_cloudwatch_log_group.rds_postgresql \
  "/aws/rds/instance/voyager-prod-db/postgresql"
```

### 4. Database Migration Fails - Password Authentication

**Error:**

```
FATAL: password authentication failed for user "postgres"
```

**Causes:**

1. Lambda not using SSL connection (RDS requires SSL)
2. Secrets Manager stores password as JSON, not plain text

**Fix:** Updated code to:

- Use `sslmode="require"` for all PostgreSQL connections
- Parse JSON from Secrets Manager to extract password field:
  ```python
  secret_data = json.loads(secret_string)
  password = secret_data.get("password", secret_string)
  ```

### 5. Terraform State Lock

**Error:**

```
Error acquiring the state lock
```

**Cause:** Previous workflow run crashed without releasing DynamoDB lock.

**Fix:**

```bash
# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Delete lock
aws dynamodb delete-item \
  --table-name voyager-terraform-locks \
  --key "{\"LockID\": {\"S\": \"voyager-terraform-state-${ACCOUNT_ID}/voyager/terraform.tfstate-md5\"}}"
```

### 6. Frontend Not Updating

**Cause:** CloudFront cache not invalidated or still propagating.

**Fix:**

- Invalidation happens automatically in the workflow
- Wait 1-2 minutes for CloudFront propagation worldwide
- Or force refresh in browser (Ctrl+Shift+R)

### 7. Lambda Architecture Mismatch

**Error:** Building ARM64 on x86_64 runners fails or is very slow.

**Fix:** Changed Lambda architecture to `x86_64` for compatibility:

```hcl
architectures = ["x86_64"]  # Changed from arm64
```

### 8. SQL Files Not Found in Lambda

**Error:**

```
FileNotFoundError: SQL file not found: /app/sql/schema.sql
```

**Cause:** Lambda uses `/var/task` as root, not `/app`.

**Fix:** Updated SQL file path in migration handler:

```python
sql_dir = Path("/var/task/sql")  # Changed from /app/sql
```

---

## Required AWS Secrets Manager Secrets

Create these **before first deployment**:

```bash
# Gemini AI API key
aws secretsmanager create-secret \
  --name voyager-prod/gemini-api-key \
  --secret-string "YOUR_GEMINI_API_KEY" \
  --region us-east-1

# SerpAPI key (for flights/hotels)
aws secretsmanager create-secret \
  --name voyager-prod/serpapi-api-key \
  --secret-string "YOUR_SERPAPI_KEY" \
  --region us-east-1
```

**Note:** `voyager-prod-db-master-password` is auto-created by Terraform in JSON format.

---

## Manual Steps Required

### Before First Deployment

1. ✅ Create AWS OIDC provider
2. ✅ Create IAM role with required permissions
3. ✅ Add `AWS_ROLE_ARN` GitHub secret
4. ✅ Update `terraform/backend.hcl` with your AWS account ID
5. ✅ Create Gemini and SerpAPI secrets in Secrets Manager

### After Deployment

- **Subscribe to SNS alerts**: Check your email for SNS subscription confirmation
- **Test the application**: Visit the CloudFront URL from workflow outputs
- **Monitor costs**: Check AWS Cost Explorer after 24 hours

---

## Workflow Execution Flow

```
┌─────────────────┐
│   Push to main  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ detect-changes  │ ◄── Determines what changed
└────────┬────────┘
         │
         ├─────────────────┬──────────────────┐
         ▼                 ▼                  ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────┐
│ infrastructure │  │   backend    │  │   frontend   │
│    (terraform) │  │   (Docker)   │  │   (npm)      │
└────────┬───────┘  └──────┬───────┘  └──────┬───────┘
         │                 │                  │
         ▼                 ▼                  ▼
┌────────────────────────────────────────────────────┐
│               Terraform Apply                      │
│  • Infrastructure (RDS, Lambda, API Gateway...)   │
│  • Import CloudWatch logs if needed               │
│  • Run database migration                         │
└────────┬───────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────┐
│               Frontend Deploy                      │
│  • Build with API URL from Terraform              │
│  • Upload to S3                                   │
│  • Invalidate CloudFront                          │
└────────┬───────────────────────────────────────────┘
         │
         ▼
┌────────────────┐
│  smoke-tests   │ ◄── Verify deployment health
└────────────────┘
```

---

## Debugging Workflows

### View Logs

1. Go to **Actions** tab in GitHub
2. Click on the workflow run
3. Click on the job to see detailed logs

### Test Locally

```bash
# Test Terraform changes
cd terraform
terraform init -backend-config=backend.hcl
terraform plan

# Test backend build
cd backend
DOCKER_BUILDKIT=0 docker build --target lambda -t test-lambda -f Dockerfile .

# Test frontend build
cd frontend
npm install
VITE_API_URL=https://test.example.com npm run build
```

---

For more details, see [AWS Deployment Guide](../../docs/AWS_DEPLOYMENT_FROM_ZERO.md)
