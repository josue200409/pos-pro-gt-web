import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/TemaContext'
import { useState } from 'react'
import Notificaciones from './Notificaciones'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { productosService, clientesService, ventasService } from '../services/api'

const MENU_ADMIN = [
  { path: '/', label: 'Dashboard', emoji: '📊' },
  { path: '/pos', label: 'POS / Cobrar', emoji: '🛒' },
  { path: '/inventario', label: 'Inventario', emoji: '📦' },
  { path: '/ventas', label: 'Ventas', emoji: '💰' },
  { path: '/clientes', label: 'Clientes', emoji: '👥' },
  { path: '/caja', label: 'Caja', emoji: '🏦' },
  { path: '/reportes', label: 'Reportes', emoji: '📄' },
  { path: '/barcodes', label: 'Códigos de Barras', emoji: '📷' },
  { path: '/proveedores', label: 'Proveedores', emoji: '🏭' },
  { path: '/turnos', label: 'Turnos', emoji: '🕐' },
  { path: '/mermas', label: 'Mermas', emoji: '📉' },
  { path: '/sucursales', label: 'Sucursales', emoji: '🏪' },
  { path: '/ia', label: 'Asistente IA', emoji: '🧠' },
  { path: '/seguridad', label: 'Seguridad', emoji: '🔒' },
  { path: '/admin', label: 'Administración', emoji: '⚙️' },
  { path: '/perfil', label: 'Mi Perfil', emoji: '👤' },
  { path: '/ayuda', label: 'Ayuda', emoji: '📖' },
]

const MENU_EMPLEADO = [
  { path: '/', label: 'Dashboard', emoji: '📊' },
  { path: '/pos', label: 'POS / Cobrar', emoji: '🛒' },
  { path: '/ventas', label: 'Ventas', emoji: '💰' },
  { path: '/ia', label: 'Asistente IA', emoji: '🧠' },
  { path: '/perfil', label: 'Mi Perfil', emoji: '👤' },
  { path: '/ayuda', label: 'Ayuda', emoji: '📖' },
]

