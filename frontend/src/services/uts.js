import { fetchAuthSession } from 'aws-amplify/auth'

const API = import.meta.env.VITE_API_URL

const authHeaders = async () => {
  const session = await fetchAuthSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.tokens?.idToken?.toString()}`,
  }
}

export const getUTs = async () => {
  const res = await fetch(`${API}/uts`, { headers: await authHeaders() })
  return res.json()
}

export const createUT = async (data) => {
  const res = await fetch(`${API}/uts`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export const updateUT = async (id, data) => {
  const res = await fetch(`${API}/uts/${id}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export const deleteUT = async (id) => {
  await fetch(`${API}/uts/${id}`, { method: 'DELETE', headers: await authHeaders() })
}
