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
  const [mostrarPassword, setMostrarPassword] = useState(false)

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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* CÍRCULOS DECORATIVOS */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-48 translate-y-48"></div>
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-white opacity-5 rounded-full translate-x-32"></div>
      <div className="absolute top-0 right-1/3 w-48 h-48 bg-white opacity-5 rounded-full -translate-y-24"></div>

      <div className="w-full max-w-4xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* LADO IZQUIERDO */}
          <div className="text-center lg:text-left text-white">
            <div className="text-7xl mb-4">🏪</div>
            <h1 className="text-4xl lg:text-5xl font-black mb-3">POS Pro GT</h1>
            <p className="text-blue-200 text-lg mb-8 leading-relaxed">
              Sistema de Punto de Venta gratuito para emprendedores guatemaltecos
            </p>

            <div className="hidden lg:grid grid-cols-2 gap-3">
              {[
                { emoji: '💰', label: 'Control de ventas' },
                { emoji: '📦', label: 'Inventario' },
                { emoji: '📊', label: 'Reportes' },
                { emoji: '👥', label: 'Empleados' },
                { emoji: '🏪', label: 'Sucursales' },
                { emoji: '🆓', label: '100% Gratuito' },
              ].map(({ emoji, label }) => (
                <div key={label} className="flex items-center gap-2 bg-white bg-opacity-10 rounded-xl px-3 py-2">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-sm font-semibold text-blue-100">{label}</span>
                </div>
              ))}
            </div>

            {/* MOBILE FEATURES */}
            <div className="lg:hidden flex flex-wrap justify-center gap-2 mb-6">
              {['💰 Ventas', '📦 Inventario', '📊 Reportes', '🆓 Gratis'].map(f => (
                <span key={f} className="bg-white bg-opacity-20 text-white text-xs font-bold px-3 py-1.5 rounded-full">{f}</span>
              ))}
            </div>
          </div>

          {/* FORMULARIO */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-800">Bienvenido 👋</h2>
              <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 transition-all"
                    placeholder="tu@email.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔑</span>
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {mostrarPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <span>❌</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60 text-sm shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                {cargando ? '⏳ Iniciando sesión...' : '🚀 Iniciar Sesión'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-1">
              <p className="text-xs text-gray-400">POS Pro GT © 2026 — v2.0</p>
              <p className="text-xs text-gray-400">🇬🇹 Hecho con ❤️ para emprendedores guatemaltecos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}