export default function Layout() {
  const [busquedaGlobal, setBusquedaGlobal] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const busquedaRef = useRef()
  const { usuario, logout } = useAuth()
  const { modoOscuro, toggleTema } = useTema()
  const navigate = useNavigate()
  const [sidebarAbierto, setSidebarAbierto] = useState(true)
  const menu = usuario?.rol === 'admin' ? MENU_ADMIN : MENU_EMPLEADO

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const buscarGlobal = async (q) => {
  setBusquedaGlobal(q)
  if (q.length < 2) { setResultados([]); setMostrarResultados(false); return }
  setBuscando(true)
  setMostrarResultados(true)
  try {
    const [prods, clts] = await Promise.all([
      productosService.obtenerTodos(),
      clientesService.obtenerTodos()
    ])
    const productos = (prods.data || []).filter(p => p.nombre.toLowerCase().includes(q.toLowerCase())).slice(0, 4).map(p => ({ tipo: 'producto', emoji: p.emoji || '📦', nombre: p.nombre, sub: `Q${parseFloat(p.precio).toFixed(2)} · Stock: ${p.stock}`, ruta: '/inventario' }))
    const clientes = (clts.data || []).filter(c => c.nombre.toLowerCase().includes(q.toLowerCase())).slice(0, 3).map(c => ({ tipo: 'cliente', emoji: '👤', nombre: c.nombre, sub: c.telefono || c.email || 'Cliente', ruta: '/clientes' }))
    setResultados([...productos, ...clientes])
  } catch { setResultados([]) }
  setBuscando(false)
}

const irA = (ruta) => {
  navigate(ruta)
  setBusquedaGlobal('')
  setMostrarResultados(false)
  setResultados([])
}

  return (
    <div className={`flex h-screen ${modoOscuro ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* SIDEBAR */}
      <aside className={`${sidebarAbierto ? 'w-64' : 'w-16'} transition-all duration-300 flex flex-col ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r shadow-lg flex-shrink-0`}>
        {/* LOGO */}
        <div className={`p-4 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'} flex items-center justify-between`}>
          {sidebarAbierto && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-sm shadow-md">P</div>
              <div>
                <h1 className={`text-sm font-black ${modoOscuro ? 'text-white' : 'text-gray-800'}`}>POS Pro GT</h1>
                <p className={`text-xs ${modoOscuro ? 'text-gray-400' : 'text-gray-400'}`}>v2.0</p>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className={`p-1.5 rounded-lg transition-all ${modoOscuro ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            {sidebarAbierto ? '◀' : '▶'}
          </button>
        </div>

        {/* PERFIL */}
        {sidebarAbierto && (
          <div className={`p-3 mx-3 mt-3 rounded-2xl animate-fade-in ${modoOscuro ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm overflow-hidden ${modoOscuro ? 'bg-gray-600' : 'bg-white'}`}>
                {usuario?.foto_url ? (
                  <img src={usuario.foto_url} alt={usuario.nombre} className="w-full h-full object-cover" />
                ) : (
                  usuario?.rol === 'admin' ? '👑' : '👤'
                )}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${modoOscuro ? 'text-white' : 'text-gray-800'}`}>{usuario?.nombre}</p>
                <p className={`text-xs truncate ${modoOscuro ? 'text-gray-400' : 'text-gray-400'}`}>{usuario?.email}</p>
                <span className="text-xs font-bold text-blue-500 uppercase">{usuario?.rol}</span>
              </div>
            </div>
          </div>
        )}

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto p-2 mt-2 space-y-0.5">
          {sidebarAbierto && (
            <p className={`text-xs font-bold uppercase px-3 py-1 ${modoOscuro ? 'text-gray-500' : 'text-gray-400'}`}>Menú</p>
          )}
          {menu.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              title={!sidebarAbierto ? item.label : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : modoOscuro
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <span className="text-base flex-shrink-0">{item.emoji}</span>
              {sidebarAbierto && <span className="truncate animate-fade-in">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* FOOTER */}
        <div className={`p-3 border-t space-y-2 ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
          <button onClick={toggleTema}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              modoOscuro ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <span>{modoOscuro ? '☀️' : '🌙'}</span>
            {sidebarAbierto && <span>{modoOscuro ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-all border border-red-100">
            <span>🚪</span>
            {sidebarAbierto && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className={`flex-1 overflow-y-auto ${modoOscuro ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
        {/* TOPBAR */}
        <div className={`sticky top-0 z-10 px-6 py-3 border-b flex items-center justify-between gap-4 ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-sm`}>
  <div className={`text-sm hidden md:block ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
    {new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}
  </div>

  {/* BÚSQUEDA GLOBAL */}
  <div className="flex-1 max-w-md relative">
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      <input
        ref={busquedaRef}
        value={busquedaGlobal}
        onChange={e => buscarGlobal(e.target.value)}
        onFocus={() => busquedaGlobal.length >= 2 && setMostrarResultados(true)}
        onBlur={() => setTimeout(() => setMostrarResultados(false), 200)}
        placeholder="Buscar productos, clientes..."
        className={`w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200'}`}
      />
      {buscando && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">⏳</span>}
    </div>

    {/* RESULTADOS */}
    {mostrarResultados && (
      <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden z-50 ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        {resultados.length === 0 ? (
          <div className={`p-4 text-center text-sm ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
            {buscando ? '⏳ Buscando...' : 'Sin resultados'}
          </div>
        ) : (
          <>
            {resultados.map((r, i) => (
              <button key={i} onClick={() => irA(r.ruta)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b last:border-0 transition-all ${modoOscuro ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-50 hover:bg-gray-50'}`}>
                <span className="text-xl">{r.emoji}</span>
                <div>
                  <div className={`text-sm font-semibold ${modoOscuro ? 'text-white' : 'text-gray-800'}`}>{r.nombre}</div>
                  <div className={`text-xs ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>{r.sub}</div>
                </div>
                <span className={`ml-auto text-xs px-2 py-1 rounded-full ${r.tipo === 'producto' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                  {r.tipo === 'producto' ? '📦' : '👤'}
                </span>
              </button>
            ))}
            <div className={`p-2 text-center text-xs ${modoOscuro ? 'text-gray-500' : 'text-gray-400'}`}>
              {resultados.length} resultado(s)
            </div>
          </>
        )}
      </div>
    )}
  </div>

  <div className="flex items-center gap-3">
    <Notificaciones />
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${modoOscuro ? 'bg-green-900 text-green-400' : 'bg-green-50 text-green-600'}`}>
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      <span className="hidden sm:block">En línea</span>
    </div>
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg overflow-hidden ${modoOscuro ? 'bg-gray-700' : 'bg-gray-100'}`}>
      {usuario?.foto_url ? (
        <img src={usuario.foto_url} alt={usuario.nombre} className="w-full h-full object-cover" />
      ) : (
        usuario?.rol === 'admin' ? '👑' : '👤'
      )}
    </div>
  </div>
</div>

        {/* PAGE CONTENT */}
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}