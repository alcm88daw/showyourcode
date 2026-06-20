import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import Login from '../pages/Login'
import ProfesorLayout from '../components/profesor/ProfesorLayout'
import ProfesorDashboard from '../pages/profesor/Dashboard'
import GestionUTs from '../pages/profesor/GestionUTs'
import GestionPreguntas from '../pages/profesor/GestionPreguntas'
import GestionAlumnos from '../pages/profesor/GestionAlumnos'
import Resultados from '../pages/profesor/Resultados'
import AlumnoDashboard from '../pages/alumno/Dashboard'
import Test from '../pages/alumno/Test'
import Ranking from '../pages/alumno/Ranking'

function PrivateRoute({ children, allowedRole }) {
  const { user, role, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (allowedRole && role !== allowedRole) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, role, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to={role === 'profesor' ? '/profesor' : '/alumno'} replace />
  return children
}

function DevBanner() {
  if (import.meta.env.VITE_STAGE !== 'dev') return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-black text-xs font-bold text-center py-0.5 tracking-widest uppercase">
      Entorno DEV
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <DevBanner />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* Profesor — layout con sidebar */}
        <Route element={<PrivateRoute allowedRole="profesor"><ProfesorLayout /></PrivateRoute>}>
          <Route path="/profesor" element={<ProfesorDashboard />} />
          <Route path="/profesor/uts" element={<GestionUTs />} />
          <Route path="/profesor/uts/:utId/preguntas" element={<GestionPreguntas />} />
          <Route path="/profesor/alumnos" element={<GestionAlumnos />} />
          <Route path="/profesor/resultados" element={<Resultados />} />
        </Route>

        {/* Alumno */}
        <Route path="/alumno" element={<PrivateRoute allowedRole="alumno"><AlumnoDashboard /></PrivateRoute>} />
        <Route path="/alumno/test/:utId" element={<PrivateRoute allowedRole="alumno"><Test /></PrivateRoute>} />
        <Route path="/alumno/ranking" element={<PrivateRoute allowedRole="alumno"><Ranking /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
