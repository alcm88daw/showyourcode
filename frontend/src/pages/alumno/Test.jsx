import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPreguntas } from '../../services/preguntas'
import { saveResultado } from '../../services/resultados'

export default function Test() {
  const { utId } = useParams()
  const navigate = useNavigate()
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    getPreguntas(utId).then(setPreguntas)
  }, [utId])

  const handleSelect = (preguntaId, opcion) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: opcion }))
  }

  const handleSubmit = async () => {
    await saveResultado({ utId, respuestas })
    setEnviado(true)
    setTimeout(() => navigate('/alumno'), 2000)
  }

  if (enviado) return <p>Test enviado. Redirigiendo...</p>

  return (
    <main>
      <h1>Test</h1>
      {preguntas.map((p) => (
        <div key={p.id}>
          <p>{p.enunciado}</p>
          {p.opciones.map((op) => (
            <label key={op}>
              <input
                type="radio"
                name={p.id}
                value={op}
                checked={respuestas[p.id] === op}
                onChange={() => handleSelect(p.id, op)}
              />
              {op}
            </label>
          ))}
        </div>
      ))}
      <button onClick={handleSubmit} disabled={Object.keys(respuestas).length < preguntas.length}>
        Enviar
      </button>
    </main>
  )
}
