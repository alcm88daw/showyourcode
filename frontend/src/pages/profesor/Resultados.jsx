import { useEffect, useState } from 'react'
import { getResultados } from '../../services/resultados'
import { getUTs } from '../../services/uts'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { Select } from '../../components/common/Input'
import Spinner from '../../components/common/Spinner'

function BarChart({ data }) {
  if (!data.length) return null
  const max = Math.max(...data.map((d) => d.media), 1)
  return (
    <div className="flex items-end gap-3 h-36 px-2">
      {data.map(({ titulo, media, count }) => (
        <div key={titulo} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <span className="text-xs text-gray-400">{media.toFixed(1)}</span>
          <div className="w-full rounded-t-sm bg-app-blue/80 transition-all" style={{ height: `${(media / 10) * 100}%` }} title={`${titulo}: ${media.toFixed(1)}/10 (${count} tests)`} />
          <span className="text-xs text-gray-500 truncate w-full text-center" title={titulo}>{titulo.length > 10 ? titulo.slice(0, 10) + '…' : titulo}</span>
        </div>
      ))}
    </div>
  )
}

export default function Resultados() {
  const [resultados, setResultados] = useState([])
  const [uts, setUts] = useState({})
  const [filtroUt, setFiltroUt] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getResultados(), getUTs()])
      .then(([res, lista]) => {
        setResultados(Array.isArray(res) ? res : [])
        const mapa = {}
        if (Array.isArray(lista)) lista.forEach((u) => { mapa[u.ut_id] = u.titulo })
        setUts(mapa)
      })
      .catch(() => setError('Error al cargar los resultados'))
      .finally(() => setCargando(false))
  }, [])

  const filtrados = filtroUt ? resultados.filter((r) => r.ut_id === filtroUt) : resultados

  const chartData = Object.entries(
    resultados.reduce((acc, r) => {
      const titulo = uts[r.ut_id] ?? r.ut_id
      if (!acc[titulo]) acc[titulo] = { suma: 0, count: 0 }
      if (r.nota !== null && r.nota !== undefined) { acc[titulo].suma += r.nota; acc[titulo].count++ }
      return acc
    }, {})
  ).map(([titulo, { suma, count }]) => ({ titulo, media: count ? suma / count : 0, count }))

  const exportarCSV = () => {
    const csv = ['alumno;ut;nota;correctas;total;fecha',
      ...filtrados.map((r) => `${r.alumno_nombre ?? r.alumno_id};${uts[r.ut_id] ?? r.ut_id};${r.nota ?? ''};${r.correctas ?? ''};${r.total ?? ''};${r.fecha}`)
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'resultados.csv'
    a.click()
  }

  if (cargando) return <Spinner />

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Resultados</h1>
          <p className="text-gray-400 text-sm mt-1">{resultados.length} tests realizados</p>
        </div>
        <Button variant="secondary" onClick={exportarCSV} disabled={!filtrados.length}>Exportar CSV</Button>
      </div>

      {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

      {chartData.length > 0 && (
        <Card className="p-6 mb-6">
          <p className="text-sm font-medium text-gray-400 mb-4">Media por UT</p>
          <BarChart data={chartData} />
        </Card>
      )}

      <div className="flex items-center gap-3 mb-4">
        <Select value={filtroUt} onChange={(e) => setFiltroUt(e.target.value)} className="max-w-xs">
          <option value="">Todas las UTs</option>
          {Object.entries(uts).map(([id, titulo]) => <option key={id} value={id}>{titulo}</option>)}
        </Select>
        <span className="text-gray-500 text-sm">{filtrados.length} resultados</span>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No hay resultados todavía.</div>
      ) : (
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-app-border">
                {['Alumno','UT','Nota','Correctas','Fecha'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filtrados].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map((r) => (
                <tr key={`${r.alumno_id}-${r.ut_id_timestamp}`} className="border-b border-app-border/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-gray-400 text-sm">{r.alumno_nombre ?? r.alumno_id.slice(0, 8) + '…'}</td>
                  <td className="px-4 py-3 text-white text-sm">{uts[r.ut_id] ?? r.ut_id}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${r.nota >= 5 ? 'text-app-green' : 'text-red-400'}`}>
                      {r.nota !== null && r.nota !== undefined ? `${r.nota} / 10` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{r.correctas ?? '—'} / {r.total ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{new Date(r.fecha).toLocaleString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
