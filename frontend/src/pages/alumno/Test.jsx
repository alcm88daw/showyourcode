import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPreguntas } from '../../services/preguntas'
import { saveResultado } from '../../services/resultados'
import { traducirTextos, leerTexto, reproducirAudio, IDIOMAS } from '../../services/accesibilidad'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import { Select } from '../../components/common/Input'

export default function Test() {
  const { utId } = useParams()
  const navigate = useNavigate()
  const [preguntas, setPreguntas] = useState([])
  const [textos, setTextos] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [idioma, setIdioma] = useState('es')
  const [traduciendo, setTraduciendo] = useState(false)
  const [reproduciendo, setReproduciendo] = useState(null)
  const audioRef = useRef(null)
  const idiomaReqRef = useRef(0)

  useEffect(() => {
    getPreguntas(utId)
      .then((d) => { const l = Array.isArray(d) ? d : []; setPreguntas(l); setTextos(l) })
      .catch(() => setError('Error al cargar las preguntas'))
      .finally(() => setCargando(false))
  }, [utId])

  const handleIdioma = async (cod) => {
    setIdioma(cod)
    if (cod === 'es') { setTextos(preguntas); setError(''); return }
    const reqId = ++idiomaReqRef.current
    setTraduciendo(true); setError('')
    try {
      // Aplanar todos los textos (enunciado + opciones) en una sola petición batch
      const planos = preguntas.flatMap((p) => [p.enunciado, ...p.opciones.map((op) => op.texto)])
      const traducidos = await traducirTextos(planos, cod)
      // Descartar el resultado si entre tanto se ha elegido otro idioma
      if (reqId !== idiomaReqRef.current) return
      let i = 0
      const t = preguntas.map((p) => ({
        ...p,
        enunciado: traducidos[i++],
        opciones: p.opciones.map((op) => ({ ...op, texto: traducidos[i++] })),
      }))
      setTextos(t)
    } catch (err) {
      if (reqId !== idiomaReqRef.current) return
      setTextos(preguntas); setIdioma('es'); setError(`Error al traducir: ${err.message}`)
    } finally {
      if (reqId === idiomaReqRef.current) setTraduciendo(false)
    }
  }

  const handleLeer = async (key, texto) => {
    if (audioRef.current) { audioRef.current.pause(); if (reproduciendo === key) { setReproduciendo(null); return } }
    if (!texto) return
    const cfg = IDIOMAS.find((i) => i.codigo === idioma) ?? IDIOMAS[0]
    setReproduciendo(key)
    try { const audio = reproducirAudio(await leerTexto(texto, cfg.pollyIdioma, cfg.pollyVoz)); audioRef.current = audio; audio.addEventListener('ended', () => setReproduciendo(null)) }
    catch { setReproduciendo(null) }
  }

  const handleSubmit = async () => {
    setEnviando(true); setError('')
    try {
      const rc = Object.fromEntries(preguntas.map((p) => [p.pregunta_id, p.respuesta_correcta]))
      setResultado(await saveResultado({ ut_id: utId, respuestas, respuestas_correctas: rc, total: preguntas.length, correctas: preguntas.filter((p) => respuestas[p.pregunta_id] === p.respuesta_correcta).length }))
    } catch { setError('Error al enviar el test') }
    finally { setEnviando(false) }
  }

  if (cargando) return <div className="min-h-screen bg-app-bg flex items-center justify-center"><Spinner /></div>

  if (resultado) {
    const nota = resultado.nota; const correctas = resultado.correctas ?? 0; const total = resultado.total ?? preguntas.length
    return (
      <div className="min-h-screen bg-app-bg">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <p className="text-gray-400 text-sm mb-2">Resultado</p>
            <p className={`text-6xl font-bold mb-2 ${nota >= 5 ? 'text-app-green' : 'text-red-400'}`}>{nota !== null ? nota : '—'}<span className="text-2xl text-gray-500">/10</span></p>
            <p className="text-gray-400">{correctas} de {total} correctas</p>
          </div>
          <h2 className="text-white font-semibold mb-4">Corrección</h2>
          <div className="flex flex-col gap-4 mb-8">
            {preguntas.map((p) => {
              const resp = respuestas[p.pregunta_id]; const correcta = p.respuesta_correcta; const ok = resp === correcta
              return (
                <div key={p.pregunta_id} className={`rounded-xl border p-4 ${ok ? 'border-app-green/30 bg-app-green/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  <p className={`font-medium text-sm mb-3 ${ok ? 'text-app-green' : 'text-red-400'}`}>{ok ? '✓' : '✗'} {p.enunciado}</p>
                  <div className="space-y-1">
                    {p.opciones.map((op) => (
                      <p key={op.id} className={`text-sm ${op.id === correcta ? 'text-app-green font-medium' : op.id === resp ? 'text-red-400' : 'text-gray-500'}`}>
                        {op.id.toUpperCase()}) {op.texto}{op.id === correcta && ' ✓'}{op.id === resp && op.id !== correcta && ' ✗'}
                      </p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <Button onClick={() => navigate('/alumno')} className="w-full py-3">Volver al inicio</Button>
        </div>
      </div>
    )
  }

  const respondidas = Object.keys(respuestas).length

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-app-bg/80 backdrop-blur border-b border-app-border px-6 py-3 flex items-center justify-between">
        <Button variant="ghost" className="text-sm" onClick={() => navigate('/alumno')}>← Volver</Button>
        <div className="flex items-center gap-3">
          <Select value={idioma} onChange={(e) => handleIdioma(e.target.value)} disabled={traduciendo} className="text-sm py-1.5 max-w-32">
            {IDIOMAS.map((i) => <option key={i.codigo} value={i.codigo}>{i.label}</option>)}
          </Select>
          {traduciendo && <span className="text-xs text-gray-500 animate-pulse">Traduciendo...</span>}
          <span className="text-gray-400 text-sm">{respondidas}/{preguntas.length}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}
        {preguntas.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Este test no tiene preguntas todavía.</p>
        ) : (
          <div className="flex flex-col gap-8">
            {textos.map((p, i) => (
              <div key={p.pregunta_id}>
                <div className="flex items-start gap-3 mb-4">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-xs text-gray-400 mt-0.5">{i + 1}</span>
                  <p className="text-white font-medium text-base leading-relaxed flex-1">{p.enunciado}</p>
                  <button onClick={() => handleLeer(p.pregunta_id, p.enunciado)} className="shrink-0 text-gray-400 hover:text-white transition-colors text-lg mt-0.5" title={reproduciendo === p.pregunta_id ? 'Detener' : 'Leer en voz alta'}>
                    {reproduciendo === p.pregunta_id ? '⏹' : '🔊'}
                  </button>
                </div>
                <div className="flex flex-col gap-2 ml-10">
                  {p.opciones.map((op) => {
                    const sel = respuestas[p.pregunta_id] === op.id
                    const leerKey = `${p.pregunta_id}:${op.id}`
                    return (
                      <div key={op.id} className="flex items-stretch gap-2">
                        <button
                          onClick={() => setRespuestas((prev) => ({ ...prev, [p.pregunta_id]: op.id }))}
                          className={`flex-1 text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                            sel
                              ? 'border-app-blue bg-app-blue/15 text-white font-medium'
                              : 'border-app-border bg-app-surface text-gray-300 hover:border-app-blue/50 hover:bg-app-blue/5'
                          }`}
                        >
                          <span className="font-bold text-gray-400 mr-2">{op.id.toUpperCase()})</span>{op.texto}
                        </button>
                        <button onClick={() => handleLeer(leerKey, op.texto)} className="shrink-0 px-3 rounded-xl border border-app-border bg-app-surface text-gray-400 hover:text-white transition-colors" title={reproduciendo === leerKey ? 'Detener' : 'Leer en voz alta'}>
                          {reproduciendo === leerKey ? '⏹' : '🔊'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-app-border">
              <Button onClick={handleSubmit} disabled={respondidas < preguntas.length || enviando} className="w-full py-3 text-base">
                {enviando ? 'Enviando...' : `Enviar test`}
              </Button>
              {respondidas < preguntas.length && (
                <p className="text-center text-gray-500 text-xs mt-2">Responde todas las preguntas para enviar ({preguntas.length - respondidas} pendientes)</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
