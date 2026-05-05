import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUTs, createUT, updateUT, deleteUT } from '../../services/uts'

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
      .then((data) => setUts(Array.isArray(data) ? data : []))
      .catch(() => setError('Error al cargar las UTs'))
      .finally(() => setCargando(false))
  }, [])

  const abrirNueva = () => {
    setForm(FORM_VACIO)
    setEditandoId(null)
    setMostrarForm(true)
  }

  const abrirEdicion = (ut) => {
    setForm({ titulo: ut.titulo, descripcion: ut.descripcion, activa: ut.activa, reintentos_permitidos: ut.reintentos_permitidos, orden: ut.orden })
    setEditandoId(ut.ut_id)
    setMostrarForm(true)
  }

  const cancelar = () => {
    setMostrarForm(false)
    setEditandoId(null)
    setForm(FORM_VACIO)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim()) return
    try {
      if (editandoId) {
        await updateUT(editandoId, form)
        setUts((prev) => prev.map((ut) => ut.ut_id === editandoId ? { ...ut, ...form } : ut))
      } else {
        const nueva = await createUT(form)
        setUts((prev) => [...prev, nueva])
      }
      cancelar()
    } catch {
      setError('Error al guardar la UT')
    }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta UT?')) return
    try {
      await deleteUT(id)
      setUts((prev) => prev.filter((ut) => ut.ut_id !== id))
    } catch {
      setError('Error al eliminar la UT')
    }
  }

  const handleToggleActiva = async (ut) => {
    try {
      await updateUT(ut.ut_id, { ...ut, activa: !ut.activa })
      setUts((prev) => prev.map((u) => u.ut_id === ut.ut_id ? { ...u, activa: !u.activa } : u))
    } catch {
      setError('Error al actualizar la UT')
    }
  }

  if (cargando) return <p>Cargando...</p>

  return (
    <main style={{ padding: '1rem', maxWidth: '800px' }}>
      <h1>Gestión de Unidades de Trabajo</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={abrirNueva} style={{ marginBottom: '1rem' }}>+ Nueva UT</button>

      {mostrarForm && (
        <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ margin: 0 }}>{editandoId ? 'Editar UT' : 'Nueva UT'}</h2>

          <label>Título *
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              required
              style={{ display: 'block', width: '100%' }}
            />
          </label>

          <label>Descripción
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              style={{ display: 'block', width: '100%' }}
            />
          </label>

          <label>Orden
            <input
              type="number"
              value={form.orden}
              min={0}
              onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))}
              style={{ display: 'block', width: '80px' }}
            />
          </label>

          <label>Reintentos permitidos
            <input
              type="number"
              value={form.reintentos_permitidos}
              min={1}
              onChange={(e) => setForm((f) => ({ ...f, reintentos_permitidos: Number(e.target.value) }))}
              style={{ display: 'block', width: '80px' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={form.activa}
              onChange={(e) => setForm((f) => ({ ...f, activa: e.target.checked }))}
            />
            Activa (visible para alumnos)
          </label>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">{editandoId ? 'Guardar cambios' : 'Crear UT'}</button>
            <button type="button" onClick={cancelar}>Cancelar</button>
          </div>
        </form>
      )}

      {uts.length === 0 ? (
        <p>No hay unidades de trabajo. Crea la primera.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>Orden</th>
              <th style={{ padding: '0.5rem' }}>Título</th>
              <th style={{ padding: '0.5rem' }}>Reintentos</th>
              <th style={{ padding: '0.5rem' }}>Activa</th>
              <th style={{ padding: '0.5rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {[...uts].sort((a, b) => a.orden - b.orden).map((ut) => (
              <tr key={ut.ut_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>{ut.orden}</td>
                <td style={{ padding: '0.5rem' }}>
                  <strong>{ut.titulo}</strong>
                  {ut.descripcion && <div style={{ fontSize: '0.85rem', color: '#666' }}>{ut.descripcion}</div>}
                </td>
                <td style={{ padding: '0.5rem' }}>{ut.reintentos_permitidos}</td>
                <td style={{ padding: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={ut.activa}
                    onChange={() => handleToggleActiva(ut)}
                    title={ut.activa ? 'Desactivar' : 'Activar'}
                  />
                </td>
                <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => navigate(`/profesor/uts/${ut.ut_id}/preguntas`)}>Preguntas</button>
                  <button onClick={() => abrirEdicion(ut)}>Editar</button>
                  <button onClick={() => handleEliminar(ut.ut_id)} style={{ color: 'red' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
