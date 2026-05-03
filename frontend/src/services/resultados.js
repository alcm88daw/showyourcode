import { fetchAuthSession } from 'aws-amplify/auth'

const API = import.meta.env.VITE_API_URL

const authHeaders = async () => {
  const session = await fetchAuthSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.tokens?.idToken?.toString()}`,
  }
}

export const saveResultado = async (data) => {
  const res = await fetch(`${API}/resultados`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export const getResultados = async () => {
  const res = await fetch(`${API}/resultados`, { headers: await authHeaders() })
  return res.json()
}

export const getRanking = async () => {
  const res = await fetch(`${API}/ranking`, { headers: await authHeaders() })
  return res.json()
}
