import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProfesorDashboard() {
  const { user, logout } = useAuth()

  return (
    <main>
      <h1>Panel del Profesor</h1>
      <p>Bienvenido, {user?.name}</p>
      <nav>
        <Link to="/profesor/uts">Gestión de UTs</Link>
        <Link to="/profesor/resultados">Resultados</Link>
      </nav>
      <button onClick={logout}>Cerrar sesión</button>
    </main>
  )
}
