param(
  [string]$Region = "eu-west-3",
  [string]$BucketName = "atb-terraform-state",
  [string]$DynamoTable = "atb-terraform-locks"
)

$ErrorActionPreference = "Stop"

Write-Host "=== ATB Terraform State Bootstrap ===" -ForegroundColor Cyan
Write-Host "Region : $Region" -ForegroundColor Gray
Write-Host "Bucket : $BucketName" -ForegroundColor Gray
Write-Host ""

# Vérifier AWS CLI
if (-not (Get-Command "aws" -ErrorAction SilentlyContinue)) {
  Write-Host "ERREUR: AWS CLI non installé. https://aws.amazon.com/cli/" -ForegroundColor Red
  exit 1
}

# Vérifier les credentials
try {
  $identity = aws sts get-caller-identity --query "Account" --output text
  Write-Host "Compte AWS : $identity" -ForegroundColor Green
} catch {
  Write-Host "ERREUR: Impossible de s'authentifier. Exécutez 'aws configure' d'abord." -ForegroundColor Red
  exit 1
}

# Créer le bucket S3
Write-Host "`n[1/2] Bucket S3 : $BucketName" -ForegroundColor Yellow
$bucketExists = aws s3api head-bucket --bucket $BucketName 2>$null
if (-not $?) {
  aws s3 mb "s3://$BucketName" --region $Region
  aws s3api put-bucket-versioning --bucket $BucketName --versioning-configuration Status=Enabled
  aws s3api put-bucket-tagging --bucket $BucketName --tagging "TagSet=[{Key=Name,Value=ATB Terraform State},{Key=Environment,Value=prod}]"
  Write-Host "  ✓ Bucket créé avec versioning activé" -ForegroundColor Green
} else {
  Write-Host "  ✓ Bucket existe déjà" -ForegroundColor Green
}

# Créer la table DynamoDB pour le locking
Write-Host "[2/2] Table DynamoDB : $DynamoTable" -ForegroundColor Yellow
$tableExists = aws dynamodb describe-table --table-name $DynamoTable 2>$null
if (-not $?) {
  aws dynamodb create-table `
    --table-name $DynamoTable `
    --attribute-definitions AttributeName=LockID,AttributeType=S `
    --key-schema AttributeName=LockID,KeyType=HASH `
    --billing-mode PAY_PER_REQUEST `
    --region $Region
  Write-Host "  ✓ Table DynamoDB créée (PAY_PER_REQUEST)" -ForegroundColor Green
} else {
  Write-Host "  ✓ Table DynamoDB existe déjà" -ForegroundColor Green
}

Write-Host "`n=== Bootstrap terminé ===" -ForegroundColor Cyan
Write-Host "Vous pouvez maintenant lancer : terraform init" -ForegroundColor Green
