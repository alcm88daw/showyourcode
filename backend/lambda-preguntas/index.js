const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb')
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
  const utId = event.queryStringParameters?.utId

  try {
    if (method === 'GET') {
      const { Items } = await db.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': `UT#${utId}` },
      }))
      return response(200, Items.filter((i) => i.SK.startsWith('PREGUNTA#')))
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body)
      const preguntaId = randomUUID()
      const item = {
        PK: `UT#${body.utId}`,
        SK: `PREGUNTA#${preguntaId}`,
        id: preguntaId,
        enunciado: body.enunciado,
        opciones: body.opciones,
        respuestaCorrecta: body.respuestaCorrecta,
      }
      await db.send(new PutCommand({ TableName: TABLE, Item: item }))
      return response(201, item)
    }

    if (method === 'PUT') {
      const body = JSON.parse(event.body)
      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `UT#${body.utId}`, SK: `PREGUNTA#${id}` },
        UpdateExpression: 'SET enunciado = :e, opciones = :o, respuestaCorrecta = :r',
        ExpressionAttributeValues: {
          ':e': body.enunciado,
          ':o': body.opciones,
          ':r': body.respuestaCorrecta,
        },
      }))
      return response(200, { id })
    }

    if (method === 'DELETE') {
      const body = JSON.parse(event.body || '{}')
      await db.send(new DeleteCommand({
        TableName: TABLE,
        Key: { PK: `UT#${body.utId}`, SK: `PREGUNTA#${id}` },
      }))
      return response(204, {})
    }

    return response(405, { message: 'Método no permitido' })
  } catch (err) {
    console.error(err)
    return response(500, { message: 'Error interno' })
  }
}
