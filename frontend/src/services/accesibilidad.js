import { fetchAuthSession } from 'aws-amplify/auth'

const API = import.meta.env.VITE_API_URL

const authHeaders = async () => {
  const session = await fetchAuthSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.tokens?.idToken?.toString()}`,
  }
}

export const traducirTexto = async (texto, idiomaDestino) => {
  const res = await fetch(`${API}/accesibilidad/traducir`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ texto, idiomaDestino }),
  })
  const data = await res.json()
  return data.traduccion ?? texto
}

export const leerTexto = async (texto, idioma = 'es-ES', voz = 'Lucia') => {
  const res = await fetch(`${API}/accesibilidad/tts`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ texto, idioma, voz }),
  })
  const data = await res.json()
  return data.audio // base64 mp3
}

export function reproducirAudio(base64) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.addEventListener('ended', () => URL.revokeObjectURL(url))
  audio.play()
  return audio
}

// Idiomas disponibles con su voz de Polly correspondiente
export const IDIOMAS = [
  { codigo: 'es', label: 'Español',    pollyIdioma: 'es-ES', pollyVoz: 'Lucia'   },
  { codigo: 'en', label: 'English',    pollyIdioma: 'en-US', pollyVoz: 'Joanna'  },
  { codigo: 'fr', label: 'Français',   pollyIdioma: 'fr-FR', pollyVoz: 'Celine'  },
  { codigo: 'de', label: 'Deutsch',    pollyIdioma: 'de-DE', pollyVoz: 'Marlene' },
  { codigo: 'pt', label: 'Português',  pollyIdioma: 'pt-PT', pollyVoz: 'Ines'    },
  { codigo: 'ca', label: 'Català',     pollyIdioma: 'ca-ES', pollyVoz: 'Arlet'   },
]
