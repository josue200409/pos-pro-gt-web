import { useState, useEffect } from 'react'
import { productosService } from '../services/api'
import { useTema } from '../context/TemaContext'

const BASE_URL = 'https://pos-pro-gt-backend.onrender.com/api'

async function apiMermas(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token')
  const config = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  }
  if (body) config.body = JSON.stringify(body)
  const res = await fetch(`${BASE_URL}/mermas${endpoint}`, config)
  return res.json()
}

const TIPOS = [
  { value: 'vencido', label: 'Vencido', emoji: '📅', color: '#EF4444' },
  { value: 'danado', label: 'Dañado', emoji: '💥', color: '#F97316' },
  { value: 'robo_perdida', label: 'Robo/Pérdida', emoji: '🔍', color: '#8B5CF6' },
]

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
      const res = await apiMermas('', 'POST', {
        producto_id: productoSel.id,
        tipo, cantidad: parseFloat(cantidad), motivo
      })
      if (res.ok) {
        alert(`✅ Merma registrada: ${cantidad} unidades de ${productoSel.nombre}`)
        setProductoSel(null)
        setCantidad('')
        setMotivo('')
        cargarProductos()
      } else alert(res.error || 'Error al registrar')
    } catch { alert('Error de conexión') }
    setCargando(false)
  }

  const eliminarMerma = async (id) => {
    if (!confirm('¿Eliminar este registro? Se restaurará el stock.')) return
    const res = await apiMermas(`/${id}`, 'DELETE')
    if (res.ok) cargarMermas()
    else alert(res.error)
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const formatFecha = (f) => f ? new Date(f).toLocaleString('es-GT') : ''
  const formatQ = (n) => `Q${parseFloat(n || 0).toFixed(2)}`

  return (
    <div className={`p-6 ${modoOscuro ? 'bg-gray-900' : 'bg-gray-50'} min-h-full`}>
      <h1 className={`text-2xl font-black ${modoOscuro ? 'text-white' : 'text-gray-800'}`}>📉 Control de Mermas</h1>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'registro', label: '➕ Registrar' },
          { id: 'historial', label: '📋 Historial' },
          { id: 'reporte', label: '📊 Reporte' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setVista(t.id)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${vista === t.id ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* REGISTRO */}
      {vista === 'registro' && (
        <div className="max-w-lg">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Producto</label>
              <button
                onClick={() => setModalProductos(true)}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-400 transition-all"
              >
                {productoSel ? (
                  <div>
                    <div className="font-bold text-gray-800">{productoSel.nombre}</div>
                    <div className="text-xs text-gray-400">Stock disponible: {productoSel.stock}</div>
                  </div>
                ) : (
                  <span className="text-gray-400">Toca para seleccionar producto...</span>
                )}
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Tipo de merma</label>
              <div className="grid grid-cols-3 gap-2">
                {TIPOS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTipo(t.value)}
                    style={tipo === t.value ? { backgroundColor: t.color, borderColor: t.color } : {}}
                    className={`py-3 rounded-xl border-2 text-center transition-all ${tipo === t.value ? 'text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <div className="text-xl">{t.emoji}</div>
                    <div className="text-xs font-bold mt-1">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                placeholder="Ej: 5"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              {productoSel && parseFloat(cantidad) > 0 && (
                <p className="text-red-500 text-xs mt-1 font-bold">
                  Pérdida estimada: {formatQ((productoSel.costo || productoSel.precio || 0) * parseFloat(cantidad))}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Motivo (opcional)</label>
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Describe la causa..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
              />
            </div>

            <button
              onClick={registrarMerma}
              disabled={cargando}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:opacity-50"
            >
              {cargando ? '⏳ Registrando...' : '📉 Registrar Merma'}
            </button>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
              ⚠️ Al registrar una merma, el stock del producto se descuenta automáticamente del inventario.
            </div>
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      {vista === 'historial' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-bold text-gray-700">Historial de Mermas</h2>
            <button onClick={cargarMermas} className="text-sm text-blue-600 font-bold">🔄 Actualizar</button>
          </div>
          {cargando ? (
            <div className="p-8 text-center text-gray-400">Cargando...</div>
          ) : mermas.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">📋</div>
              <p>No hay registros de mermas</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
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
              <tbody className="divide-y divide-gray-100">
                {mermas.map(m => {
                  const t = TIPOS.find(x => x.value === m.tipo) || TIPOS[0]
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">{m.nombre_producto}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-lg">{t.emoji}</span>
                        <span className="text-xs text-gray-500 ml-1">{t.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold">{m.cantidad}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-red-600">{formatQ(m.total_perdida)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatFecha(m.fecha)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{m.nombre_usuario || 'N/A'}</td>
                      {usuario.rol === 'admin' && (
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => eliminarMerma(m.id)} className="text-red-600 text-xs font-bold hover:text-red-800">Eliminar</button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* REPORTE */}
      {vista === 'reporte' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex gap-3 items-end">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Desde</label>
                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Hasta</label>
                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-sm" />
              </div>
              <button onClick={cargarResumen} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Generar</button>
            </div>
          </div>

          {resumen && (
            <>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Pérdida total', val: formatQ(resumen.total?.total_quetzales), color: 'text-red-600' },
                  { label: 'Unidades perdidas', val: parseFloat(resumen.total?.total_unidades || 0).toFixed(0), color: 'text-orange-600' },
                  { label: 'Registros', val: resumen.total?.total_registros || 0, color: 'text-purple-600' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                    <div className={`text-2xl font-black ${color}`}>{val}</div>
                    <div className="text-xs text-gray-400 mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {resumen.por_tipo?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-700 mb-4">Por tipo de merma</h3>
                  {resumen.por_tipo.map((t, i) => {
                    const info = TIPOS.find(x => x.value === t.tipo) || TIPOS[0]
                    return (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm">{info.emoji} {info.label}</span>
                        <div className="text-right">
                          <div className="text-sm font-bold" style={{ color: info.color }}>{formatQ(t.quetzales)}</div>
                          <div className="text-xs text-gray-400">{t.unidades} uds</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {resumen.por_producto?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-700 mb-4">Top productos con más merma</h3>
                  {resumen.por_producto.map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm">{i + 1}. {p.nombre_producto}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-600">{formatQ(p.quetzales)}</div>
                        <div className="text-xs text-gray-400">{p.unidades} uds</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MODAL PRODUCTOS */}
      {modalProductos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-96 flex flex-col">
            <h2 className="text-lg font-black mb-3">Seleccionar Producto</h2>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-sm mb-3"
              autoFocus
            />
            <div className="overflow-y-auto flex-1">
              {productosFiltrados.slice(0, 30).map(p => (
                <button
                  key={p.id}
                  onClick={() => { setProductoSel(p); setModalProductos(false); setBusqueda('') }}
                  className="w-full text-left px-3 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <div className="font-semibold text-sm text-gray-800">{p.nombre}</div>
                  <div className="text-xs text-gray-400">Stock: {p.stock} | Q{parseFloat(p.precio).toFixed(2)}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setModalProductos(false)} className="mt-3 w-full py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
