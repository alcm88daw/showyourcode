const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminDeleteUserCommand, AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider')
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')

const cognito = new CognitoIdentityProviderClient()
const db = DynamoDBDocumentClient.from(new DynamoDBClient())

const USER_POOL_ID = process.env.USER_POOL_ID
const USUARIOS_TABLE = process.env.USUARIOS_TABLE
const RESULTADOS_TABLE = process.env.RESULTADOS_TABLE

const response = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
})

exports.handler = async (event) => {
  const method = event.httpMethod
  const id = event.pathParameters?.id

  try {
    if (method === 'GET') {
      const { Items } = await db.send(new ScanCommand({
        TableName: USUARIOS_TABLE,
        FilterExpression: 'rol = :r',
        ExpressionAttributeValues: { ':r': 'alumno' },
      }))
      return response(200, Items ?? [])
    }

    if (method === 'POST') {
      const { nombre, email, grupo } = JSON.parse(event.body)

      const tempPassword = generarPasswordTemporal()

      // Crear usuario en Cognito con contraseña temporal
      const { User } = await cognito.send(new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        TemporaryPassword: tempPassword,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: nombre },
          { Name: 'custom:role', Value: 'alumno' },
        ],
        MessageAction: 'SUPPRESS', // el profesor gestiona la entrega de credenciales
      }))

      const user_id = User.Attributes.find((a) => a.Name === 'sub')?.Value

      // Registrar en DynamoDB
      const item = {
        user_id,
        nombre,
        email,
        rol: 'alumno',
        grupo: grupo || '',
        correctas_total: 0,
        intentos_total: 0,
        created_at: new Date().toISOString(),
      }
      await db.send(new PutCommand({ TableName: USUARIOS_TABLE, Item: item }))

      return response(201, { ...item, tempPassword })
    }

    if (method === 'PUT') {
      const { nombre, grupo } = JSON.parse(event.body)

      await db.send(new UpdateCommand({
        TableName: USUARIOS_TABLE,
        Key: { user_id: id },
        UpdateExpression: 'SET nombre = :n, grupo = :g',
        ExpressionAttributeValues: { ':n': nombre, ':g': grupo || '' },
      }))

      return response(200, { user_id: id })
    }

    if (method === 'DELETE') {
      const { Item: usuario } = await db.send(new GetCommand({
        TableName: USUARIOS_TABLE,
        Key: { user_id: id },
      }))

      if (usuario?.email) {
        await cognito.send(new AdminDeleteUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: usuario.email,
        }))
      }

      // Borrado en cascada: eliminar todos los resultados del alumno
      if (RESULTADOS_TABLE) {
        const { Items: resultados } = await db.send(new QueryCommand({
          TableName: RESULTADOS_TABLE,
          KeyConditionExpression: 'alumno_id = :id',
          ExpressionAttributeValues: { ':id': id },
        }))
        await Promise.all((resultados ?? []).map((r) =>
          db.send(new DeleteCommand({
            TableName: RESULTADOS_TABLE,
            Key: { alumno_id: r.alumno_id, ut_id_timestamp: r.ut_id_timestamp },
          }))
        ))
      }

      await db.send(new DeleteCommand({ TableName: USUARIOS_TABLE, Key: { user_id: id } }))
      return response(204, {})
    }

    return response(405, { message: 'Método no permitido' })
  } catch (err) {
    console.error(err)
    return response(500, { message: err.message || 'Error interno' })
  }
}

function generarPasswordTemporal() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'
  const numeros = '23456789'
  const especiales = '!@#$'
  let pwd = especiales[Math.floor(Math.random() * especiales.length)]
  pwd += numeros[Math.floor(Math.random() * numeros.length)]
  for (let i = 0; i < 8; i++) pwd += letras[Math.floor(Math.random() * letras.length)]
  return pwd.split('').sort(() => Math.random() - 0.5).join('')
}
