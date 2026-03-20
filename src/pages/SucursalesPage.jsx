+import { useState, useEffect } from 'react'
import { sucursalesService } from '../services/api'
import { useTema } from '../context/TemaContext'
import { useToast } from '../components/Toast'
import { SkeletonCards } from '../components/Skeleton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function SucursalesPage() {
  const { toast } = useToast()
  const { modoOscuro } = useTema()
  const [sucursales, setSucursales] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalForm, setModalForm] = useState(false)
  const [modalReporte, setModalReporte] = useState(null)
  const [reporte, setReporte] = useState(null)
  const [cargandoReporte, setCargandoReporte] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', direccion: '', telefono: '', encargado: '' })
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => { cargarSucursales() }, [])

  const cargarSucursales = async () => {
    try {
      const r = await sucursalesService.obtenerTodas()
      setSucursales(r.data || [])
    } catch (e) { console.log(e) }
    setCargando(false)
  }

  const abrirModal = (s = null) => {
    if (s) { setEditando(s); setForm({ nombre: s.nombre, direccion: s.direccion || '', telefono: s.telefono || '', encargado: s.encargado || '' }) }
    else { setEditando(null); setForm({ nombre: '', direccion: '', telefono: '', encargado: '' }) }
    setModalForm(true)
  }

  const guardar = async () => {
    if (!form.nombre) return alert('Nombre requerido')
    try {
      if (editando) await sucursalesService.actualizar(editando.id, form)
      else await sucursalesService.crear(form)
      setModalForm(false)
      cargarSucursales()
      toast(editando ? 'Sucursal actualizada' : 'Sucursal creada', 'exito')
    } catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const eliminar = async (s) => {
    if (!confirm(`¿Eliminar "${s.nombre}"?`)) return
    try {
      await sucursalesService.eliminar(s.id)
      cargarSucursales()
      toast('Sucursal eliminada', 'exito')
    } catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const verReporte = async (s) => {
    setModalReporte(s)
    setReporte(null)
    setCargandoReporte(true)
    try {
      const r = await sucursalesService.reporte(s.id, fechaDesde, fechaHasta)
      setReporte(r.data)
    } catch { setReporte(null) }
    setCargandoReporte(false)
  }

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200'}`
  const tooltipStyle = { background: modoOscuro ? '#1f2937' : '#fff', border: 'none', borderRadius: 12 }
  const tickColor = modoOscuro ? '#9ca3af' : '#6b7280'

  if (cargando) return (
    <div className={`p-6 ${bg} min-h-full`}>
      <SkeletonCards cantidad={3} modoOscuro={modoOscuro} />
    </div>
  )

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>🏪 Sucursales</h1>
          <p className={`text-sm mt-1 ${textSub}`}>{sucursales.length} sucursal(es) registrada(s)</p>
        </div>
        <button onClick={() => abrirModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">+ Nueva Sucursal</button>
      </div>

      {/* FILTRO DE FECHAS PARA REPORTES */}
      <div className={`${card} p-4 mb-6`}>
        <p className={`text-xs font-bold uppercase mb-3 ${textSub}`}>📅 Período para reportes</p>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className={`text-xs ${textSub} mb-1 block`}>Desde</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} />
          </div>
          <div>
            <label className={`text-xs ${textSub} mb-1 block`}>Hasta</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} />
          </div>
          <div className="flex gap-2">
            {[
              { label: 'Hoy', desde: new Date().toISOString().split('T')[0], hasta: new Date().toISOString().split('T')[0] },
              { label: '7 días', desde: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], hasta: new Date().toISOString().split('T')[0] },
              { label: '30 días', desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], hasta: new Date().toISOString().split('T')[0] },
            ].map(p => (
              <button key={p.label} onClick={() => { setFechaDesde(p.desde); setFechaHasta(p.hasta) }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${modoOscuro ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TARJETAS SUCURSALES */}
      {sucursales.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <div className="text-4xl mb-2">🏪</div>
          <p className={`${textSub} mb-4`}>No hay sucursales registradas</p>
          <button onClick={() => abrirModal()} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm">+ Crear primera sucursal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sucursales.map(s => (
            <div key={s.id} className={`${card} p-5 hover:shadow-lg transition-all`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${modoOscuro ? 'bg-blue-900' : 'bg-blue-50'}`}>🏪</div>
                  <div>
                    <h3 className={`font-black ${text}`}>{s.nombre}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${s.activa ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {s.activa ? '● Activa' : '● Inactiva'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => abrirModal(s)} className={`p-1.5 rounded-lg ${modoOscuro ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}>✏️</button>
                  <button onClick={() => eliminar(s)} className={`p-1.5 rounded-lg ${modoOscuro ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-red-50 text-red-600'}`}>🗑️</button>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                {s.direccion && <p className={`text-xs ${textSub}`}>📍 {s.direccion}</p>}
                {s.telefono && <p className={`text-xs ${textSub}`}>📞 {s.telefono}</p>}
                {s.encargado && <p className={`text-xs ${textSub}`}>👤 {s.encargado}</p>}
              </div>

              <button onClick={() => verReporte(s)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-xl text-sm font-bold hover:opacity-90 shadow-md transition-all">
                📊 Ver Reporte
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-black mb-4 ${text}`}>{editando ? '✏️ Editar Sucursal' : '🏪 Nueva Sucursal'}</h2>
            <div className="space-y-3">
              {[
                { key: 'nombre', placeholder: 'Nombre de la sucursal *' },
                { key: 'direccion', placeholder: 'Dirección' },
                { key: 'telefono', placeholder: 'Teléfono' },
                { key: 'encargado', placeholder: 'Encargado' },
              ].map(f => (
                <input key={f.key} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                  placeholder={f.placeholder} className={inputCls} />
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setModalForm(false)} className={`flex-1 py-2 rounded-xl border text-sm ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cancelar</button>
              <button onClick={guardar} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REPORTE */}
      {modalReporte && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-slide-up max-h-screen overflow-y-auto ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-lg font-black ${text}`}>📊 {modalReporte.nombre}</h2>
                <p className={`text-xs ${textSub}`}>{fechaDesde} al {fechaHasta}</p>
              </div>
              <button onClick={() => setModalReporte(null)} className={`w-8 h-8 rounded-xl ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>✕</button>
            </div>

            {cargandoReporte ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2 animate-pulse">📊</div>
                <p className={textSub}>Cargando reporte...</p>
              </div>
            ) : !reporte ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">😕</div>
                <p className={textSub}>No se pudo cargar el reporte</p>
              </div>
            ) : (
              <>
                {/* STATS PRINCIPALES */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Total Ventas', val: `Q${parseFloat(reporte.total_ventas || 0).toFixed(2)}`, color: 'text-blue-500', emoji: '💰' },
                    { label: 'Transacciones', val: reporte.total_transacciones || 0, color: 'text-green-500', emoji: '🧾' },
                    { label: 'Promedio/Venta', val: `Q${reporte.total_transacciones > 0 ? (parseFloat(reporte.total_ventas) / parseInt(reporte.total_transacciones)).toFixed(2) : '0.00'}`, color: 'text-purple-500', emoji: '📈' },
                    { label: 'IVA Generado', val: `Q${parseFloat(reporte.total_iva || 0).toFixed(2)}`, color: 'text-orange-500', emoji: '🏛️' },
                  ].map(({ label, val, color, emoji }) => (
                    <div key={label} className={`p-4 rounded-2xl text-center ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="text-2xl mb-1">{emoji}</div>
                      <div className={`text-lg font-black ${color}`}>{val}</div>
                      <div className={`text-xs mt-1 ${textSub}`}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* DESGLOSE MÉTODOS */}
                {reporte.por_metodo && reporte.por_metodo.length > 0 && (
                  <div className={`p-4 rounded-2xl mb-4 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className={`text-xs font-bold uppercase mb-3 ${textSub}`}>💳 Por Método de Pago</h3>
                    <div className="space-y-2">
                      {reporte.por_metodo.map(m => {
                        const pct = reporte.total_ventas > 0 ? (parseFloat(m.total) / parseFloat(reporte.total_ventas)) * 100 : 0
                        return (
                          <div key={m.metodo_pago}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className={`font-semibold ${text}`}>{m.metodo_pago === 'efectivo' ? '💵' : m.metodo_pago === 'tarjeta' ? '💳' : '📱'} {m.metodo_pago}</span>
                              <span className={`font-black ${text}`}>Q{parseFloat(m.total).toFixed(2)} <span className={`font-normal text-xs ${textSub}`}>({pct.toFixed(0)}%)</span></span>
                            </div>
                            <div className={`h-2 rounded-full ${modoOscuro ? 'bg-gray-600' : 'bg-gray-200'}`}>
                              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* GRÁFICA VENTAS POR DÍA */}
                {reporte.por_dia && reporte.por_dia.length > 0 && (
                  <div className={`p-4 rounded-2xl mb-4 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className={`text-xs font-bold uppercase mb-3 ${textSub}`}>📅 Ventas por Día</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={reporte.por_dia.map(d => ({ fecha: new Date(d.fecha).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' }), total: parseFloat(d.total) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke={modoOscuro ? '#374151' : '#f3f4f6'} />
                        <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: tickColor }} />
                        <YAxis tick={{ fontSize: 10, fill: tickColor }} />
                        <Tooltip contentStyle={tooltipStyle} formatter={v => [`Q${v.toFixed(2)}`, 'Ventas']} />
                        <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* TOP PRODUCTOS */}
                {reporte.top_productos && reporte.top_productos.length > 0 && (
                  <div className={`p-4 rounded-2xl ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className={`text-xs font-bold uppercase mb-3 ${textSub}`}>🏆 Top Productos</h3>
                    <div className="space-y-2">
                      {reporte.top_productos.slice(0, 5).map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black w-5 ${textSub}`}>{i + 1}.</span>
                            <span className={`text-sm font-semibold ${text}`}>{p.nombre}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-blue-500">Q{parseFloat(p.total_dinero || 0).toFixed(2)}</span>
                            <span className={`text-xs ml-2 ${textSub}`}>{p.total_vendido} uds</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <button onClick={() => verReporte(modalReporte)} disabled={cargandoReporte}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
              🔄 Actualizar Reporte
            </button>
          </div>
        </div>
      )}
    </div>
  )
}