import { useEffect, useState } from 'react'
import { getUTs, createUT, deleteUT } from '../../services/uts'

export default function GestionUTs() {
  const [uts, setUts] = useState([])

  useEffect(() => {
    getUTs().then(setUts)
  }, [])

  const handleCreate = async () => {
    const nombre = prompt('Nombre de la nueva UT:')
    if (!nombre) return
    const nueva = await createUT({ nombre })
    setUts((prev) => [...prev, nueva])
  }

  const handleDelete = async (id) => {
    await deleteUT(id)
    setUts((prev) => prev.filter((ut) => ut.id !== id))
  }

  return (
    <main>
      <h1>Gestión de Unidades de Trabajo</h1>
      <button onClick={handleCreate}>Nueva UT</button>
      <ul>
        {uts.map((ut) => (
          <li key={ut.id}>
            {ut.nombre}
            <button onClick={() => handleDelete(ut.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </main>
  )
}
