#!/bin/bash
# Configura un presupuesto de 1$/mes con bloqueo automático de Lambda.
# Ejecutar una sola vez después de `sam deploy`.
#
# Uso: ./scripts/setup-budget.sh [email]
# Ejemplo: ./scripts/setup-budget.sh acm.alfredo@gmail.com
set -euo pipefail

STACK_NAME="testsapp"
DEPLOY_REGION="eu-south-2"
BUDGET_REGION="us-east-1"   # Budgets usa siempre us-east-1
EMAIL="${1:-acm.alfredo@gmail.com}"
BUDGET_NAME="testsapp-monthly"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Cuenta AWS : $ACCOUNT_ID"
echo "Email      : $EMAIL"
echo ""

# ── 1. SNS topic en us-east-1 (Budgets solo puede notificar a tópicos en us-east-1)
echo "[1/6] Creando SNS topic..."
TOPIC_ARN=$(aws sns create-topic \
  --name testsapp-budget-alerts \
  --region "$BUDGET_REGION" \
  --query TopicArn --output text)

aws sns set-topic-attributes \
  --topic-arn "$TOPIC_ARN" \
  --attribute-name Policy \
  --attribute-value "{
    \"Version\":\"2012-10-17\",
    \"Statement\":[{
      \"Effect\":\"Allow\",
      \"Principal\":{\"Service\":\"budgets.amazonaws.com\"},
      \"Action\":\"sns:Publish\",
      \"Resource\":\"$TOPIC_ARN\"
    }]
  }" \
  --region "$BUDGET_REGION"

aws sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol email \
  --notification-endpoint "$EMAIL" \
  --region "$BUDGET_REGION" > /dev/null

echo "   Topic: $TOPIC_ARN"
echo "   Confirma la suscripción en el email que recibirás en $EMAIL"

# ── 2. IAM: política de denegación (IAM es global, sin región)
echo "[2/6] Creando política IAM de denegación..."
POLICY_ARN=$(aws iam create-policy \
  --policy-name testsapp-deny-spending \
  --description "Se adjunta a los roles Lambda cuando se supera el presupuesto mensual" \
  --policy-document '{
    "Version":"2012-10-17",
    "Statement":[{
      "Sid":"DenyAllSpending",
      "Effect":"Deny",
      "NotAction":["iam:*","budgets:*","sts:GetCallerIdentity"],
      "Resource":"*"
    }]
  }' \
  --query Policy.Arn --output text 2>/dev/null \
  || aws iam list-policies \
       --query "Policies[?PolicyName=='testsapp-deny-spending'].Arn" \
       --output text)
echo "   Policy: $POLICY_ARN"

# ── 3. IAM: rol de ejecución que usa Budgets para adjuntar la política
echo "[3/6] Creando rol de ejecución para Budget Actions..."
EXEC_ROLE_ARN=$(aws iam create-role \
  --role-name testsapp-budget-actions-role \
  --assume-role-policy-document "{
    \"Version\":\"2012-10-17\",
    \"Statement\":[{
      \"Effect\":\"Allow\",
      \"Principal\":{\"Service\":\"budgets.amazonaws.com\"},
      \"Action\":\"sts:AssumeRole\",
      \"Condition\":{
        \"StringEquals\":{
          \"aws:SourceAccount\":\"$ACCOUNT_ID\"
        }
      }
    }]
  }" \
  --query Role.Arn --output text 2>/dev/null \
  || aws iam get-role \
       --role-name testsapp-budget-actions-role \
       --query Role.Arn --output text)

aws iam put-role-policy \
  --role-name testsapp-budget-actions-role \
  --policy-name AllowIAMPolicyActions \
  --policy-document '{
    "Version":"2012-10-17",
    "Statement":[{
      "Effect":"Allow",
      "Action":["iam:AttachRolePolicy","iam:DetachRolePolicy"],
      "Resource":"*"
    }]
  }'
echo "   Execution role: $EXEC_ROLE_ARN"

# ── 4. Obtener nombres de roles Lambda del stack de CloudFormation
echo "[4/6] Obteniendo roles Lambda del stack $STACK_NAME..."
ROLE_NAMES=$(aws cloudformation describe-stack-resources \
  --stack-name "$STACK_NAME" \
  --region "$DEPLOY_REGION" \
  --query "StackResources[?ResourceType=='AWS::IAM::Role'].PhysicalResourceId" \
  --output text)

if [ -z "$ROLE_NAMES" ]; then
  echo "   ERROR: No se encontraron roles en el stack $STACK_NAME. ¿Está desplegado?"
  exit 1
fi

ROLES_JSON=$(echo "$ROLE_NAMES" | tr '\t' '\n' | jq -R . | jq -sc .)
echo "   Roles: $ROLES_JSON"

# ── 5. Crear el presupuesto
echo "[5/6] Creando presupuesto $BUDGET_NAME (1 USD/mes)..."
aws budgets create-budget \
  --account-id "$ACCOUNT_ID" \
  --budget "{
    \"BudgetName\":\"$BUDGET_NAME\",
    \"BudgetLimit\":{\"Amount\":\"1\",\"Unit\":\"USD\"},
    \"TimeUnit\":\"MONTHLY\",
    \"BudgetType\":\"COST\"
  }" \
  --notifications-with-subscribers "[
    {
      \"Notification\":{
        \"NotificationType\":\"ACTUAL\",
        \"ComparisonOperator\":\"GREATER_THAN\",
        \"Threshold\":80,
        \"ThresholdType\":\"PERCENTAGE\"
      },
      \"Subscribers\":[{\"SubscriptionType\":\"SNS\",\"Address\":\"$TOPIC_ARN\"}]
    },
    {
      \"Notification\":{
        \"NotificationType\":\"ACTUAL\",
        \"ComparisonOperator\":\"GREATER_THAN\",
        \"Threshold\":100,
        \"ThresholdType\":\"PERCENTAGE\"
      },
      \"Subscribers\":[{\"SubscriptionType\":\"SNS\",\"Address\":\"$TOPIC_ARN\"}]
    }
  ]" 2>/dev/null \
  && echo "   Presupuesto creado." \
  || echo "   Presupuesto ya existía, continuando..."

# ── 6. Crear la acción de bloqueo
echo "[6/6] Creando Budget Action (bloqueo automático al 100%)..."
aws budgets create-budget-action \
  --account-id "$ACCOUNT_ID" \
  --budget-name "$BUDGET_NAME" \
  --notification-type ACTUAL \
  --action-type APPLY_IAM_POLICY \
  --action-threshold "{\"ActionThresholdValue\":100,\"ActionThresholdType\":\"PERCENTAGE\"}" \
  --definition "{
    \"IamActionDefinition\":{
      \"PolicyArn\":\"$POLICY_ARN\",
      \"Roles\":$ROLES_JSON
    }
  }" \
  --execution-role-arn "$EXEC_ROLE_ARN" \
  --approval-model AUTOMATIC \
  --subscribers "[{\"SubscriptionType\":\"SNS\",\"Address\":\"$TOPIC_ARN\"}]"

echo ""
echo "Budget Action configurado:"
echo "  Límite mensual : 1 USD"
echo "  Alerta al 80%  : email a $EMAIL"
echo "  Al 100%        : bloqueo automático de todos los roles Lambda"
echo ""
echo "Recuerda confirmar el email de suscripción SNS."
