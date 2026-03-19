import { useState, useEffect } from 'react'
import { dashboardService, monitorService, ventasService } from '../services/api'
import { useTema } from '../context/TemaContext'
import { useToast } from '../components/Toast'
import { SkeletonDashboard } from '../components/Skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORES = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

export default function DashboardPage() {
  const { modoOscuro } = useTema()
  const { toast } = useToast()
  const [datos, setDatos] = useState(null)
  const [stats, setStats] = useState(null)
  const [ventasSemana, setVentasSemana] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [dash, mon, ventas] = await Promise.all([
        dashboardService.obtener(),
        monitorService.stats(),
        ventasService.resumenRango(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        )
      ])
      setDatos(dash.data)
      setStats(mon.data)

      // Procesar ventas de la semana
      const dias = []
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const key = fecha.toISOString().split('T')[0]
        const label = fecha.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric' })
        dias.push({ fecha: key, label, total: 0 })
      }
      setVentasSemana(dias)

      // Notificaciones de stock
      const stockBajo = dash.data?.stock_bajo || []
      const agotados = stockBajo.filter(p => p.stock === 0)
      const bajos = stockBajo.filter(p => p.stock > 0)
      if (agotados.length > 0) toast(`🚨 ${agotados.length} producto(s) agotado(s)`, 'error')
      if (bajos.length > 0) setTimeout(() => toast(`⚠️ ${bajos.length} producto(s) con stock bajo`, 'advertencia'), 1000)

    } catch (e) { console.log('Error:', e) }
    setCargando(false)
  }

  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-sm`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const gridColor = modoOscuro ? '#374151' : '#f3f4f6'
  const tooltipStyle = { background: modoOscuro ? '#1f2937' : '#fff', border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
  const tickColor = modoOscuro ? '#9ca3af' : '#6b7280'

  if (cargando) return <SkeletonDashboard modoOscuro={modoOscuro} />

  const hoy = datos?.hoy || {}
  const topProductos = datos?.top_productos || []
  const stockBajo = datos?.stock_bajo || []
  const porMetodo = datos?.por_metodo_pago || []

  // Datos para gráfica de métodos de pago
  const datosMetodo = [
    { name: 'Efectivo', value: parseFloat(porMetodo.find(p => p.metodo_pago === 'efectivo')?.total || 0) },
    { name: 'Tarjeta', value: parseFloat(porMetodo.find(p => p.metodo_pago === 'tarjeta')?.total || 0) },
    { name: 'Transfer.', value: parseFloat(porMetodo.find(p => p.metodo_pago === 'transferencia')?.total || 0) },
  ].filter(d => d.value > 0)

  // Datos para gráfica de top productos
  const chartProductos = topProductos.slice(0, 6).map(p => ({
    name: p.nombre.length > 12 ? p.nombre.substring(0, 12) + '...' : p.nombre,
    ventas: parseFloat(p.total_dinero || 0),
    unidades: parseInt(p.total_vendido || 0)
  }))

  const totalVentas = parseFloat(hoy.total_ventas || 0)
  const totalTx = parseInt(hoy.total_transacciones || 0)
  const promedio = totalTx > 0 ? totalVentas / totalTx : 0
  const totalIva = parseFloat(hoy.total_iva || 0)

  return (
    <div className={`p-6 space-y-6 ${modoOscuro ? 'bg-gray-900' : 'bg-gray-50'} min-h-full`}>
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>📊 Dashboard</h1>
          <p className={`text-sm mt-1 ${textSub}`}>
            {new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={cargarDatos} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-md">
          🔄 Actualizar
        </button>
      </div>

      {/* TARJETAS PRINCIPALES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventas de Hoy', val: `Q${totalVentas.toFixed(2)}`, emoji: '💰', gradient: 'from-blue-500 to-blue-700', sub: `${totalTx} transacciones` },
          { label: 'Promedio/Venta', val: `Q${promedio.toFixed(2)}`, emoji: '📈', gradient: 'from-green-500 to-green-700', sub: 'Por transacción' },
          { label: 'IVA Generado', val: `Q${totalIva.toFixed(2)}`, emoji: '🏛️', gradient: 'from-purple-500 to-purple-700', sub: '12% del total' },
          { label: 'Stock Bajo', val: stockBajo.length, emoji: '⚠️', gradient: stockBajo.length > 0 ? 'from-orange-500 to-red-500' : 'from-emerald-500 to-emerald-700', sub: stockBajo.length === 0 ? 'Todo bien' : 'Productos' },
        ].map(({ label, val, emoji, gradient, sub }) => (
          <div key={label} className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{emoji}</span>
              <div className="w-8 h-8 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              </div>
            </div>
            <div className="text-2xl font-black mb-1">{val}</div>
            <div className="text-xs font-semibold opacity-80">{label}</div>
            <div className="text-xs opacity-60 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* DESGLOSE MÉTODOS */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Efectivo', emoji: '💵', metodo: 'efectivo', color: 'text-green-500', bg: modoOscuro ? 'bg-green-900' : 'bg-green-50' },
          { label: 'Tarjeta', emoji: '💳', metodo: 'tarjeta', color: 'text-blue-500', bg: modoOscuro ? 'bg-blue-900' : 'bg-blue-50' },
          { label: 'Transferencia', emoji: '📱', metodo: 'transferencia', color: 'text-purple-500', bg: modoOscuro ? 'bg-purple-900' : 'bg-purple-50' },
        ].map(({ label, emoji, metodo, color, bg }) => {
          const dato = porMetodo.find(p => p.metodo_pago === metodo)
          return (
            <div key={metodo} className={`${bg} rounded-2xl p-4 border ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <div className={`text-lg font-black ${color}`}>Q{parseFloat(dato?.total || 0).toFixed(2)}</div>
                  <div className={`text-xs ${textSub}`}>{label} · {dato?.cantidad || 0} ventas</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* GRÁFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TOP PRODUCTOS - BARRAS */}
        <div className={`${card} p-5 lg:col-span-2`}>
          <h2 className={`text-xs font-bold uppercase mb-4 ${textSub}`}>🏆 Top Productos Hoy</h2>
          {chartProductos.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🛒</div>
              <p className={`text-sm ${textSub}`}>Sin ventas hoy</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartProductos} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} />
                <YAxis tick={{ fontSize: 10, fill: tickColor }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: modoOscuro ? '#fff' : '#111' }} formatter={(v) => [`Q${v.toFixed(2)}`, 'Ventas']} />
                <Bar dataKey="ventas" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* MÉTODOS DE PAGO - PIE */}
        <div className={`${card} p-5`}>
          <h2 className={`text-xs font-bold uppercase mb-4 ${textSub}`}>💳 Por Método</h2>
          {datosMetodo.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💳</div>
              <p className={`text-sm ${textSub}`}>Sin ventas hoy</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={datosMetodo} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {datosMetodo.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`Q${v.toFixed(2)}`, '']} />
                <Legend formatter={(v) => <span style={{ color: tickColor, fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STOCK BAJO */}
        <div className={`${card} p-5`}>
          <h2 className={`text-xs font-bold uppercase mb-4 ${textSub}`}>⚠️ Stock Bajo</h2>
          {stockBajo.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✅</div>
              <p className={`text-sm ${textSub}`}>Todo el inventario está bien</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stockBajo.slice(0, 6).map((p, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.emoji || '📦'}</span>
                    <span className={`text-sm font-semibold ${text}`}>{p.nombre}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {p.stock === 0 ? 'Agotado' : `${p.stock} uds`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STATS SISTEMA */}
        <div className={`${card} p-5`}>
          <h2 className={`text-xs font-bold uppercase mb-4 ${textSub}`}>🖥️ Estado del Sistema</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Ventas hoy', val: stats?.hoy?.ventas || 0, color: 'text-blue-500', emoji: '🧾' },
              { label: 'Monto hoy', val: `Q${stats?.hoy?.monto || 0}`, color: 'text-green-500', emoji: '💰' },
              { label: 'Productos', val: stats?.productos || 0, color: 'text-purple-500', emoji: '📦' },
              { label: 'Usuarios', val: stats?.usuarios_activos || 0, color: 'text-orange-500', emoji: '👥' },
              { label: 'Intentos fallidos', val: stats?.intentos_fallidos_hora || 0, color: stats?.intentos_fallidos_hora > 5 ? 'text-red-500' : 'text-green-500', emoji: '🔒' },
              { label: 'Estado DB', val: '✅ OK', color: 'text-green-500', emoji: '🗄️' },
            ].map(({ label, val, color, emoji }) => (
              <div key={label} className={`p-3 rounded-xl ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{emoji}</span>
                  <span className={`text-xs ${textSub}`}>{label}</span>
                </div>
                <div className={`text-lg font-black ${color}`}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}