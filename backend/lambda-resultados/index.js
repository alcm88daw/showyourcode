const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb')

const db = DynamoDBDocumentClient.from(new DynamoDBClient())
const RESULTADOS_TABLE = process.env.RESULTADOS_TABLE
const USUARIOS_TABLE = process.env.USUARIOS_TABLE

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

      const nota = calcularNota(body.respuestas, body.respuestas_correctas)
      const correctas = body.correctas ?? 0
      const total = body.total ?? 0

      const resultado = {
        alumno_id,
        ut_id_timestamp: `${body.ut_id}#${timestamp}`,
        ut_id: body.ut_id,
        respuestas: body.respuestas,
        nota,
        correctas,
        total,
        grupo: body.grupo || '',
        fecha: timestamp,
      }

      await db.send(new PutCommand({ TableName: RESULTADOS_TABLE, Item: resultado }))

      // Actualizar contadores atómicos en la tabla Usuarios
      await db.send(new UpdateCommand({
        TableName: USUARIOS_TABLE,
        Key: { user_id: alumno_id },
        UpdateExpression: 'ADD correctas_total :c, intentos_total :i',
        ExpressionAttributeValues: { ':c': correctas, ':i': 1 },
      }))

      return response(201, resultado)
    }

    if (method === 'GET') {
      const alumno_id = event.requestContext?.authorizer?.claims?.sub
      const role = event.requestContext?.authorizer?.claims?.['custom:role']

      if (role === 'profesor') {
        const { Items } = await db.send(new ScanCommand({ TableName: RESULTADOS_TABLE }))
        return response(200, Items)
      }

      const { Items } = await db.send(new QueryCommand({
        TableName: RESULTADOS_TABLE,
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
