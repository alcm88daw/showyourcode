import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getUTs } from '../../services/uts'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { DifficultyBadge } from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'

export default function AlumnoDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [uts, setUts] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getUTs()
      .then((d) => setUts(Array.isArray(d) ? d.filter((u) => u.activa) : []))
      .catch(() => setError('Error al cargar los tests'))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <header className="border-b border-app-border bg-app-surface px-6 py-4 flex items-center justify-between">
        <span className="text-app-blue font-bold text-lg">TestsApp</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm hidden sm:block">{user?.email}</span>
          <Button variant="ghost" className="text-sm" onClick={() => navigate('/alumno/ranking')}>Ranking</Button>
          <Button variant="secondary" className="text-sm" onClick={logout}>Salir</Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-1">Mis Tests</h1>
        <p className="text-gray-400 text-sm mb-8">Selecciona una unidad de trabajo para comenzar</p>

        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

        {cargando ? <Spinner /> : uts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-2">No hay tests disponibles</p>
            <p className="text-gray-600 text-sm">El profesor activará las unidades cuando estén listas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...uts].sort((a, b) => a.orden - b.orden).map((ut) => (
              <Card key={ut.ut_id} className="p-6 hover:border-app-blue/50 transition-colors cursor-pointer group" onClick={() => navigate(`/alumno/test/${ut.ut_id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-white font-semibold text-base group-hover:text-app-blue transition-colors">{ut.titulo}</h2>
                </div>
                {ut.descripcion && <p className="text-gray-400 text-sm mb-4 line-clamp-2">{ut.descripcion}</p>}
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-xs text-gray-500">Reintentos: {ut.reintentos_permitidos}</span>
                  <Button className="text-sm px-3 py-1.5" onClick={(e) => { e.stopPropagation(); navigate(`/alumno/test/${ut.ut_id}`) }}>
                    Comenzar →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
