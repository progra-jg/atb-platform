#!/usr/bin/env bash
set -euo pipefail

REGION="${1:-eu-west-3}"
BUCKET="${2:-atb-terraform-state}"
DYNAMO="${3:-atb-terraform-locks}"

echo "=== ATB Terraform State Bootstrap ==="
echo "Region : $REGION"
echo "Bucket : $BUCKET"
echo ""

command -v aws >/dev/null 2>&1 || { echo "ERREUR: AWS CLI non installé"; exit 1; }

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo "Compte AWS : $ACCOUNT"

if ! aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "[1/2] Création du bucket S3 : $BUCKET"
  aws s3 mb "s3://$BUCKET" --region "$REGION"
  aws s3api put-bucket-versioning --bucket "$BUCKET" --versioning-configuration Status=Enabled
  aws s3api put-bucket-tagging --bucket "$BUCKET" --tagging "TagSet=[{Key=Name,Value=ATB Terraform State},{Key=Environment,Value=prod}]"
  echo "  ✓ Bucket créé"
else
  echo "  ✓ Bucket existe déjà"
fi

if ! aws dynamodb describe-table --table-name "$DYNAMO" 2>/dev/null; then
  echo "[2/2] Création table DynamoDB : $DYNAMO"
  aws dynamodb create-table \
    --table-name "$DYNAMO" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION"
  echo "  ✓ Table créée"
else
  echo "  ✓ Table existe déjà"
fi

echo ""
echo "=== Bootstrap terminé ==="
