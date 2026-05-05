const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb')
const { randomUUID } = require('crypto')

const db = DynamoDBDocumentClient.from(new DynamoDBClient())
const TABLE = process.env.PREGUNTAS_TABLE

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
        KeyConditionExpression: 'ut_id = :utId',
        ExpressionAttributeValues: { ':utId': utId },
      }))
      return response(200, Items)
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body)
      const item = {
        ut_id: body.ut_id,
        pregunta_id: randomUUID(),
        enunciado: body.enunciado,
        opciones: body.opciones,
        respuesta_correcta: body.respuesta_correcta,
        dificultad: body.dificultad ?? 1,
      }
      await db.send(new PutCommand({ TableName: TABLE, Item: item }))
      return response(201, item)
    }

    if (method === 'PUT') {
      const body = JSON.parse(event.body)
      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { ut_id: body.ut_id, pregunta_id: id },
        UpdateExpression: 'SET enunciado = :e, opciones = :o, respuesta_correcta = :r, dificultad = :d',
        ExpressionAttributeValues: {
          ':e': body.enunciado,
          ':o': body.opciones,
          ':r': body.respuesta_correcta,
          ':d': body.dificultad ?? 1,
        },
      }))
      return response(200, { pregunta_id: id })
    }

    if (method === 'DELETE') {
      const body = JSON.parse(event.body || '{}')
      await db.send(new DeleteCommand({
        TableName: TABLE,
        Key: { ut_id: body.ut_id, pregunta_id: id },
      }))
      return response(204, {})
    }

    return response(405, { message: 'Método no permitido' })
  } catch (err) {
    console.error(err)
    return response(500, { message: 'Error interno' })
  }
}
