import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/TemaContext'
import { useState } from 'react'

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
  { path: '/ayuda', label: 'Ayuda', emoji: '📖' },
]

export default function Layout() {
  const { usuario, logout } = useAuth()
  const { modoOscuro, toggleTema } = useTema()
  const navigate = useNavigate()
  const [sidebarAbierto, setSidebarAbierto] = useState(true)
  const menu = usuario?.rol === 'admin' ? MENU_ADMIN : MENU_EMPLEADO

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={`flex h-screen ${modoOscuro ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* SIDEBAR */}
      <aside className={`${sidebarAbierto ? 'w-64' : 'w-16'} transition-all duration-300 flex flex-col ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r shadow-lg`}>
        
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
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className={`p-1.5 rounded-lg transition-all ${modoOscuro ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            {sidebarAbierto ? '◀' : '▶'}
          </button>
        </div>

        {/* PERFIL */}
        {sidebarAbierto && (
          <div className={`p-3 mx-3 mt-3 rounded-2xl animate-fade-in ${modoOscuro ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm ${modoOscuro ? 'bg-gray-600' : 'bg-white'}`}>
                {usuario?.rol === 'admin' ? '👑' : '👤'}
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
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={!sidebarAbierto ? item.label : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
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
          {/* Toggle modo oscuro */}
          <button
            onClick={toggleTema}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              modoOscuro ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{modoOscuro ? '☀️' : '🌙'}</span>
            {sidebarAbierto && <span>{modoOscuro ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </button>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-all border border-red-100"
          >
            <span>🚪</span>
            {sidebarAbierto && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className={`flex-1 overflow-y-auto ${modoOscuro ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
        {/* TOPBAR */}
        <div className={`sticky top-0 z-10 px-6 py-3 border-b flex items-center justify-between ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-sm`}>
          <div className={`text-sm ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
            {new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${modoOscuro ? 'bg-green-900 text-green-400' : 'bg-green-50 text-green-600'}`}>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              En línea
            </div>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${modoOscuro ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {usuario?.rol === 'admin' ? '👑' : '👤'}
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