const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb')

const db = DynamoDBDocumentClient.from(new DynamoDBClient())
const TABLE = process.env.TABLE_NAME

const response = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
})

exports.handler = async (event) => {
  try {
    const { Items } = await db.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'begins_with(PK, :prefix) AND attribute_exists(nota)',
      ExpressionAttributeValues: { ':prefix': 'RESULTADO#' },
    }))

    const porAlumno = {}
    for (const r of Items) {
      if (!porAlumno[r.alumnoId]) porAlumno[r.alumnoId] = { alumnoId: r.alumnoId, nombre: r.nombre || r.alumnoId, notas: [] }
      if (r.nota !== null) porAlumno[r.alumnoId].notas.push(r.nota)
    }

    const ranking = Object.values(porAlumno)
      .map((a) => ({ ...a, media: a.notas.reduce((s, n) => s + n, 0) / (a.notas.length || 1) }))
      .sort((a, b) => b.media - a.media)

    return response(200, ranking)
  } catch (err) {
    console.error(err)
    return response(500, { message: 'Error interno' })
  }
}
