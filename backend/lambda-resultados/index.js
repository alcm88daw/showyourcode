const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')

const db = DynamoDBDocumentClient.from(new DynamoDBClient())
const TABLE = process.env.RESULTADOS_TABLE

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
      const alumno_id = event.requestContext?.authorizer?.claims?.sub
      const timestamp = new Date().toISOString()
      const resultado = {
        alumno_id,
        ut_id_timestamp: `${body.ut_id}#${timestamp}`,
        ut_id: body.ut_id,
        respuestas: body.respuestas,
        nota: calcularNota(body.respuestas, body.respuestas_correctas),
        correctas: body.correctas,
        total: body.total,
        grupo: body.grupo || '',
        fecha: timestamp,
      }
      await db.send(new PutCommand({ TableName: TABLE, Item: resultado }))
      return response(201, resultado)
    }

    if (method === 'GET') {
      const alumno_id = event.requestContext?.authorizer?.claims?.sub
      const role = event.requestContext?.authorizer?.claims?.['custom:role']

      // El profesor ve todos los resultados; el alumno solo los suyos
      if (role === 'profesor') {
        const { Items } = await db.send(new ScanCommand({ TableName: TABLE }))
        return response(200, Items)
      }

      const { Items } = await db.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'alumno_id = :id',
        ExpressionAttributeValues: { ':id': alumno_id },
      }))
      return response(200, Items)
    }

    return response(405, { message: 'Método no permitido' })
  } catch (err) {
    console.error(err)
    return response(500, { message: 'Error interno' })
  }
}

function calcularNota(respuestas = {}, correctas = {}) {
  const total = Object.keys(correctas).length
  if (!total) return null
  const acertadas = Object.entries(respuestas).filter(([id, r]) => correctas[id] === r).length
  return Math.round((acertadas / total) * 10 * 100) / 100
}
