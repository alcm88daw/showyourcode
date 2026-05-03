import { fetchAuthSession } from 'aws-amplify/auth'

const API = import.meta.env.VITE_API_URL

const authHeaders = async () => {
  const session = await fetchAuthSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.tokens?.idToken?.toString()}`,
  }
}

export const getPreguntas = async (utId) => {
  const url = utId ? `${API}/preguntas?utId=${utId}` : `${API}/preguntas`
  const res = await fetch(url, { headers: await authHeaders() })
  return res.json()
}

export const createPregunta = async (data) => {
  const res = await fetch(`${API}/preguntas`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export const updatePregunta = async (id, data) => {
  const res = await fetch(`${API}/preguntas/${id}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export const deletePregunta = async (id) => {
  await fetch(`${API}/preguntas/${id}`, { method: 'DELETE', headers: await authHeaders() })
}
