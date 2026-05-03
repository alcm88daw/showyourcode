const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb')
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

  try {
    if (method === 'POST') {
      const body = JSON.parse(event.body)
      const alumnoId = event.requestContext?.authorizer?.claims?.sub
      const resultado = {
        PK: `RESULTADO#${randomUUID()}`,
        SK: 'META',
        alumnoId,
        utId: body.utId,
        respuestas: body.respuestas,
        nota: calcularNota(body.respuestas, body.respuestasCorrectas),
        fecha: new Date().toISOString(),
      }
      await db.send(new PutCommand({ TableName: TABLE, Item: resultado }))
      return response(201, resultado)
    }

    if (method === 'GET') {
      const { Items } = await db.send(new ScanCommand({
        TableName: TABLE,
        FilterExpression: 'begins_with(PK, :prefix)',
        ExpressionAttributeValues: { ':prefix': 'RESULTADO#' },
      }))
      return response(200, Items)
    }

    return response(405, { message: 'Método no permitido' })
  } catch (err) {
    console.error(err)
    return response(500, { message: 'Error interno' })
  }
}

function calcularNota(respuestas, correctas = {}) {
  if (!Object.keys(correctas).length) return null
  const acertadas = Object.entries(respuestas).filter(([id, r]) => correctas[id] === r).length
  return Math.round((acertadas / Object.keys(correctas).length) * 10 * 100) / 100
}
