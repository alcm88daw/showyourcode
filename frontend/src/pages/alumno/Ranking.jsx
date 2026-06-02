import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getRanking } from '../../services/resultados'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Spinner from '../../components/common/Spinner'

const MEDALLAS = ['🥇', '🥈', '🥉']

export default function Ranking() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ranking, setRanking] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getRanking()
      .then((d) => setRanking(Array.isArray(d) ? d : []))
      .catch(() => setError('Error al cargar el ranking'))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="min-h-screen bg-app-bg">
      <header className="border-b border-app-border bg-app-surface px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" className="text-sm" onClick={() => navigate('/alumno')}>← Volver</Button>
        <h1 className="text-white font-bold">Ranking</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

        {/* Top 3 podium */}
        {!cargando && ranking.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-10">
            {[ranking[1], ranking[0], ranking[2]].map((entry, i) => {
              const pos = i === 0 ? 2 : i === 1 ? 1 : 3
              const heights = ['h-20', 'h-28', 'h-16']
              const colors = ['border-gray-400', 'border-yellow-400', 'border-amber-600']
              return (
                <div key={entry.alumno_id} className="flex flex-col items-center gap-2">
                  <span className="text-2xl">{MEDALLAS[pos - 1]}</span>
                  <span className="text-white text-xs font-medium text-center max-w-20 truncate">{entry.nombre}</span>
                  <span className="text-app-green text-sm font-bold">{entry.media.toFixed(1)}</span>
                  <div className={`w-20 ${heights[i]} bg-app-surface border-t-2 ${colors[i]} rounded-t-lg flex items-start justify-center pt-2`}>
                    <span className="text-gray-400 font-bold text-lg">{pos}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {cargando ? <Spinner /> : ranking.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Todavía no hay resultados.</div>
        ) : (
          <Card>
            <table className="w-full">
              <thead>
                <tr className="border-b border-app-border">
                  {['#', 'Alumno', 'Grupo', 'Media', 'Tests'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, i) => {
                  const esYo = entry.alumno_id === user?.sub
                  return (
                    <tr key={entry.alumno_id} className={`border-b border-app-border/50 transition-colors ${esYo ? 'bg-app-blue/10' : 'hover:bg-white/[0.02]'}`}>
                      <td className="px-4 py-3 text-gray-400 font-bold text-sm">
                        {i < 3 ? MEDALLAS[i] : <span className="text-gray-500">{i + 1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${esYo ? 'text-app-blue' : 'text-white'}`}>
                          {entry.nombre}{esYo && <span className="ml-2 text-xs text-app-blue/70">(tú)</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {entry.grupo ? <span className="text-xs bg-app-surface text-gray-400 px-2 py-0.5 rounded-full">{entry.grupo}</span> : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${entry.media >= 5 ? 'text-app-green' : 'text-red-400'}`}>{entry.media.toFixed(1)}</span>
                        <span className="text-gray-600 text-xs">/10</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{entry.intentos_total ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  )
}
