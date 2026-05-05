const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb')
const { randomUUID } = require('crypto')

const db = DynamoDBDocumentClient.from(new DynamoDBClient())
const TABLE = process.env.UTS_TABLE

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
      const { Items } = await db.send(new ScanCommand({ TableName: TABLE }))
      return response(200, Items)
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body)
      const item = {
        ut_id: randomUUID(),
        titulo: body.titulo,
        descripcion: body.descripcion || '',
        activa: body.activa ?? false,
        reintentos_permitidos: body.reintentos_permitidos ?? 1,
        created_by: event.requestContext?.authorizer?.claims?.sub,
        orden: body.orden ?? 0,
        created_at: new Date().toISOString(),
      }
      await db.send(new PutCommand({ TableName: TABLE, Item: item }))
      return response(201, item)
    }

    if (method === 'PUT') {
      const body = JSON.parse(event.body)
      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { ut_id: id },
        UpdateExpression: 'SET titulo = :t, descripcion = :d, activa = :a, reintentos_permitidos = :r, orden = :o',
        ExpressionAttributeValues: {
          ':t': body.titulo,
          ':d': body.descripcion ?? '',
          ':a': body.activa ?? false,
          ':r': body.reintentos_permitidos ?? 1,
          ':o': body.orden ?? 0,
        },
      }))
      return response(200, { ut_id: id })
    }

    if (method === 'DELETE') {
      await db.send(new DeleteCommand({ TableName: TABLE, Key: { ut_id: id } }))
      return response(204, {})
    }

    return response(405, { message: 'Método no permitido' })
  } catch (err) {
    console.error(err)
    return response(500, { message: 'Error interno' })
  }
}
