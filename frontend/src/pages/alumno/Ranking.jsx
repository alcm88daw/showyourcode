import { useEffect, useState } from 'react'
import { getRanking } from '../../services/resultados'

export default function Ranking() {
  const [ranking, setRanking] = useState([])

  useEffect(() => {
    getRanking().then(setRanking)
  }, [])

  return (
    <main>
      <h1>Ranking del grupo</h1>
      <ol>
        {ranking.map((entry, i) => (
          <li key={entry.alumnoId}>
            {i + 1}. {entry.nombre} — {entry.media.toFixed(1)} puntos
          </li>
        ))}
      </ol>
    </main>
  )
}
