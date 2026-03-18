import { useState, useEffect } from 'react'
import { productosService } from '../services/api'
import { useTema } from '../context/TemaContext'

const BASE_URL = 'https://pos-pro-gt-backend.onrender.com/api'

async function apiMermas(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token')
  const config = { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
  if (body) config.body = JSON.stringify(body)
  const res = await fetch(`${BASE_URL}/mermas${endpoint}`, config)
  return res.json()
}

const TIPOS = [
  { value: 'vencido', label: 'Vencido', emoji: '📅', color: '#EF4444' },
  { value: 'danado', label: 'Dañado', emoji: '💥', color: '#F97316' },
  { value: 'robo_perdida', label: 'Robo/Pérdida', emoji: '🔍', color: '#8B5CF6' },
]

export default function MermasPage() {
  const { modoOscuro } = useTema()
  const [vista, setVista] = useState('registro')
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [productoSel, setProductoSel] = useState(null)
  const [tipo, setTipo] = useState('vencido')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mermas, setMermas] = useState([])
  const [resumen, setResumen] = useState(null)
  const [fechaDesde, setFechaDesde] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [modalProductos, setModalProductos] = useState(false)
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  useEffect(() => { cargarProductos() }, [])
  useEffect(() => {
    if (vista === 'historial') cargarMermas()
    if (vista === 'reporte') cargarResumen()
  }, [vista])

  const cargarProductos = async () => {
    try {
      const r = await productosService.obtenerTodos()
      setProductos(r.data || [])
    } catch (e) { console.log(e) }
  }

  const cargarMermas = async () => {
    setCargando(true)
    try {
      const data = await apiMermas('')
      setMermas(Array.isArray(data) ? data : [])
    } catch { setMermas([]) }
    setCargando(false)
  }

  const cargarResumen = async () => {
    setCargando(true)
    try {
      const data = await apiMermas(`/resumen?fecha_inicio=${fechaDesde}&fecha_fin=${fechaHasta}`)
      setResumen(data)
    } catch { setResumen(null) }
    setCargando(false)
  }

  const registrarMerma = async () => {
    if (!productoSel) return alert('Selecciona un producto')
    if (!cantidad || parseFloat(cantidad) <= 0) return alert('Ingresa una cantidad válida')
    if (parseFloat(cantidad) > productoSel.stock) return alert(`Stock disponible: ${productoSel.stock}`)
    setCargando(true)
    try {
      const res = await apiMermas('', 'POST', { producto_id: productoSel.id, tipo, cantidad: parseFloat(cantidad), motivo })
      if (res.ok) {
        alert(`Merma registrada: ${cantidad} unidades de ${productoSel.nombre}`)
        setProductoSel(null); setCantidad(''); setMotivo('')
        cargarProductos()
      } else alert(res.error || 'Error')
    } catch { alert('Error de conexión') }
    setCargando(false)
  }

  const eliminarMerma = async (id) => {
    if (!confirm('¿Eliminar este registro? Se restaurará el stock.')) return
    const res = await apiMermas(`/${id}`, 'DELETE')
    if (res.ok) cargarMermas()
    else alert(res.error)
  }

  const productosFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  const formatFecha = (f) => f ? new Date(f).toLocaleString('es-GT') : ''
  const formatQ = (n) => `Q${parseFloat(n || 0).toFixed(2)}`

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>📉 Control de Mermas</h1>
          <p className={`text-sm mt-1 ${textSub}`}>Registro de pérdidas de inventario</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { id: 'registro', label: '➕ Registrar' },
          { id: 'historial', label: '📋 Historial' },
          { id: 'reporte', label: '📊 Reporte' },
        ].map(t => (
          <button key={t.id} onClick={() => setVista(t.id)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${vista === t.id ? 'bg-red-600 text-white shadow-md' : modoOscuro ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-white text-gray-500 border border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {vista === 'registro' && (
        <div className="max-w-lg">
          <div className={`${card} p-6 space-y-4`}>
            <div>
              <label className={`text-xs font-bold uppercase mb-2 block ${textSub}`}>Producto</label>
              <button onClick={() => setModalProductos(true)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${modoOscuro ? 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500' : 'border-gray-200 hover:border-blue-400'}`}>
                {productoSel ? (
                  <div>
                    <div className={`font-bold ${text}`}>{productoSel.nombre}</div>
                    <div className={`text-xs ${textSub}`}>Stock: {productoSel.stock}</div>
                  </div>
                ) : <span className={textSub}>Toca para seleccionar producto...</span>}
              </button>
            </div>

            <div>
              <label className={`text-xs font-bold uppercase mb-2 block ${textSub}`}>Tipo de merma</label>
              <div className="grid grid-cols-3 gap-2">
                {TIPOS.map(t => (
                  <button key={t.value} onClick={() => setTipo(t.value)}
                    style={tipo === t.value ? { backgroundColor: t.color, borderColor: t.color } : {}}
                    className={`py-3 rounded-xl border-2 text-center transition-all ${tipo === t.value ? 'text-white' : modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
                    <div className="text-xl">{t.emoji}</div>
                    <div className="text-xs font-bold mt-1">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`text-xs font-bold uppercase mb-2 block ${textSub}`}>Cantidad</label>
              <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="Ej: 5" className={inputCls} />
              {productoSel && parseFloat(cantidad) > 0 && (
                <p className="text-red-500 text-xs mt-1 font-bold">
                  Pérdida estimada: {formatQ((productoSel.costo || productoSel.precio || 0) * parseFloat(cantidad))}
                </p>
              )}
            </div>

            <div>
              <label className={`text-xs font-bold uppercase mb-2 block ${textSub}`}>Motivo (opcional)</label>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Describe la causa..." rows={3}
                className={`${inputCls} resize-none`} />
            </div>

            <button onClick={registrarMerma} disabled={cargando}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:opacity-50 shadow-md">
              {cargando ? '⏳ Registrando...' : '📉 Registrar Merma'}
            </button>

            <div className={`rounded-xl p-3 text-xs ${modoOscuro ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
              ⚠️ Al registrar una merma, el stock se descuenta automáticamente.
            </div>
          </div>
        </div>
      )}

      {vista === 'historial' && (
        <div className={`${card} overflow-hidden`}>
          <div className={`p-4 border-b flex items-center justify-between ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`font-bold ${text}`}>Historial de Mermas</h2>
            <button onClick={cargarMermas} className="text-sm text-blue-500 font-bold">🔄 Actualizar</button>
          </div>
          {cargando ? (
            <div className="p-8 text-center text-gray-400">Cargando...</div>
          ) : mermas.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📋</div>
              <p className={textSub}>No hay registros de mermas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <tr>
                    <th className="px-4 py-3 text-left">Producto</th>
                    <th className="px-4 py-3 text-center">Tipo</th>
                    <th className="px-4 py-3 text-center">Cantidad</th>
                    <th className="px-4 py-3 text-right">Pérdida</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Empleado</th>
                    {usuario.rol === 'admin' && <th className="px-4 py-3 text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {mermas.map(m => {
                    const t = TIPOS.find(x => x.value === m.tipo) || TIPOS[0]
                    return (
                      <tr key={m.id} className={`transition-colors ${modoOscuro ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                        <td className={`px-4 py-3 text-sm font-semibold ${text}`}>{m.nombre_producto}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-lg">{t.emoji}</span>
                          <span className={`text-xs ml-1 ${textSub}`}>{t.label}</span>
                        </td>
                        <td className={`px-4 py-3 text-center text-sm font-bold ${text}`}>{m.cantidad}</td>
                        <td className="px-4 py-3 text-right text-sm font-black text-red-500">{formatQ(m.total_perdida)}</td>
                        <td className={`px-4 py-3 text-xs ${textSub}`}>{formatFecha(m.fecha)}</td>
                        <td className={`px-4 py-3 text-xs ${textSub}`}>{m.nombre_usuario || 'N/A'}</td>
                        {usuario.rol === 'admin' && (
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => eliminarMerma(m.id)} className="text-xs font-bold text-red-500 hover:text-red-700">Eliminar</button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {vista === 'reporte' && (
        <div className="space-y-4">
          <div className={`${card} p-5`}>
            <div className="flex gap-3 items-end flex-wrap">
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
              <button onClick={cargarResumen} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md">Generar</button>
            </div>
          </div>

          {resumen && (
            <>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Pérdida total', val: formatQ(resumen.total?.total_quetzales), color: 'text-red-500' },
                  { label: 'Unidades perdidas', val: parseFloat(resumen.total?.total_unidades || 0).toFixed(0), color: 'text-orange-500' },
                  { label: 'Registros', val: resumen.total?.total_registros || 0, color: 'text-purple-500' },
                ].map(({ label, val, color }) => (
                  <div key={label} className={`${card} p-5 text-center`}>
                    <div className={`text-2xl font-black ${color}`}>{val}</div>
                    <div className={`text-xs mt-1 ${textSub}`}>{label}</div>
                  </div>
                ))}
              </div>

              {resumen.por_tipo?.length > 0 && (
                <div className={`${card} p-5`}>
                  <h3 className={`font-bold mb-4 ${text}`}>Por tipo de merma</h3>
                  {resumen.por_tipo.map((t, i) => {
                    const info = TIPOS.find(x => x.value === t.tipo) || TIPOS[0]
                    return (
                      <div key={i} className={`flex justify-between items-center py-2 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'} last:border-0`}>
                        <span className={`text-sm ${text}`}>{info.emoji} {info.label}</span>
                        <div className="text-right">
                          <div className="text-sm font-bold" style={{ color: info.color }}>{formatQ(t.quetzales)}</div>
                          <div className={`text-xs ${textSub}`}>{t.unidades} uds</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {resumen.por_producto?.length > 0 && (
                <div className={`${card} p-5`}>
                  <h3 className={`font-bold mb-4 ${text}`}>Top productos con más merma</h3>
                  {resumen.por_producto.map((p, i) => (
                    <div key={i} className={`flex justify-between items-center py-2 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'} last:border-0`}>
                      <span className={`text-sm ${text}`}>{i + 1}. {p.nombre_producto}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-500">{formatQ(p.quetzales)}</div>
                        <div className={`text-xs ${textSub}`}>{p.unidades} uds</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {modalProductos && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md max-h-96 flex flex-col shadow-2xl ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-black mb-3 ${text}`}>Seleccionar Producto</h2>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..."
              className={`w-full px-3 py-2 rounded-xl border focus:outline-none text-sm mb-3 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} autoFocus />
            <div className="overflow-y-auto flex-1">
              {productosFiltrados.slice(0, 30).map(p => (
                <button key={p.id} onClick={() => { setProductoSel(p); setModalProductos(false); setBusqueda('') }}
                  className={`w-full text-left px-3 py-3 border-b transition-all ${modoOscuro ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <div className={`font-semibold text-sm ${text}`}>{p.nombre}</div>
                  <div className={`text-xs ${textSub}`}>Stock: {p.stock} | Q{parseFloat(p.precio).toFixed(2)}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setModalProductos(false)}
              className={`mt-3 w-full py-2 rounded-xl text-sm font-bold ${modoOscuro ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}