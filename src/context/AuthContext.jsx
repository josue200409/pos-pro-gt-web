import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    try {
      const u = localStorage.getItem('usuario')
      const t = localStorage.getItem('token')
      if (u && t) setUsuario(JSON.parse(u))
    } catch (e) {}
    setCargando(false)
  }, [])

  const login = async (email, password) => {
    const r = await authService.login(email, password)
    localStorage.setItem('token', r.data.token)
    localStorage.setItem('usuario', JSON.stringify(r.data.usuario))
    setUsuario(r.data.usuario)
    return r.data.usuario
  }

  const logout = () => {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
    } catch (e) {}
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)