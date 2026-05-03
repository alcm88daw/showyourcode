import { useEffect, useState } from 'react'
import { getResultados } from '../../services/resultados'

export default function Resultados() {
  const [resultados, setResultados] = useState([])

  useEffect(() => {
    getResultados().then(setResultados)
  }, [])

  return (
    <main>
      <h1>Resultados</h1>
      <table>
        <thead>
          <tr>
            <th>Alumno</th>
            <th>UT</th>
            <th>Nota</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {resultados.map((r) => (
            <tr key={r.id}>
              <td>{r.alumno}</td>
              <td>{r.ut}</td>
              <td>{r.nota}</td>
              <td>{new Date(r.fecha).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
