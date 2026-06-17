#!/bin/bash
# Initialize secrets in AWS Secrets Manager
# Run this AFTER terraform apply creates the secret placeholders

set -e

AWS_REGION="${AWS_REGION:-us-east-1}"

echo "==================================="
echo "Voyager Secrets Initialization"
echo "==================================="
echo ""

# Check if secrets are already set
check_secret() {
    local secret_name=$1
    aws secretsmanager get-secret-value \
        --secret-id "$secret_name" \
        --region "$AWS_REGION" \
        --query SecretString \
        --output text 2>/dev/null
}

# Gemini API Key
echo "Setting Gemini API key..."
if [ -z "${GEMINI_API_KEY}" ]; then
    read -sp "Enter Gemini API key: " GEMINI_API_KEY
    echo ""
fi

if [ -n "$GEMINI_API_KEY" ]; then
    aws secretsmanager put-secret-value \
        --secret-id "voyager/gemini-api-key" \
        --secret-string "$GEMINI_API_KEY" \
        --region "$AWS_REGION"
    echo "✅ Gemini API key set"
else
    echo "⚠️  Gemini API key not provided"
fi

# SerpAPI Key
echo ""
echo "Setting SerpAPI key..."
if [ -z "${SERPAPI_API_KEY}" ]; then
    read -sp "Enter SerpAPI key: " SERPAPI_API_KEY
    echo ""
fi

if [ -n "$SERPAPI_API_KEY" ]; then
    aws secretsmanager put-secret-value \
        --secret-id "voyager/serpapi-api-key" \
        --secret-string "$SERPAPI_API_KEY" \
        --region "$AWS_REGION"
    echo "✅ SerpAPI key set"
else
    echo "⚠️  SerpAPI key not provided"
fi

echo ""
echo "==================================="
echo "✅ Secrets initialization complete!"
echo "==================================="
