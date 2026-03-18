import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.error || 'Error al iniciar sesión')
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-2xl font-black text-gray-800">POS Pro GT</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Punto de Venta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-60 text-sm"
          >
            {cargando ? '⏳ Iniciando sesión...' : '🔐 Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          POS Pro GT © 2026 — Versión Web
        </p>
      </div>
    </div>
  )
}