import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, fetchUserAttributes, signOut } from 'aws-amplify/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(async (cognitoUser) => {
        const attrs = await fetchUserAttributes()
        setUser({ email: cognitoUser.signInDetails?.loginId, ...attrs })
        setRole(attrs['custom:role'] || 'alumno')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = (userData) => {
    setUser(userData)
    setRole(userData.role)
  }

  const logout = async () => {
    await signOut()
    setUser(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
