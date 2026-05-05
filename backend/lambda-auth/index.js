const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb')

const db = DynamoDBDocumentClient.from(new DynamoDBClient())
const TABLE = process.env.USUARIOS_TABLE

// Cognito Post Confirmation trigger: asigna rol alumno y crea registro en tabla Usuarios
exports.handler = async (event) => {
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') return event

  const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider')
  const cognito = new CognitoIdentityProviderClient()

  await cognito.send(new AdminUpdateUserAttributesCommand({
    UserPoolId: event.userPoolId,
    Username: event.userName,
    UserAttributes: [{ Name: 'custom:role', Value: 'alumno' }],
  }))

  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      user_id: event.request.userAttributes.sub,
      nombre: event.request.userAttributes.name || event.userName,
      email: event.request.userAttributes.email,
      rol: 'alumno',
      grupo: '',
      correctas_total: 0,
      intentos_total: 0,
      created_at: new Date().toISOString(),
    },
  }))

  return event
}
