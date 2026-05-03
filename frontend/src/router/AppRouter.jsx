import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import Login from '../pages/Login'
import ProfesorDashboard from '../pages/profesor/Dashboard'
import GestionUTs from '../pages/profesor/GestionUTs'
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

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/profesor" element={<PrivateRoute allowedRole="profesor"><ProfesorDashboard /></PrivateRoute>} />
        <Route path="/profesor/uts" element={<PrivateRoute allowedRole="profesor"><GestionUTs /></PrivateRoute>} />
        <Route path="/profesor/resultados" element={<PrivateRoute allowedRole="profesor"><Resultados /></PrivateRoute>} />

        <Route path="/alumno" element={<PrivateRoute allowedRole="alumno"><AlumnoDashboard /></PrivateRoute>} />
        <Route path="/alumno/test/:utId" element={<PrivateRoute allowedRole="alumno"><Test /></PrivateRoute>} />
        <Route path="/alumno/ranking" element={<PrivateRoute allowedRole="alumno"><Ranking /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
