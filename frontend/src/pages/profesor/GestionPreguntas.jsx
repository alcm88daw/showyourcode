import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPreguntas, createPregunta, updatePregunta, deletePregunta } from '../../services/preguntas'

const OPCIONES_VACIAS = [
  { id: 'a', texto: '' },
  { id: 'b', texto: '' },
  { id: 'c', texto: '' },
  { id: 'd', texto: '' },
]

const FORM_VACIO = {
  enunciado: '',
  opciones: OPCIONES_VACIAS,
  respuesta_correcta: 'a',
  dificultad: 1,
}

export default function GestionPreguntas() {
  const { utId } = useParams()
  const navigate = useNavigate()

  const [preguntas, setPreguntas] = useState([])
  const [form, setForm] = useState(FORM_VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getPreguntas(utId)
      .then((data) => setPreguntas(Array.isArray(data) ? data : []))
      .catch(() => setError('Error al cargar las preguntas'))
      .finally(() => setCargando(false))
  }, [utId])

  const abrirNueva = () => {
    setForm(FORM_VACIO)
    setEditandoId(null)
    setMostrarForm(true)
  }

  const abrirEdicion = (p) => {
    setForm({
      enunciado: p.enunciado,
      opciones: p.opciones,
      respuesta_correcta: p.respuesta_correcta,
      dificultad: p.dificultad,
    })
    setEditandoId(p.pregunta_id)
    setMostrarForm(true)
  }

  const cancelar = () => {
    setMostrarForm(false)
    setEditandoId(null)
    setForm(FORM_VACIO)
  }

  const setOpcion = (idx, texto) => {
    setForm((f) => {
      const opciones = f.opciones.map((o, i) => i === idx ? { ...o, texto } : o)
      return { ...f, opciones }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const opcionesRellenas = form.opciones.filter((o) => o.texto.trim())
    if (opcionesRellenas.length < 2) {
      setError('Rellena al menos 2 opciones')
      return
    }
    setError('')
    try {
      const payload = { ...form, opciones: opcionesRellenas, ut_id: utId }
      if (editandoId) {
        await updatePregunta(editandoId, payload)
        setPreguntas((prev) => prev.map((p) => p.pregunta_id === editandoId ? { ...p, ...payload, pregunta_id: editandoId } : p))
      } else {
        const nueva = await createPregunta(payload)
        setPreguntas((prev) => [...prev, nueva])
      }
      cancelar()
    } catch {
      setError('Error al guardar la pregunta')
    }
  }

  const handleEliminar = async (p) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    try {
      await deletePregunta(p.pregunta_id, { ut_id: utId })
      setPreguntas((prev) => prev.filter((q) => q.pregunta_id !== p.pregunta_id))
    } catch {
      setError('Error al eliminar la pregunta')
    }
  }

  if (cargando) return <p>Cargando...</p>

  return (
    <main style={{ padding: '1rem', maxWidth: '800px' }}>
      <button onClick={() => navigate('/profesor/uts')} style={{ marginBottom: '1rem' }}>
        ← Volver a UTs
      </button>
      <h1>Preguntas de la UT</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={abrirNueva} style={{ marginBottom: '1rem' }}>+ Nueva pregunta</button>

      {mostrarForm && (
        <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>{editandoId ? 'Editar pregunta' : 'Nueva pregunta'}</h2>

          <label>Enunciado *
            <textarea
              value={form.enunciado}
              onChange={(e) => setForm((f) => ({ ...f, enunciado: e.target.value }))}
              rows={3}
              required
              style={{ display: 'block', width: '100%' }}
            />
          </label>

          <fieldset style={{ border: '1px solid #ddd', padding: '0.75rem' }}>
            <legend>Opciones (mínimo 2)</legend>
            {form.opciones.map((op, idx) => (
              <label key={op.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <input
                  type="radio"
                  name="respuesta_correcta"
                  value={op.id}
                  checked={form.respuesta_correcta === op.id}
                  onChange={() => setForm((f) => ({ ...f, respuesta_correcta: op.id }))}
                  title="Marcar como correcta"
                />
                <span style={{ minWidth: '1rem', fontWeight: 'bold' }}>{op.id.toUpperCase()})</span>
                <input
                  type="text"
                  value={op.texto}
                  onChange={(e) => setOpcion(idx, e.target.value)}
                  placeholder={`Opción ${op.id.toUpperCase()}`}
                  style={{ flex: 1 }}
                />
              </label>
            ))}
            <small style={{ color: '#666' }}>Marca el radio de la opción correcta</small>
          </fieldset>

          <label>Dificultad
            <select
              value={form.dificultad}
              onChange={(e) => setForm((f) => ({ ...f, dificultad: Number(e.target.value) }))}
              style={{ display: 'block' }}
            >
              <option value={1}>1 — Fácil</option>
              <option value={2}>2 — Media</option>
              <option value={3}>3 — Difícil</option>
            </select>
          </label>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">{editandoId ? 'Guardar cambios' : 'Crear pregunta'}</button>
            <button type="button" onClick={cancelar}>Cancelar</button>
          </div>
        </form>
      )}

      {preguntas.length === 0 ? (
        <p>No hay preguntas. Añade la primera.</p>
      ) : (
        <ol style={{ paddingLeft: '1.2rem' }}>
          {preguntas.map((p, i) => (
            <li key={p.pregunta_id} style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong>{p.enunciado}</strong>
                <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '1rem', whiteSpace: 'nowrap' }}>
                  Dif. {p.dificultad}
                </span>
              </div>
              <ul style={{ margin: '0.4rem 0', paddingLeft: '1rem' }}>
                {p.opciones?.map((op) => (
                  <li key={op.id} style={{ color: op.id === p.respuesta_correcta ? 'green' : 'inherit', fontWeight: op.id === p.respuesta_correcta ? 'bold' : 'normal' }}>
                    {op.id.toUpperCase()}) {op.texto} {op.id === p.respuesta_correcta && '✓'}
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => abrirEdicion(p)}>Editar</button>
                <button onClick={() => handleEliminar(p)} style={{ color: 'red' }}>Eliminar</button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
