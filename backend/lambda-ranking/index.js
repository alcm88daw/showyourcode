const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb')

const db = DynamoDBDocumentClient.from(new DynamoDBClient())
const TABLE = process.env.RESULTADOS_TABLE

const response = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
})

exports.handler = async (event) => {
  try {
    const { Items } = await db.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'attribute_exists(nota)',
    }))

    const porAlumno = {}
    for (const r of Items) {
      if (!porAlumno[r.alumno_id]) {
        porAlumno[r.alumno_id] = { alumno_id: r.alumno_id, grupo: r.grupo || '', notas: [] }
      }
      if (r.nota !== null) porAlumno[r.alumno_id].notas.push(r.nota)
    }

    const ranking = Object.values(porAlumno)
      .map((a) => ({
        ...a,
        media: a.notas.reduce((s, n) => s + n, 0) / (a.notas.length || 1),
        intentos: a.notas.length,
      }))
      .sort((a, b) => b.media - a.media)

    return response(200, ranking)
  } catch (err) {
    console.error(err)
    return response(500, { message: 'Error interno' })
  }
}
