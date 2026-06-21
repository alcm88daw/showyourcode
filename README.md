# ShowYourCode

Aplicación de tests educativos con roles profesor/alumno, desplegada en AWS con SAM.

## Stack

- **Frontend**: React + Vite
- **Backend**: AWS Lambda (Node.js) + API Gateway
- **Auth**: Amazon Cognito
- **DB**: Amazon DynamoDB
- **Accesibilidad**: Amazon Polly + Translate
- **IaC**: AWS SAM (`template.yaml`)
- **CI/CD**: GitHub Actions

## Estructura

```
showyourcode/
├── frontend/        # React app
├── backend/         # Lambdas por dominio
└── template.yaml    # Infraestructura SAM
```

## Despliegue local

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend (SAM local)
sam build && sam local start-api
```

## Despliegue en AWS

```bash
sam build && sam deploy --guided
```
