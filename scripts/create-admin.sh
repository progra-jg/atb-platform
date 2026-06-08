#!/bin/bash
# Script de création du compte administrateur ATB AgriTrace

API_URL="${API_URL:-http://localhost:3000}"
EMAIL="${ADMIN_EMAIL:-admin@agritrace.bj}"
PASSWORD="${ADMIN_PASSWORD:-Admin@2024!}"

echo "Creating admin account..."

RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Admin ATB\",
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"role\": \"admin\",
    \"company\": \"ATB AgriTrace Bénin\",
    \"country\": \"BJ\"
  }")

if echo "$RESPONSE" | grep -q "accessToken"; then
  echo "✓ Admin account created successfully"
  echo "Email: ${EMAIL}"
  echo "API Key: $(echo $RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)"
else
  echo "✗ Failed to create admin account"
  echo "$RESPONSE"
fi
