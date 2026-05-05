import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPreguntas } from '../../services/preguntas'
import { saveResultado } from '../../services/resultados'

export default function Test() {
  const { utId } = useParams()
  const navigate = useNavigate()
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getPreguntas(utId)
      .then((data) => setPreguntas(Array.isArray(data) ? data : []))
      .catch(() => setError('Error al cargar las preguntas'))
      .finally(() => setCargando(false))
  }, [utId])

  const handleSelect = (preguntaId, opcionId) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: opcionId }))
  }

  const handleSubmit = async () => {
    setEnviando(true)
    setError('')
    try {
      const respuestas_correctas = Object.fromEntries(
        preguntas.map((p) => [p.pregunta_id, p.respuesta_correcta])
      )
      const res = await saveResultado({
        ut_id: utId,
        respuestas,
        respuestas_correctas,
        total: preguntas.length,
        correctas: preguntas.filter((p) => respuestas[p.pregunta_id] === p.respuesta_correcta).length,
      })
      setResultado(res)
    } catch {
      setError('Error al enviar el test')
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <p style={{ padding: '1rem' }}>Cargando preguntas...</p>

  if (resultado) {
    const nota = resultado.nota ?? '-'
    const correctas = resultado.correctas ?? 0
    const total = resultado.total ?? preguntas.length
    return (
      <main style={{ padding: '1rem', maxWidth: '700px' }}>
        <h1>Resultado</h1>
        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{nota !== null ? `${nota} / 10` : 'Sin nota'}</p>
        <p>{correctas} de {total} correctas</p>
        <h2>Corrección</h2>
        <ol style={{ paddingLeft: '1.2rem' }}>
          {preguntas.map((p) => {
            const respondida = respuestas[p.pregunta_id]
            const correcta = p.respuesta_correcta
            const acertada = respondida === correcta
            return (
              <li key={p.pregunta_id} style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: 'bold', color: acertada ? 'green' : 'red' }}>
                  {acertada ? '✓' : '✗'} {p.enunciado}
                </p>
                <ul style={{ paddingLeft: '1rem' }}>
                  {p.opciones.map((op) => (
                    <li key={op.id} style={{
                      color: op.id === correcta ? 'green' : op.id === respondida ? 'red' : 'inherit',
                      fontWeight: op.id === correcta || op.id === respondida ? 'bold' : 'normal',
                    }}>
                      {op.id.toUpperCase()}) {op.texto}
                      {op.id === correcta && ' ✓'}
                      {op.id === respondida && op.id !== correcta && ' ✗'}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ol>
        <button onClick={() => navigate('/alumno')}>Volver al inicio</button>
      </main>
    )
  }

  const todasRespondidas = preguntas.length > 0 && Object.keys(respuestas).length === preguntas.length

  return (
    <main style={{ padding: '1rem', maxWidth: '700px' }}>
      <button onClick={() => navigate('/alumno')} style={{ marginBottom: '1rem' }}>← Volver</button>
      <h1>Test</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {preguntas.length === 0 ? (
        <p>Este test no tiene preguntas todavía.</p>
      ) : (
        <>
          <p style={{ color: '#666' }}>{Object.keys(respuestas).length} de {preguntas.length} respondidas</p>
          <ol style={{ paddingLeft: '1.2rem' }}>
            {preguntas.map((p, i) => (
              <li key={p.pregunta_id} style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 'bold' }}>{p.enunciado}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {p.opciones.map((op) => (
                    <label key={op.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`pregunta-${p.pregunta_id}`}
                        value={op.id}
                        checked={respuestas[p.pregunta_id] === op.id}
                        onChange={() => handleSelect(p.pregunta_id, op.id)}
                      />
                      <span>{op.id.toUpperCase()}) {op.texto}</span>
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <button onClick={handleSubmit} disabled={!todasRespondidas || enviando}>
            {enviando ? 'Enviando...' : 'Enviar test'}
          </button>
          {!todasRespondidas && <small style={{ display: 'block', marginTop: '0.5rem', color: '#888' }}>Responde todas las preguntas para enviar</small>}
        </>
      )}
    </main>
  )
}
