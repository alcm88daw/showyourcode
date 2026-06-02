import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUTs } from '../../services/uts'
import { getResultados } from '../../services/resultados'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <Card className="p-6">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </Card>
  )
}

export default function ProfesorDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalUTs: 0, utsActivas: 0, totalResultados: 0 })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([getUTs(), getResultados()])
      .then(([uts, resultados]) => {
        const lista = Array.isArray(uts) ? uts : []
        setStats({
          totalUTs: lista.length,
          utsActivas: lista.filter((u) => u.activa).length,
          totalResultados: Array.isArray(resultados) ? resultados.length : 0,
        })
      })
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-1">Inicio</h1>
      <p className="text-gray-400 text-sm mb-8">Resumen de la actividad</p>

      {cargando ? <Spinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Unidades de trabajo" value={stats.totalUTs} sub={`${stats.utsActivas} activas`} color="text-app-blue" />
          <StatCard label="Tests realizados" value={stats.totalResultados} color="text-app-green" />
          <StatCard label="Alumnos" value="—" sub="Ver en Alumnos" />
        </div>
      )}

      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Acceso rápido</h2>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate('/profesor/uts')}>Gestión de UTs</Button>
        <Button variant="secondary" onClick={() => navigate('/profesor/alumnos')}>Gestión de alumnos</Button>
        <Button variant="secondary" onClick={() => navigate('/profesor/resultados')}>Ver resultados</Button>
      </div>
    </div>
  )
}
