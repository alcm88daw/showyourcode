#!/bin/bash
# Construye el frontend y lo publica en S3 + invalida la caché de CloudFront.
# Uso: ./scripts/deploy-frontend.sh
set -euo pipefail

STACK_NAME="testsapp"
REGION="eu-south-2"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ── Obtener recursos del stack ────────────────────────────────────────────────
echo "Obteniendo datos del stack $STACK_NAME..."
S3_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" \
  --output text)

CF_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

CF_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" \
  --output text)

if [ -z "$S3_BUCKET" ] || [ -z "$CF_ID" ]; then
  echo "ERROR: No se encontraron los outputs del stack. ¿Está desplegado?"
  exit 1
fi

echo "  S3 Bucket      : $S3_BUCKET"
echo "  CloudFront ID  : $CF_ID"
echo "  URL pública    : $CF_URL"
echo ""

# ── Build del frontend ────────────────────────────────────────────────────────
echo "Construyendo frontend..."
cd "$ROOT_DIR/frontend"

if [ ! -f .env ]; then
  echo "AVISO: no existe frontend/.env. Asegúrate de que VITE_API_URL está configurado."
fi

npm ci --silent
npm run build

# ── Subir a S3 ────────────────────────────────────────────────────────────────
echo "Subiendo a s3://$S3_BUCKET ..."
aws s3 sync dist/ "s3://$S3_BUCKET" \
  --delete \
  --region "$REGION" \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

# index.html sin caché para que CloudFront sirva siempre la última versión
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
  --region "$REGION" \
  --cache-control "no-cache,no-store,must-revalidate"

# ── Invalidar caché de CloudFront ─────────────────────────────────────────────
echo "Invalidando caché de CloudFront..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CF_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "  Invalidación: $INVALIDATION_ID (puede tardar ~1 min en propagarse)"
echo ""
echo "Frontend desplegado en: $CF_URL"
