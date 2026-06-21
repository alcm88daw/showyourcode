import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPreguntas, createPregunta, updatePregunta, deletePregunta } from '../../services/preguntas'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { DifficultyBadge } from '../../components/common/Badge'
import Input, { Textarea, Select } from '../../components/common/Input'
import Spinner from '../../components/common/Spinner'

const OPCIONES_VACIAS = [{ id: 'a', texto: '' }, { id: 'b', texto: '' }, { id: 'c', texto: '' }, { id: 'd', texto: '' }]
const FORM_VACIO = { enunciado: '', opciones: OPCIONES_VACIAS, respuesta_correcta: 'a', dificultad: 1 }

const CABECERA_CSV = 'enunciado,opcion_a,opcion_b,opcion_c,opcion_d,respuesta_correcta,dificultad'
const PLANTILLA_CSV = [CABECERA_CSV, '¿Cuál es la capital de España?,Madrid,Barcelona,Valencia,Sevilla,a,1'].join('\n')

function parsearCSV(texto) {
  const lineas = texto.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  if (lineas.length < 2) return { filas: [], errores: ['Fichero vacío'] }
  const cab = lineas[0].toLowerCase().split(',').map((c) => c.trim())
  const faltantes = ['enunciado', 'opcion_a', 'opcion_b', 'respuesta_correcta'].filter((c) => !cab.includes(c))
  if (faltantes.length) return { filas: [], errores: [`Columnas faltantes: ${faltantes.join(', ')}`] }
  const filas = []; const errores = []
  lineas.slice(1).forEach((linea, idx) => {
    const cols = linea.split(',').map((v) => v.trim())
    const get = (c) => { const i = cab.indexOf(c); return i >= 0 ? cols[i] ?? '' : '' }
    const enunciado = get('enunciado'), oa = get('opcion_a'), ob = get('opcion_b')
    const rc = get('respuesta_correcta').toLowerCase(), dif = Number(get('dificultad')) || 1
    if (!enunciado) { errores.push(`Fila ${idx + 2}: enunciado vacío`); return }
    if (!oa || !ob) { errores.push(`Fila ${idx + 2}: faltan opciones A/B`); return }
    if (!['a','b','c','d'].includes(rc)) { errores.push(`Fila ${idx + 2}: respuesta_correcta inválida`); return }
    filas.push({ enunciado, opciones: [{ id:'a', texto:oa }, ob&&{ id:'b', texto:ob }, get('opcion_c')&&{ id:'c', texto:get('opcion_c') }, get('opcion_d')&&{ id:'d', texto:get('opcion_d') }].filter(Boolean), respuesta_correcta: rc, dificultad: Math.min(3, Math.max(1, dif)) })
  })
  return { filas, errores }
}

