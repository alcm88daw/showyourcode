const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')

const db = DynamoDBDocumentClient.from(new DynamoDBClient())
const USUARIOS_TABLE = process.env.USUARIOS_TABLE

const response = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
})

exports.handler = async (event) => {
  try {
    const grupo = event.queryStringParameters?.grupo

    let items
    if (grupo) {
      // Consulta eficiente por grupo usando el GSI
      const { Items } = await db.send(new QueryCommand({
        TableName: USUARIOS_TABLE,
        IndexName: 'grupo-index',
        KeyConditionExpression: 'grupo = :g',
        ExpressionAttributeValues: { ':g': grupo },
      }))
      items = Items
    } else {
      // Sin filtro: scan sobre Usuarios (una fila por alumno, mucho más eficiente que escanear Resultados)
      const { Items } = await db.send(new ScanCommand({
        TableName: USUARIOS_TABLE,
        FilterExpression: 'attribute_exists(correctas_total)',
      }))
      items = Items
    }

    const ranking = items
      .map((u) => ({
        alumno_id: u.user_id,
        nombre: u.nombre || u.email || u.user_id,
        grupo: u.grupo || '',
        correctas_total: u.correctas_total ?? 0,
        intentos_total: u.intentos_total ?? 0,
        media: u.intentos_total > 0 && u.suma_notas != null
          ? Math.round((u.suma_notas / u.intentos_total) * 100) / 100
          : 0,
      }))
      .sort((a, b) => b.media - a.media)

    return response(200, ranking)
  } catch (err) {
    console.error(err)
    return response(500, { message: 'Error interno' })
  }
}
