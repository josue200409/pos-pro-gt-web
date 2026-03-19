import { useState, useEffect } from 'react'
import { sucursalesService } from '../services/api'
import { useTema } from '../context/TemaContext'
import { useToast } from '../components/Toast'

export default function SucursalesPage() {
  const { toast } = useToast()
  const { modoOscuro } = useTema()
  const [sucursales, setSucursales] = useState([])
  const [modalForm, setModalForm] = useState(false)
  const [modalReporte, setModalReporte] = useState(null)
  const [reporte, setReporte] = useState(null)
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
      toast(editando ? 'Sucursal actualizada' : 'Sucursal creada correctamente', 'exito')
    } catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const eliminar = async (s) => {
    if (s.id === 1) return alert('No puedes eliminar la sucursal principal')
    if (!confirm(`¿Eliminar "${s.nombre}"?`)) return
    await sucursalesService.eliminar(s.id)
    cargarSucursales()
  }

  const verReporte = async (s) => {
    setModalReporte(s)
    setReporte(null)
    try {
      const r = await sucursalesService.reporte(s.id, fechaDesde, fechaHasta)
      setReporte(r.data)
    } catch { setReporte(null) }
  }

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>🏪 Sucursales</h1>
          <p className={`text-sm mt-1 ${textSub}`}>{sucursales.length} sucursales activas</p>
        </div>
        <button onClick={() => abrirModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">+ Nueva</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sucursales.map(s => (
          <div key={s.id} className={`${card} p-5 hover:shadow-lg transition-all ${s.id === 1 ? 'border-blue-400' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md ${s.id === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-700' : modoOscuro ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  🏪
                </div>
                <div>
                  <h3 className={`font-black ${text}`}>{s.nombre}</h3>
                  {s.id === 1 && <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">PRINCIPAL</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => abrirModal(s)} className={`p-1.5 rounded-lg ${modoOscuro ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}>✏️</button>
                {s.id !== 1 && <button onClick={() => eliminar(s)} className={`p-1.5 rounded-lg ${modoOscuro ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-red-50 text-red-600'}`}>🗑️</button>}
              </div>
            </div>

            <div className="space-y-1 mb-4">
              {s.direccion && <p className={`text-xs flex items-center gap-1 ${textSub}`}>📍 {s.direccion}</p>}
              {s.telefono && <p className={`text-xs flex items-center gap-1 ${textSub}`}>📞 {s.telefono}</p>}
              {s.encargado && <p className={`text-xs flex items-center gap-1 ${textSub}`}>👤 {s.encargado}</p>}
            </div>

            <div className={`grid grid-cols-3 gap-2 p-3 rounded-xl ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'} mb-3`}>
              {[
                { label: 'Usuarios', val: s.total_usuarios || 0, color: 'text-blue-500' },
                { label: 'Ventas hoy', val: s.ventas_hoy || 0, color: 'text-green-500' },
                { label: 'Monto', val: `Q${parseFloat(s.monto_hoy || 0).toFixed(0)}`, color: 'text-purple-500' },
              ].map(({ label, val, color }) => (
                <div key={label} className="text-center">
                  <div className={`text-sm font-black ${color}`}>{val}</div>
                  <div className={`text-xs ${textSub}`}>{label}</div>
                </div>
              ))}
            </div>

            <button onClick={() => verReporte(s)}
              className={`w-full py-2 rounded-xl text-sm font-bold transition-all ${modoOscuro ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              📊 Ver Reporte
            </button>
          </div>
        ))}
      </div>

      {/* MODAL FORM */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-black mb-4 ${text}`}>{editando ? '✏️ Editar Sucursal' : '🏪 Nueva Sucursal'}</h2>
            <div className="space-y-3">
              {[
                { key: 'nombre', placeholder: 'Nombre *' },
                { key: 'direccion', placeholder: 'Dirección' },
                { key: 'telefono', placeholder: 'Teléfono' },
                { key: 'encargado', placeholder: 'Encargado' },
              ].map(f => (
                <input key={f.key} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} placeholder={f.placeholder} className={inputCls} />
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
          <div className={`rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-slide-up max-h-96 overflow-y-auto ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-black ${text}`}>📊 {modalReporte.nombre}</h2>
              <button onClick={() => setModalReporte(null)} className={`w-8 h-8 rounded-xl ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>✕</button>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className={`${inputCls} flex-1`} />
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className={`${inputCls} flex-1`} />
              <button onClick={() => verReporte(modalReporte)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Buscar</button>
            </div>

            {reporte ? (
              <>
                {reporte.ventas?.length > 0 && (
                  <div className="mb-4">
                    <h3 className={`text-xs font-bold uppercase mb-2 ${textSub}`}>Ventas por método</h3>
                    {reporte.ventas.map((v, i) => (
                      <div key={i} className={`flex justify-between p-3 rounded-xl mb-2 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <span className={`text-sm capitalize ${text}`}>{v.metodo_pago}</span>
                        <div className="text-right">
                          <div className="text-sm font-black text-blue-500">Q{parseFloat(v.monto_total).toFixed(2)}</div>
                          <div className={`text-xs ${textSub}`}>{v.total_ventas} ventas</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {reporte.top_productos?.length > 0 && (
                  <div>
                    <h3 className={`text-xs font-bold uppercase mb-2 ${textSub}`}>Top productos</h3>
                    {reporte.top_productos.map((p, i) => (
                      <div key={i} className={`flex justify-between p-3 rounded-xl mb-2 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <span className={`text-sm ${text}`}>{p.emoji} {p.nombre}</span>
                        <span className="text-sm font-black text-green-500">{p.total_vendido} uds</span>
                      </div>
                    ))}
                  </div>
                )}
                {reporte.ventas?.length === 0 && <p className={`text-center py-4 ${textSub}`}>Sin ventas en este período</p>}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">Cargando reporte...</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}