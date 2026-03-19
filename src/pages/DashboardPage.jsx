import { useState, useEffect } from 'react'
import { dashboardService, monitorService } from '../services/api'
import { useTema } from '../context/TemaContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useToast } from '../components/Toast'
import { SkeletonDashboard } from '../components/Skeleton'

export default function DashboardPage() {
  const { toast } = useToast()
  const { modoOscuro } = useTema()
  const [datos, setDatos] = useState(null)
  const [stats, setStats] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
  try {
    const [dash, mon] = await Promise.all([
      dashboardService.obtener(),
      monitorService.stats()
    ])
    setDatos(dash.data)
    setStats(mon.data)

    // Notificaciones automáticas de stock bajo
    const stockBajo = dash.data?.stock_bajo || []
    const agotados = stockBajo.filter(p => p.stock === 0)
    const bajos = stockBajo.filter(p => p.stock > 0)

    if (agotados.length > 0) {
      toast(`🚨 ${agotados.length} producto(s) agotado(s)`, 'error')
    }
    if (bajos.length > 0) {
      setTimeout(() => {
        toast(`⚠️ ${bajos.length} producto(s) con stock bajo`, 'advertencia')
      }, 1000)
    }
  } catch (e) { console.log('Error:', e) }
  setCargando(false)
}

  const card = `rounded-2xl p-5 border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-sm hover:shadow-md transition-all duration-200`

  if (cargando) return <SkeletonDashboard modoOscuro={modoOscuro} />

  const hoy = datos?.hoy || {}
  const topProductos = datos?.top_productos || []
  const stockBajo = datos?.stock_bajo || []
  const porMetodo = datos?.por_metodo_pago || []

  const chartData = topProductos.slice(0, 5).map(p => ({
    name: p.nombre.split(' ')[0],
    ventas: parseFloat(p.total_dinero || 0),
    unidades: parseInt(p.total_vendido || 0)
  }))

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-black ${modoOscuro ? 'text-white' : 'text-gray-800'}`}>📊 Dashboard</h1>
          <p className={`text-sm mt-1 ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
            Resumen del negocio en tiempo real
          </p>
        </div>
        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* TARJETAS PRINCIPALES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventas de Hoy', val: `Q${parseFloat(hoy.total_ventas || 0).toFixed(2)}`, emoji: '💰', gradient: 'from-blue-500 to-blue-700', sub: `${hoy.total_transacciones || 0} transacciones` },
          { label: 'Promedio/Venta', val: `Q${hoy.total_transacciones > 0 ? (parseFloat(hoy.total_ventas) / parseInt(hoy.total_transacciones)).toFixed(2) : '0.00'}`, emoji: '📈', gradient: 'from-green-500 to-green-700', sub: 'Por transacción' },
          { label: 'IVA Generado', val: `Q${parseFloat(hoy.total_iva || 0).toFixed(2)}`, emoji: '🏛️', gradient: 'from-purple-500 to-purple-700', sub: '12% del total' },
          { label: 'Stock Bajo', val: stockBajo.length, emoji: '⚠️', gradient: stockBajo.length > 0 ? 'from-orange-500 to-red-500' : 'from-emerald-500 to-emerald-700', sub: stockBajo.length === 0 ? 'Todo bien' : 'Productos' },
        ].map(({ label, val, emoji, gradient, sub }) => (
          <div key={label} className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 cursor-default`}>
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

      {/* DESGLOSE POR MÉTODO */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Efectivo', emoji: '💵', metodo: 'efectivo', color: 'text-green-500' },
          { label: 'Tarjeta', emoji: '💳', metodo: 'tarjeta', color: 'text-blue-500' },
          { label: 'Transferencia', emoji: '📱', metodo: 'transferencia', color: 'text-purple-500' },
        ].map(({ label, emoji, metodo, color }) => {
          const dato = porMetodo.find(p => p.metodo_pago === metodo)
          return (
            <div key={metodo} className={card}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <div className={`text-lg font-black ${color}`}>Q{parseFloat(dato?.total || 0).toFixed(2)}</div>
                  <div className={`text-xs ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>{label} · {dato?.cantidad || 0} ventas</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICA TOP PRODUCTOS */}
        <div className={card}>
          <h2 className={`text-sm font-bold uppercase mb-4 ${modoOscuro ? 'text-gray-400' : 'text-gray-400'}`}>🏆 Top Productos Hoy</h2>
          {chartData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🛒</div>
              <p className={`text-sm ${modoOscuro ? 'text-gray-500' : 'text-gray-400'}`}>Sin ventas hoy</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={modoOscuro ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: modoOscuro ? '#9ca3af' : '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: modoOscuro ? '#9ca3af' : '#6b7280' }} />
                <Tooltip
                  contentStyle={{ background: modoOscuro ? '#1f2937' : '#fff', border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  labelStyle={{ color: modoOscuro ? '#fff' : '#111' }}
                />
                <Bar dataKey="ventas" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* STOCK BAJO */}
        <div className={card}>
          <h2 className={`text-sm font-bold uppercase mb-4 ${modoOscuro ? 'text-gray-400' : 'text-gray-400'}`}>⚠️ Stock Bajo</h2>
          {stockBajo.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✅</div>
              <p className={`text-sm ${modoOscuro ? 'text-gray-500' : 'text-gray-400'}`}>Todo el inventario está bien</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stockBajo.slice(0, 6).map((p, i) => (
                <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-xl ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.emoji || '📦'}</span>
                    <span className={`text-sm font-semibold ${modoOscuro ? 'text-gray-200' : 'text-gray-700'}`}>{p.nombre}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {p.stock === 0 ? 'Agotado' : `${p.stock} uds`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STATS SISTEMA */}
      {stats && (
        <div className={card}>
          <h2 className={`text-sm font-bold uppercase mb-4 ${modoOscuro ? 'text-gray-400' : 'text-gray-400'}`}>🖥️ Estado del Sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Ventas hoy', val: stats.hoy?.ventas, color: 'text-blue-500' },
              { label: 'Monto hoy', val: `Q${stats.hoy?.monto}`, color: 'text-green-500' },
              { label: 'Productos activos', val: stats.productos, color: 'text-purple-500' },
              { label: 'Usuarios activos', val: stats.usuarios_activos, color: 'text-orange-500' },
            ].map(({ label, val, color }) => (
              <div key={label} className={`text-center p-3 rounded-xl ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-xl font-black ${color}`}>{val}</div>
                <div className={`text-xs mt-1 ${modoOscuro ? 'text-gray-400' : 'text-gray-400'}`}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}