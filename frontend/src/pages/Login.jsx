import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin, setNewPassword } from '../services/auth'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword_] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState('login')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const result = await apiLogin(username, password)
      if (result.requiresNewPassword) { setStep('new_password'); return }
      login(result)
      navigate(result.role === 'profesor' ? '/profesor' : '/alumno')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setEnviando(false)
    }
  }

  const handleNewPassword = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    if (newPassword.length < 8) { setError('Mínimo 8 caracteres'); return }
    setEnviando(true)
    try {
      const result = await setNewPassword(newPassword)
      login({ email: username, ...result })
      navigate(result.role === 'profesor' ? '/profesor' : '/alumno')
    } catch (err) {
      setError(err.message || 'Error al cambiar la contraseña')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4"
      style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(79,142,247,0.08) 0%, transparent 70%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-app-blue to-purple-400 bg-clip-text text-transparent">
            TestsApp
          </h1>
          <p className="text-gray-500 text-sm mt-2">Plataforma de evaluación</p>
        </div>

        {/* Card glassmorphism */}
        <div className="backdrop-blur-sm bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl">
          {step === 'login' ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-6">Iniciar sesión</h2>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Input
                  type="text"
                  placeholder="Usuario o email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                {error && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={enviando} className="w-full py-2.5 mt-1">
                  {enviando ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Elige tu contraseña</h2>
              <p className="text-gray-400 text-sm mb-6">Es tu primer acceso. Establece una contraseña personal.</p>
              <form onSubmit={handleNewPassword} className="flex flex-col gap-4">
                <Input
                  type="password"
                  placeholder="Nueva contraseña (mín. 8 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword_(e.target.value)}
                  required
                  minLength={8}
                />
                <Input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {error && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={enviando} className="w-full py-2.5 mt-1">
                  {enviando ? 'Guardando...' : 'Establecer contraseña'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