export default function GestionPreguntas() {
  const { utId } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [preguntas, setPreguntas] = useState([])
  const [form, setForm] = useState(FORM_VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarImport, setMostrarImport] = useState(false)
  const [preview, setPreview] = useState([])
  const [erroresCSV, setErroresCSV] = useState([])
  const [importando, setImportando] = useState(false)
  const [progreso, setProgreso] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getPreguntas(utId).then((d) => setPreguntas(Array.isArray(d) ? d : [])).catch(() => setError('Error al cargar')).finally(() => setCargando(false))
  }, [utId])

  const cancelar = () => { setMostrarForm(false); setEditandoId(null); setForm(FORM_VACIO) }
  const abrirEdicion = (p) => { setForm({ enunciado: p.enunciado, opciones: p.opciones, respuesta_correcta: p.respuesta_correcta, dificultad: p.dificultad }); setEditandoId(p.pregunta_id); setMostrarForm(true) }
  const setOpcion = (idx, texto) => setForm((f) => ({ ...f, opciones: f.opciones.map((o, i) => i === idx ? { ...o, texto } : o) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ops = form.opciones.filter((o) => o.texto.trim())
    if (ops.length < 2) { setError('Mínimo 2 opciones'); return }
    setError('')
    try {
      const payload = { ...form, opciones: ops, ut_id: utId }
      if (editandoId) { await updatePregunta(editandoId, payload); setPreguntas((p) => p.map((q) => q.pregunta_id === editandoId ? { ...q, ...payload, pregunta_id: editandoId } : q)) }
      else { const nueva = await createPregunta(payload); setPreguntas((p) => [...p, nueva]) }
      cancelar()
    } catch { setError('Error al guardar') }
  }

  const handleEliminar = async (p) => {
    if (!confirm('¿Eliminar?')) return
    try { await deletePregunta(p.pregunta_id, { ut_id: utId }); setPreguntas((prev) => prev.filter((q) => q.pregunta_id !== p.pregunta_id)) }
    catch { setError('Error al eliminar') }
  }

  const handleArchivoCSV = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { const { filas, errores } = parsearCSV(ev.target.result); setPreview(filas); setErroresCSV(errores); setProgreso(null) }
    reader.readAsText(file, 'UTF-8')
  }

  const handleImportar = async () => {
    setImportando(true); setProgreso({ ok: 0, total: preview.length })
    const nuevas = []
    for (const fila of preview) {
      try { nuevas.push(await createPregunta({ ...fila, ut_id: utId })); setProgreso((p) => ({ ...p, ok: p.ok + 1 })) }
      catch { setErroresCSV((p) => [...p, `Error: "${fila.enunciado.slice(0, 40)}..."`]) }
    }
    setPreguntas((p) => [...p, ...nuevas]); setPreview([]); setImportando(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (cargando) return <Spinner />

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Preguntas de la UT</h1>
          <p className="text-gray-400 text-sm mt-1">{preguntas.length} preguntas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setMostrarImport((v) => !v)}>↑ CSV</Button>
          <Button onClick={() => { setMostrarForm(true); setEditandoId(null); setForm(FORM_VACIO) }}>+ Nueva</Button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">{error}</p>}

      {/* CSV Import */}
      {mostrarImport && (
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-white">Importar desde CSV</h2>
            <Button variant="ghost" className="text-xs" onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([PLANTILLA_CSV], { type: 'text/csv' })); a.download = 'plantilla.csv'; a.click() }}>Descargar plantilla</Button>
          </div>
          <p className="text-xs text-gray-500 mb-3">Columnas: <code className="text-app-blue">enunciado, opcion_a, opcion_b, opcion_c*, opcion_d*, respuesta_correcta (a-d), dificultad* (1-3)</code></p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleArchivoCSV} disabled={importando} className="text-sm text-gray-400 mb-3" />
          {erroresCSV.length > 0 && <ul className="text-red-400 text-xs mb-3 space-y-0.5">{erroresCSV.map((e, i) => <li key={i}>• {e}</li>)}</ul>}
          {preview.length > 0 && (
            <div>
              <p className="text-sm text-gray-300 mb-2">{preview.length} preguntas listas{progreso ? ` — importando ${progreso.ok}/${progreso.total}` : ''}</p>
              <div className="flex gap-2">
                <Button onClick={handleImportar} disabled={importando}>{importando ? 'Importando...' : `Importar ${preview.length}`}</Button>
                <Button variant="ghost" onClick={() => { setPreview([]); setErroresCSV([]); if (fileRef.current) fileRef.current.value = '' }}>Cancelar</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Form */}
      {mostrarForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-base font-semibold text-white mb-5">{editandoId ? 'Editar pregunta' : 'Nueva pregunta'}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Textarea label="Enunciado *" value={form.enunciado} onChange={(e) => setForm((f) => ({ ...f, enunciado: e.target.value }))} rows={3} required />
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Opciones <span className="text-gray-500 font-normal">(marca la correcta)</span></p>
              {form.opciones.map((op, idx) => (
                <div key={op.id} className="flex items-center gap-3 mb-2">
                  <input type="radio" name="rc" value={op.id} checked={form.respuesta_correcta === op.id} onChange={() => setForm((f) => ({ ...f, respuesta_correcta: op.id }))} className="accent-app-blue shrink-0" />
                  <span className="text-gray-400 font-bold text-sm w-4">{op.id.toUpperCase()})</span>
                  <input type="text" value={op.texto} onChange={(e) => setOpcion(idx, e.target.value)} placeholder={`Opción ${op.id.toUpperCase()}`} className="flex-1 bg-app-bg border border-app-border rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-app-blue" />
                </div>
              ))}
            </div>
            <Select label="Dificultad" value={form.dificultad} onChange={(e) => setForm((f) => ({ ...f, dificultad: Number(e.target.value) }))} className="max-w-xs">
              <option value={1}>1 — Fácil</option>
              <option value={2}>2 — Media</option>
              <option value={3}>3 — Difícil</option>
            </Select>
            <div className="flex gap-3 pt-1">
              <Button type="submit">{editandoId ? 'Guardar' : 'Crear pregunta'}</Button>
              <Button type="button" variant="ghost" onClick={cancelar}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {/* List */}
      {preguntas.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No hay preguntas. Añade la primera o importa desde CSV.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {preguntas.map((p, i) => (
            <Card key={p.pregunta_id} className="p-5">
              <div className="flex justify-between items-start gap-4 mb-3">
                <p className="text-white font-medium text-sm leading-relaxed"><span className="text-gray-500 mr-2">{i + 1}.</span>{p.enunciado}</p>
                <DifficultyBadge level={p.dificultad} />
              </div>
              <ul className="space-y-1 mb-4 ml-5">
                {p.opciones?.map((op) => (
                  <li key={op.id} className={`text-sm flex items-center gap-2 ${op.id === p.respuesta_correcta ? 'text-app-green font-medium' : 'text-gray-400'}`}>
                    <span className="font-bold">{op.id.toUpperCase()})</span> {op.texto}
                    {op.id === p.respuesta_correcta && <span className="text-xs bg-app-green/20 px-1.5 py-0.5 rounded">✓ correcta</span>}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={() => abrirEdicion(p)}>Editar</Button>
                <Button variant="danger" className="text-xs px-3 py-1.5" onClick={() => handleEliminar(p)}>Eliminar</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
