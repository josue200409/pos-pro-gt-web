import { useState, useEffect } from 'react'
import { dashboardService } from '../services/api'
import { useTema } from '../context/TemaContext'

export default function Notificaciones() {
  const { modoOscuro } = useTema()
  const [abierto, setAbierto] = useState(false)
  const [notificaciones, setNotificaciones] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)

  useEffect(() => {
    cargarNotificaciones()
    // Actualizar cada 5 minutos
    const interval = setInterval(cargarNotificaciones, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const cargarNotificaciones = async () => {
    try {
      const r = await dashboardService.obtener()
      const datos = r.data
      const nuevas = []

      // Stock bajo
      const stockBajo = datos?.stock_bajo || []
      const agotados = stockBajo.filter(p => p.stock === 0)
      const bajos = stockBajo.filter(p => p.stock > 0)

      if (agotados.length > 0) {
        nuevas.push({
          id: 'agotados',
          tipo: 'error',
          emoji: '🚨',
          titulo: 'Productos agotados',
          mensaje: `${agotados.length} producto(s) sin stock: ${agotados.slice(0, 2).map(p => p.nombre).join(', ')}`,
          tiempo: 'Ahora',
          leida: false,
        })
      }

      if (bajos.length > 0) {
        nuevas.push({
          id: 'stockbajo',
          tipo: 'advertencia',
          emoji: '⚠️',
          titulo: 'Stock bajo',
          mensaje: `${bajos.length} producto(s) con stock bajo`,
          tiempo: 'Ahora',
          leida: false,
        })
      }

      // Ventas del día
      const totalVentas = parseFloat(datos?.hoy?.total_ventas || 0)
      if (totalVentas > 0) {
        nuevas.push({
          id: 'ventas',
          tipo: 'exito',
          emoji: '💰',
          titulo: 'Ventas del día',
          mensaje: `Total acumulado hoy: Q${totalVentas.toFixed(2)}`,
          tiempo: 'Hoy',
          leida: true,
        })
      }

      // Top producto
      const top = datos?.top_productos?.[0]
      if (top) {
        nuevas.push({
          id: 'top',
          tipo: 'info',
          emoji: '🏆',
          titulo: 'Producto más vendido',
          mensaje: `${top.nombre} — ${top.total_vendido} unidades (Q${parseFloat(top.total_dinero).toFixed(2)})`,
          tiempo: 'Hoy',
          leida: true,
        })
      }

      setNotificaciones(nuevas)
      setNoLeidas(nuevas.filter(n => !n.leida).length)
    } catch (e) { console.log(e) }
  }

  const marcarTodasLeidas = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    setNoLeidas(0)
  }

  const TIPO_STYLES = {
    error: { bg: modoOscuro ? 'bg-red-900' : 'bg-red-50', border: 'border-red-200', text: modoOscuro ? 'text-red-300' : 'text-red-700' },
    advertencia: { bg: modoOscuro ? 'bg-yellow-900' : 'bg-yellow-50', border: 'border-yellow-200', text: modoOscuro ? 'text-yellow-300' : 'text-yellow-700' },
    exito: { bg: modoOscuro ? 'bg-green-900' : 'bg-green-50', border: 'border-green-200', text: modoOscuro ? 'text-green-300' : 'text-green-700' },
    info: { bg: modoOscuro ? 'bg-blue-900' : 'bg-blue-50', border: 'border-blue-200', text: modoOscuro ? 'text-blue-300' : 'text-blue-700' },
  }

  return (
    <div className="relative">
      {/* CAMPANITA */}
      <button
        onClick={() => { setAbierto(!abierto); if (!abierto) marcarTodasLeidas() }}
        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${modoOscuro ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
      >
        <span className="text-lg">🔔</span>
        {noLeidas > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center animate-bounce-subtle">
            {noLeidas}
          </div>
        )}
      </button>

      {/* PANEL */}
      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className={`absolute right-0 top-12 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            {/* HEADER */}
            <div className={`p-4 border-b flex items-center justify-between ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-black text-sm ${modoOscuro ? 'text-white' : 'text-gray-800'}`}>🔔 Notificaciones</h3>
              <button onClick={cargarNotificaciones} className="text-xs text-blue-500 font-bold">🔄</button>
            </div>

            {/* LISTA */}
            <div className="max-h-80 overflow-y-auto">
              {notificaciones.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className={`text-sm ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>Sin notificaciones</p>
                </div>
              ) : notificaciones.map(n => {
                const style = TIPO_STYLES[n.tipo] || TIPO_STYLES.info
                return (
                  <div key={n.id} className={`p-4 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-50'} ${!n.leida ? (modoOscuro ? 'bg-gray-700' : 'bg-blue-50') : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${style.bg} border ${style.border}`}>
                        {n.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold ${modoOscuro ? 'text-white' : 'text-gray-800'}`}>{n.titulo}</div>
                        <div className={`text-xs mt-0.5 ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>{n.mensaje}</div>
                        <div className={`text-xs mt-1 ${modoOscuro ? 'text-gray-500' : 'text-gray-400'}`}>{n.tiempo}</div>
                      </div>
                      {!n.leida && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* FOOTER */}
            <div className={`p-3 border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => { marcarTodasLeidas(); setAbierto(false) }}
                className={`w-full text-xs font-bold py-2 rounded-xl transition-all ${modoOscuro ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Marcar todas como leídas
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}