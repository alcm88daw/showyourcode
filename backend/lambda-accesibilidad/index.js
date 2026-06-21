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
      const { texto, idiomaOrigen = 'es', idiomaDestino } = body
      const { TranslatedText } = await translate.send(new TranslateTextCommand({
        Text: texto,
        SourceLanguageCode: idiomaOrigen,
        TargetLanguageCode: idiomaDestino,
      }))
      return response(200, { traduccion: TranslatedText })
    }

    return response(404, { message: 'Ruta no encontrada' })
  } catch (err) {
    console.error(err)
    return response(500, { message: 'Error interno' })
  }
}
