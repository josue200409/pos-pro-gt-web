import { useState, useEffect } from 'react'
import { ventasService, usuariosService } from '../services/api'
import { useTema } from '../context/TemaContext'
import { useToast } from '../components/Toast'
import * as XLSX from 'xlsx'
import { SkeletonCards, SkeletonTable } from '../components/Skeleton'

export default function VentasPage() {
  const { modoOscuro } = useTema()
  const { toast } = useToast()
  const [ventas, setVentas] = useState([])
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [vistaActual, setVistaActual] = useState('hoy')
  const [empleados, setEmpleados] = useState([])
  const [empleadoSel, setEmpleadoSel] = useState(null)
  const [ventasEmpleado, setVentasEmpleado] = useState([])
  const [cargandoEmpleado, setCargandoEmpleado] = useState(false)
  const [filtroMetodo, setFiltroMetodo] = useState('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [v, r] = await Promise.all([
        ventasService.obtenerTodas(),
        ventasService.resumenHoy()
      ])
      setVentas(v.data || [])
      setResumen(r.data)
    } catch (e) { console.log(e) }
    try {
      const emp = await usuariosService.listar()
      setEmpleados(emp.data || [])
    } catch {}
    setCargando(false)
  }

  const cargarVentasEmpleado = async (emp) => {
    setEmpleadoSel(emp)
    setCargandoEmpleado(true)
    try {
      const hoy = new Date()
      const hace30 = new Date(hoy - 30 * 24 * 60 * 60 * 1000)
      const resp = await fetch(
        `https://pos-pro-gt-backend.onrender.com/api/auth/usuarios/${emp.id}/ventas?desde=${hace30.toISOString().split('T')[0]}&hasta=${hoy.toISOString().split('T')[0]}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      const data = await resp.json()
      setVentasEmpleado(Array.isArray(data) ? data : [])
    } catch { setVentasEmpleado([]) }
    setCargandoEmpleado(false)
  }

  const cancelarVenta = async (venta) => {
    if (!confirm(`¿Cancelar venta de Q${parseFloat(venta.total).toFixed(2)}? Se restaurará el stock.`)) return
    try {
      await ventasService.cancelar(venta.id, { motivo: 'Cancelada desde web' })
      cargarDatos()
      toast('Venta cancelada correctamente', 'exito')
    } catch (e) { toast(e.response?.data?.error || 'Error al cancelar', 'error') }
  }

  const ventasFiltradas = ventas.filter(v => {
    const matchMetodo = !filtroMetodo || v.metodo_pago === filtroMetodo
    const matchDesde = !filtroFechaDesde || new Date(v.created_at) >= new Date(filtroFechaDesde)
    const matchHasta = !filtroFechaHasta || new Date(v.created_at) <= new Date(filtroFechaHasta + 'T23:59:59')
    return matchMetodo && matchDesde && matchHasta
  })

  const exportarExcel = () => {
    const datos = ventasFiltradas.map(v => ({
      'Hora': new Date(v.created_at).toLocaleString('es-GT'),
      'Método': v.metodo_pago,
      'Total': parseFloat(v.total).toFixed(2),
      'Vuelto': parseFloat(v.vuelto || 0).toFixed(2),
      'Estado': v.cancelada ? 'Cancelada' : 'Completada',
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas')
    XLSX.writeFile(wb, `ventas_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const metodoEmoji = (m) => m === 'efectivo' ? '💵' : m === 'tarjeta' ? '💳' : '📱'
  const metodoColor = (m) => m === 'efectivo' ? 'text-green-500' : m === 'tarjeta' ? 'text-blue-500' : 'text-purple-500'
  const formatHora = (iso) => new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
  const formatFecha = (iso) => new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })

  const ventasActivas = ventas.filter(v => !v.cancelada)
  const totalEfectivo = ventasActivas.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + parseFloat(v.total || 0), 0)
  const totalTarjeta = ventasActivas.filter(v => v.metodo_pago === 'tarjeta').reduce((s, v) => s + parseFloat(v.total || 0), 0)
  const totalTransferencia = ventasActivas.filter(v => v.metodo_pago === 'transferencia').reduce((s, v) => s + parseFloat(v.total || 0), 0)
  const totalVuelto = ventasActivas.reduce((s, v) => s + parseFloat(v.vuelto || 0), 0)
  const totalVentasEmpleado = ventasEmpleado.reduce((s, v) => s + parseFloat(v.total || 0), 0)

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>💰 Ventas</h1>
          <p className={`text-sm mt-1 ${textSub}`}>{ventasActivas.length} transacciones hoy</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`px-4 py-2 rounded-xl font-bold text-sm border transition-all ${mostrarFiltros ? 'bg-blue-600 text-white border-blue-600' : modoOscuro ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            🔍 Filtros
          </button>
          <button onClick={exportarExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-700 shadow-md">
            📊 Excel
          </button>
          {usuario.rol === 'admin' && (
            <div className={`flex rounded-xl border overflow-hidden ${modoOscuro ? 'border-gray-700' : 'border-gray-200'}`}>
              {['hoy', 'empleados'].map(v => (
                <button key={v} onClick={() => setVistaActual(v)}
                  className={`px-4 py-2 text-sm font-bold transition-all ${vistaActual === v ? 'bg-blue-600 text-white' : modoOscuro ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                  {v === 'hoy' ? '📅 Hoy' : '👥 Empleados'}
                </button>
              ))}
            </div>
          )}
          <button onClick={cargarDatos} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">🔄</button>
        </div>
      </div>

      {/* FILTROS */}
      {mostrarFiltros && (
        <div className={`${card} p-4 mb-4`}>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Método</label>
              <select value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}>
                <option value="">Todos</option>
                <option value="efectivo">💵 Efectivo</option>
                <option value="tarjeta">💳 Tarjeta</option>
                <option value="transferencia">📱 Transferencia</option>
                <option value="mixto">🔀 Mixto</option>
              </select>
            </div>
            <div>
              <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Desde</label>
              <input type="date" value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Hasta</label>
              <input type="date" value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} />
            </div>
            <button onClick={() => { setFiltroMetodo(''); setFiltroFechaDesde(''); setFiltroFechaHasta('') }}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${modoOscuro ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              ✕ Limpiar
            </button>
            <span className={`text-xs ${textSub} ml-auto`}>{ventasFiltradas.length} resultados</span>
          </div>
        </div>
      )}
{cargando ? (
  <div className="space-y-6">
    <SkeletonCards cantidad={4} modoOscuro={modoOscuro} />
    <SkeletonTable filas={5} modoOscuro={modoOscuro} />
  </div>
) : (
  <>
    {/* todo el contenido actual */}
  </>
)}
      {vistaActual === 'hoy' && (
        <>
          {/* TARJETAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Ventas', val: `Q${parseFloat(resumen?.total_ventas || 0).toFixed(2)}`, emoji: '💰', color: 'from-blue-500 to-blue-700' },
              { label: 'Efectivo', val: `Q${totalEfectivo.toFixed(2)}`, emoji: '💵', color: 'from-green-500 to-green-700' },
              { label: 'Tarjeta', val: `Q${totalTarjeta.toFixed(2)}`, emoji: '💳', color: 'from-purple-500 to-purple-700' },
              { label: 'Transacciones', val: ventasActivas.length, emoji: '🧾', color: 'from-orange-500 to-orange-700' },
            ].map(({ label, val, emoji, color }) => (
              <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-lg`}>
                <div className="text-2xl mb-2">{emoji}</div>
                <div className="text-xl font-black">{val}</div>
                <div className="text-xs opacity-80 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* DESGLOSE */}
          <div className={`${card} p-5 mb-6`}>
            <h2 className={`text-xs font-bold uppercase mb-3 ${textSub}`}>Desglose por Método de Pago</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '💵 Efectivo', val: totalEfectivo, color: 'text-green-500' },
                { label: '💳 Tarjeta', val: totalTarjeta, color: 'text-blue-500' },
                { label: '📱 Transferencia', val: totalTransferencia, color: 'text-purple-500' },
                { label: '🔄 Vuelto', val: totalVuelto, color: 'text-red-500', negativo: true },
              ].map(({ label, val, color, negativo }) => (
                <div key={label} className={`p-3 rounded-xl text-center ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className={`text-lg font-black ${color}`}>{negativo ? '-' : ''}Q{val.toFixed(2)}</div>
                  <div className={`text-xs mt-1 ${textSub}`}>{label}</div>
                </div>
              ))}
            </div>
            <div className={`mt-3 p-3 rounded-xl flex justify-between items-center ${modoOscuro ? 'bg-green-900' : 'bg-green-50'}`}>
              <span className="text-sm font-bold text-green-600">💰 Efectivo Neto</span>
              <span className="text-lg font-black text-green-600">Q{(totalEfectivo - totalVuelto).toFixed(2)}</span>
            </div>
          </div>

          {/* TABLA */}
          <div className={`${card} overflow-hidden`}>
            <div className={`p-4 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`font-bold ${text}`}>Transacciones {ventasFiltradas.length !== ventas.length ? `(${ventasFiltradas.length} filtradas)` : 'del Día'}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <tr>
                    <th className="px-4 py-3 text-left">Hora</th>
                    <th className="px-4 py-3 text-left">Método</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Vuelto</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {ventasFiltradas.map(v => (
                    <tr key={v.id} className={`transition-colors ${modoOscuro ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${v.cancelada ? 'opacity-50' : ''}`}>
                      <td className={`px-4 py-3 text-sm ${textSub}`}>{formatHora(v.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${metodoColor(v.metodo_pago)}`}>
                          {metodoEmoji(v.metodo_pago)} <span className="capitalize">{v.metodo_pago}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-black text-blue-500">Q{parseFloat(v.total).toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right text-sm ${textSub}`}>{v.vuelto > 0 ? `Q${parseFloat(v.vuelto).toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${v.cancelada ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {v.cancelada ? '❌ Cancelada' : '✅ Completada'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setVentaSeleccionada(v)} className={`text-xs font-bold px-2 py-1 rounded-lg ${modoOscuro ? 'bg-gray-600 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>Ver</button>
                          {!v.cancelada && usuario.rol === 'admin' && (
                            <button onClick={() => cancelarVenta(v)} className={`text-xs font-bold px-2 py-1 rounded-lg ${modoOscuro ? 'bg-gray-600 text-red-400' : 'bg-red-50 text-red-600'}`}>Cancelar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ventasFiltradas.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className={textSub}>No hay ventas con estos filtros</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* VISTA EMPLEADOS */}
      {vistaActual === 'empleados' && (
        <div className="flex gap-4">
          <div className={`w-48 ${card} overflow-hidden flex-shrink-0`}>
            <div className={`p-3 border-b text-xs font-bold uppercase ${modoOscuro ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-500'}`}>Empleados</div>
            {empleados.map(emp => (
              <button key={emp.id} onClick={() => cargarVentasEmpleado(emp)}
                className={`w-full text-left px-3 py-3 border-b text-sm transition-all ${empleadoSel?.id === emp.id ? 'bg-blue-600 text-white' : modoOscuro ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
                <div className="font-semibold">{emp.rol === 'admin' ? '👑' : '👤'} {emp.nombre}</div>
                <div className="text-xs opacity-70 capitalize">{emp.rol}</div>
              </button>
            ))}
          </div>
          <div className="flex-1">
            {!empleadoSel ? (
              <div className={`${card} p-12 text-center`}>
                <div className="text-4xl mb-2">👈</div>
                <p className={textSub}>Selecciona un empleado</p>
              </div>
            ) : cargandoEmpleado ? (
              <div className={`${card} p-12 text-center`}><p className={textSub}>Cargando...</p></div>
            ) : (
              <>
                <div className={`${card} p-5 mb-4`}>
                  <h2 className={`font-black text-lg ${text}`}>{empleadoSel.nombre}</h2>
                  <p className={`text-sm ${textSub} mb-4`}>Últimos 30 días</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded-xl text-center ${modoOscuro ? 'bg-gray-700' : 'bg-blue-50'}`}>
                      <div className="text-xl font-black text-blue-500">Q{totalVentasEmpleado.toFixed(2)}</div>
                      <div className={`text-xs ${textSub}`}>Total ventas</div>
                    </div>
                    <div className={`p-3 rounded-xl text-center ${modoOscuro ? 'bg-gray-700' : 'bg-green-50'}`}>
                      <div className="text-xl font-black text-green-500">{ventasEmpleado.length}</div>
                      <div className={`text-xs ${textSub}`}>Transacciones</div>
                    </div>
                  </div>
                </div>
                <div className={`${card} overflow-hidden`}>
                  <table className="w-full">
                    <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                      <tr>
                        <th className="px-4 py-3 text-left">Fecha</th>
                        <th className="px-4 py-3 text-center">Ventas</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                      {ventasEmpleado.map((v, i) => (
                        <tr key={i} className={`${modoOscuro ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                          <td className={`px-4 py-3 text-sm ${textSub}`}>{formatFecha(v.fecha)}</td>
                          <td className={`px-4 py-3 text-center text-sm font-bold ${text}`}>{v.transacciones}</td>
                          <td className="px-4 py-3 text-right text-sm font-black text-blue-500">Q{parseFloat(v.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-black ${text}`}>Detalle de Venta</h2>
              <button onClick={() => setVentaSeleccionada(null)} className={`w-8 h-8 rounded-xl flex items-center justify-center ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>✕</button>
            </div>
            {[
              { label: 'Hora', val: formatHora(ventaSeleccionada.created_at) },
              { label: 'Método', val: `${metodoEmoji(ventaSeleccionada.metodo_pago)} ${ventaSeleccionada.metodo_pago}` },
              { label: 'Total', val: `Q${parseFloat(ventaSeleccionada.total).toFixed(2)}` },
              ventaSeleccionada.vuelto > 0 ? { label: 'Vuelto', val: `Q${parseFloat(ventaSeleccionada.vuelto).toFixed(2)}` } : null,
              { label: 'Estado', val: ventaSeleccionada.cancelada ? '❌ Cancelada' : '✅ Completada' },
            ].filter(Boolean).map(({ label, val }) => (
              <div key={label} className={`flex justify-between py-2.5 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={`text-sm ${textSub}`}>{label}</span>
                <span className={`text-sm font-bold capitalize ${text}`}>{val}</span>
              </div>
            ))}
            <button onClick={() => setVentaSeleccionada(null)} className={`w-full mt-4 py-2 rounded-xl text-sm font-bold ${modoOscuro ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}