import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRanking } from '../../services/resultados'

export default function Ranking() {
  const navigate = useNavigate()
  const [ranking, setRanking] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getRanking()
      .then((data) => setRanking(Array.isArray(data) ? data : []))
      .catch(() => setError('Error al cargar el ranking'))
      .finally(() => setCargando(false))
  }, [])

  return (
    <main style={{ padding: '1rem', maxWidth: '600px' }}>
      <button onClick={() => navigate('/alumno')} style={{ marginBottom: '1rem' }}>← Volver</button>
      <h1>Ranking</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {cargando ? (
        <p>Cargando...</p>
      ) : ranking.length === 0 ? (
        <p>Todavía no hay resultados.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>#</th>
              <th style={{ padding: '0.5rem' }}>Alumno</th>
              <th style={{ padding: '0.5rem' }}>Media</th>
              <th style={{ padding: '0.5rem' }}>Intentos</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((entry, i) => (
              <tr key={entry.alumno_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{i + 1}</td>
                <td style={{ padding: '0.5rem' }}>{entry.alumno_id}</td>
                <td style={{ padding: '0.5rem' }}>{entry.media.toFixed(1)} / 10</td>
                <td style={{ padding: '0.5rem' }}>{entry.intentos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
