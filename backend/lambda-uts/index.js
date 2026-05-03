const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb')
const { randomUUID } = require('crypto')

const db = DynamoDBDocumentClient.from(new DynamoDBClient())
const TABLE = process.env.TABLE_NAME

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
      const { Items } = await db.send(new ScanCommand({ TableName: TABLE, FilterExpression: 'begins_with(PK, :prefix)', ExpressionAttributeValues: { ':prefix': 'UT#' } }))
      return response(200, Items)
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body)
      const item = { PK: `UT#${randomUUID()}`, SK: 'META', ...body, creadoEn: new Date().toISOString() }
      await db.send(new PutCommand({ TableName: TABLE, Item: item }))
      return response(201, item)
    }

    if (method === 'PUT') {
      const body = JSON.parse(event.body)
      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `UT#${id}`, SK: 'META' },
        UpdateExpression: 'SET nombre = :n',
        ExpressionAttributeValues: { ':n': body.nombre },
      }))
      return response(200, { id })
    }

    if (method === 'DELETE') {
      await db.send(new DeleteCommand({ TableName: TABLE, Key: { PK: `UT#${id}`, SK: 'META' } }))
      return response(204, {})
    }

    return response(405, { message: 'Método no permitido' })
  } catch (err) {
    console.error(err)
    return response(500, { message: 'Error interno' })
  }
}
