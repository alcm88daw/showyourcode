import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getUTs } from '../../services/uts'

export default function AlumnoDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [uts, setUts] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getUTs()
      .then((data) => setUts(Array.isArray(data) ? data.filter((ut) => ut.activa) : []))
      .catch(() => setError('Error al cargar los tests'))
      .finally(() => setCargando(false))
  }, [])

  return (
    <main style={{ padding: '1rem', maxWidth: '700px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Mis Tests</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => navigate('/alumno/ranking')}>Ranking</button>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </div>

      <p>Bienvenido, {user?.email}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : uts.length === 0 ? (
        <p>No hay tests disponibles en este momento.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...uts].sort((a, b) => a.orden - b.orden).map((ut) => (
            <li key={ut.ut_id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{ut.titulo}</strong>
                  {ut.descripcion && <p style={{ margin: '0.25rem 0 0', color: '#555', fontSize: '0.9rem' }}>{ut.descripcion}</p>}
                  <small style={{ color: '#888' }}>Reintentos permitidos: {ut.reintentos_permitidos}</small>
                </div>
                <button onClick={() => navigate(`/alumno/test/${ut.ut_id}`)}>
                  Hacer test →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
