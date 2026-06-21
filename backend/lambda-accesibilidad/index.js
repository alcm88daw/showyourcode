const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly')
const { TranslateClient, TranslateTextCommand } = require('@aws-sdk/client-translate')

const polly = new PollyClient()
// Translate no está disponible en eu-south-2
const translate = new TranslateClient({ region: 'eu-west-1' })

const response = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
})

// Traduce un texto con reintentos ante throttling; si falla, devuelve el original
async function traducirUno(texto, origen, destino, intentos = 3) {
  if (!texto || !texto.trim()) return texto
  for (let i = 0; i < intentos; i++) {
    try {
      const { TranslatedText } = await translate.send(new TranslateTextCommand({
        Text: texto, SourceLanguageCode: origen, TargetLanguageCode: destino,
      }))
      return TranslatedText
    } catch (err) {
      if (err.name === 'ThrottlingException' && i < intentos - 1) {
        await new Promise((r) => setTimeout(r, 200 * (i + 1)))
        continue
      }
      console.error('Error traduciendo:', texto.slice(0, 50), err.name)
      return texto
    }
  }
  return texto
}

// Ejecuta fn sobre items con un máximo de `limite` en paralelo, preservando el orden
async function mapLimit(items, limite, fn) {
  const resultados = new Array(items.length)
  let idx = 0
  const worker = async () => {
    while (idx < items.length) {
      const i = idx++
      resultados[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, items.length) }, worker))
  return resultados
}

exports.handler = async (event) => {
  const path = event.path
  const body = JSON.parse(event.body || '{}')

  try {
    if (path.endsWith('/tts')) {
      const { texto, idioma = 'es-ES', voz = 'Lucia' } = body
      const { AudioStream } = await polly.send(new SynthesizeSpeechCommand({
        Text: texto,
        LanguageCode: idioma,
        VoiceId: voz,
        OutputFormat: 'mp3',
      }))
      const audioBase64 = Buffer.from(await AudioStream.transformToByteArray()).toString('base64')
      return response(200, { audio: audioBase64, formato: 'mp3' })
    }

    if (path.endsWith('/traducir')) {
      const { texto, textos, idiomaOrigen = 'es', idiomaDestino } = body

      // Modo batch: traduce un array de textos en una sola petición
      if (Array.isArray(textos)) {
        const traducciones = await mapLimit(textos, 5, (t) => traducirUno(t, idiomaOrigen, idiomaDestino))
        return response(200, { traducciones })
      }

      // Modo individual (compatibilidad)
      const traduccion = await traducirUno(texto, idiomaOrigen, idiomaDestino)
      return response(200, { traduccion })
    }

    return response(404, { message: 'Ruta no encontrada' })
  } catch (err) {
    console.error(err)
    return response(500, { message: 'Error interno' })
  }
}
