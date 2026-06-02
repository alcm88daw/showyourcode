import { fetchAuthSession } from 'aws-amplify/auth'

const API = import.meta.env.VITE_API_URL

const authHeaders = async () => {
  const session = await fetchAuthSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.tokens?.idToken?.toString()}`,
  }
}

export const getAlumnos = async () => {
  const res = await fetch(`${API}/usuarios`, { headers: await authHeaders() })
  return res.json()
}

export const createAlumno = async (data) => {
  const res = await fetch(`${API}/usuarios`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export const updateAlumno = async (id, data) => {
  const res = await fetch(`${API}/usuarios/${id}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export const deleteAlumno = async (id) => {
  await fetch(`${API}/usuarios/${id}`, { method: 'DELETE', headers: await authHeaders() })
}
