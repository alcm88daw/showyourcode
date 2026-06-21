import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUTs, createUT, updateUT, deleteUT } from '../../services/uts'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Input, { Textarea, Select } from '../../components/common/Input'
import Spinner from '../../components/common/Spinner'

const FORM_VACIO = { titulo: '', descripcion: '', activa: false, reintentos_permitidos: 1, orden: 0 }

export default function GestionUTs() {
  const navigate = useNavigate()
  const [uts, setUts] = useState([])
  const [form, setForm] = useState(FORM_VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getUTs()
      .then((d) => setUts(Array.isArray(d) ? d : []))
      .catch(() => setError('Error al cargar las UTs'))
      .finally(() => setCargando(false))
  }, [])

  const abrirNueva = () => { setForm(FORM_VACIO); setEditandoId(null); setMostrarForm(true) }
  const abrirEdicion = (ut) => { setForm({ titulo: ut.titulo, descripcion: ut.descripcion, activa: ut.activa, reintentos_permitidos: ut.reintentos_permitidos, orden: ut.orden }); setEditandoId(ut.ut_id); setMostrarForm(true) }
  const cancelar = () => { setMostrarForm(false); setEditandoId(null); setForm(FORM_VACIO) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editandoId) {
        await updateUT(editandoId, form)
        setUts((p) => p.map((u) => u.ut_id === editandoId ? { ...u, ...form } : u))
      } else {
        const nueva = await createUT(form)
        setUts((p) => [...p, nueva])
      }
      cancelar()
    } catch { setError('Error al guardar') }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta UT?')) return
    try { await deleteUT(id); setUts((p) => p.filter((u) => u.ut_id !== id)) }
    catch { setError('Error al eliminar') }
  }

  const handleToggle = async (ut) => {
    try {
      await updateUT(ut.ut_id, { ...ut, activa: !ut.activa })
      setUts((p) => p.map((u) => u.ut_id === ut.ut_id ? { ...u, activa: !u.activa } : u))
    } catch { setError('Error al actualizar') }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Unidades de Trabajo</h1>
          <p className="text-gray-400 text-sm mt-1">{uts.length} unidades creadas</p>
        </div>
        <Button onClick={abrirNueva}>+ Nueva UT</Button>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">{error}</p>}

      {mostrarForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-base font-semibold text-white mb-5">{editandoId ? 'Editar UT' : 'Nueva UT'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Título *" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} required placeholder="Nombre de la UT" />
            </div>
            <div className="sm:col-span-2">
              <Textarea label="Descripción" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} rows={2} placeholder="Descripción opcional" />
            </div>
            <Input label="Orden" type="number" min={0} value={form.orden} onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))} />
            <Input label="Reintentos permitidos" type="number" min={1} value={form.reintentos_permitidos} onChange={(e) => setForm((f) => ({ ...f, reintentos_permitidos: Number(e.target.value) }))} />
            <label className="sm:col-span-2 flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.activa} onChange={(e) => setForm((f) => ({ ...f, activa: e.target.checked }))} className="w-4 h-4 accent-app-blue" />
              <span className="text-sm text-gray-300">Activa (visible para alumnos)</span>
            </label>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <Button type="submit">{editandoId ? 'Guardar cambios' : 'Crear UT'}</Button>
              <Button type="button" variant="ghost" onClick={cancelar}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {cargando ? <Spinner /> : uts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No hay unidades de trabajo</p>
          <p className="text-sm">Crea la primera con el botón de arriba</p>
        </div>
      ) : (
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-app-border">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-16">Ord.</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Título</th>
                <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-28">Reintentos</th>
                <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-28">Estado</th>
                <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-52">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[...uts].sort((a, b) => a.orden - b.orden).map((ut) => (
                <tr key={ut.ut_id} className="border-b border-app-border/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-sm text-left">{ut.orden}</td>
                  <td className="px-4 py-3 text-left">
                    <p className="text-white font-medium text-sm">{ut.titulo}</p>
                    {ut.descripcion && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{ut.descripcion}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm text-center">{ut.reintentos_permitidos}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(ut)} title="Cambiar estado">
                      <Badge variant={ut.activa ? 'active' : 'inactive'}>{ut.activa ? 'Activa' : 'Inactiva'}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="primary" className="text-xs px-3 py-1.5" onClick={() => navigate(`/profesor/uts/${ut.ut_id}/preguntas`)}>Preguntas</Button>
                      <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={() => abrirEdicion(ut)}>Editar</Button>
                      <Button variant="danger" className="text-xs px-3 py-1.5" onClick={() => handleEliminar(ut.ut_id)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
