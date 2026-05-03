import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getUTs } from '../../services/uts'

export default function AlumnoDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [uts, setUts] = useState([])

  useEffect(() => {
    getUTs().then(setUts)
  }, [])

  return (
    <main>
      <h1>Mis Tests</h1>
      <p>Bienvenido, {user?.name}</p>
      <ul>
        {uts.map((ut) => (
          <li key={ut.id}>
            {ut.nombre}
            <button onClick={() => navigate(`/alumno/test/${ut.id}`)}>Hacer test</button>
          </li>
        ))}
      </ul>
      <button onClick={() => navigate('/alumno/ranking')}>Ver ranking</button>
      <button onClick={logout}>Cerrar sesión</button>
    </main>
  )
}
