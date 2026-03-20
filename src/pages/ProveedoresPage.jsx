import { useState, useEffect } from 'react'
import { proveedoresService, productosService } from '../services/api'
import { useTema } from '../context/TemaContext'
import { useToast } from '../components/Toast'
import { sanitizarObjeto } from '../utils/sanitizar'

export default function ProveedoresPage() {
  const { modoOscuro } = useTema()
  const { toast } = useToast()
  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos] = useState([])
  const [alertasStock, setAlertasStock] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modalForm, setModalForm] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [modalCompra, setModalCompra] = useState(null)
  const [comprasProveedor, setComprasProveedor] = useState([])
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', direccion: '', notas: '' })
  const [formCompra, setFormCompra] = useState({ notas: '', items: [{ producto_id: '', cantidad: '', precio_unitario: '' }] })
  const [guardandoCompra, setGuardandoCompra] = useState(false)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [p, prods, alertas] = await Promise.all([
        proveedoresService.obtenerTodos(),
        productosService.obtenerTodos(),
        proveedoresService.alertasStockBajo()
      ])
      setProveedores(p.data || [])
      setProductos(prods.data || [])
      setAlertasStock(alertas.data || [])
    } catch (e) { console.log(e) }
  }

  const abrirModal = (p = null) => {
    if (p) { setEditando(p); setForm({ nombre: p.nombre, contacto: p.contacto || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '', notas: p.notas || '' }) }
    else { setEditando(null); setForm({ nombre: '', contacto: '', telefono: '', email: '', direccion: '', notas: '' }) }
    setModalForm(true)
  }

 const guardar = async () => {
  if (!form.nombre) return alert('Nombre requerido')
  try {
    const formLimpio = sanitizarObjeto(form)
    if (editando) await proveedoresService.actualizar(editando.id, formLimpio)
    else await proveedoresService.crear(formLimpio)
      setModalForm(false)
      cargarDatos()
      toast(editando ? 'Proveedor actualizado' : 'Proveedor creado', 'exito')
    } catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const eliminar = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    await proveedoresService.eliminar(p.id)
    cargarDatos()
    toast('Proveedor eliminado', 'exito')
  }

  const verCompras = async (p) => {
    setModalDetalle(p)
    try {
      const r = await proveedoresService.compras(p.id)
      setComprasProveedor(r.data || [])
    } catch { setComprasProveedor([]) }
  }

  const abrirModalCompra = (p) => {
    setModalCompra(p)
    setFormCompra({ notas: '', items: [{ producto_id: '', cantidad: '', precio_unitario: '' }] })
  }

  const agregarItem = () => {
    setFormCompra(prev => ({ ...prev, items: [...prev.items, { producto_id: '', cantidad: '', precio_unitario: '' }] }))
  }

  const eliminarItem = (i) => {
    setFormCompra(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }))
  }

  const actualizarItem = (i, campo, valor) => {
    setFormCompra(prev => ({
      ...prev,
      items: prev.items.map((item, idx) => idx === i ? { ...item, [campo]: valor } : item)
    }))
  }

  const registrarCompra = async () => {
    const itemsValidos = formCompra.items.filter(i => i.producto_id && i.cantidad && i.precio_unitario)
    if (itemsValidos.length === 0) return alert('Agrega al menos un producto')
    setGuardandoCompra(true)
    try {
      await proveedoresService.registrarCompra(modalCompra.id, {
        ...formCompra,
        items: itemsValidos.map(i => ({
          producto_id: parseInt(i.producto_id),
          cantidad: parseInt(i.cantidad),
          precio_unitario: parseFloat(i.precio_unitario)
        }))
      })
      setModalCompra(null)
      cargarDatos()
      toast('Compra registrada y stock actualizado', 'exito')
    } catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
    setGuardandoCompra(false)
  }

  const totalCompra = formCompra.items.reduce((s, i) => s + (parseFloat(i.cantidad) || 0) * (parseFloat(i.precio_unitario) || 0), 0)

  const proveedoresFiltrados = proveedores.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200'}`

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>🏭 Proveedores</h1>
          <p className={`text-sm mt-1 ${textSub}`}>{proveedores.length} proveedores registrados</p>
        </div>
        <button onClick={() => abrirModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">+ Nuevo</button>
      </div>

      {/* ALERTAS STOCK BAJO */}
      {alertasStock.length > 0 && (
        <div className={`rounded-2xl p-4 mb-6 border ${modoOscuro ? 'bg-orange-900 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
          <h3 className={`font-bold mb-2 ${modoOscuro ? 'text-orange-300' : 'text-orange-800'}`}>🛒 Productos que necesitas comprar ({alertasStock.length})</h3>
          <div className="flex flex-wrap gap-2">
            {alertasStock.slice(0, 8).map(p => (
              <span key={p.id} className={`text-xs px-2 py-1 rounded-full font-bold ${p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {p.nombre}: {p.stock === 0 ? 'Agotado' : `${p.stock} uds`}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={`${card} p-4 mb-4`}>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar proveedor..."
          className={`w-full px-4 py-2 rounded-xl border text-sm focus:outline-none ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200'}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proveedoresFiltrados.map(p => (
          <div key={p.id} className={`${card} p-5 hover:shadow-lg transition-all`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${modoOscuro ? 'bg-gray-700' : 'bg-blue-50'}`}>🏭</div>
                <div>
                  <h3 className={`font-black text-sm ${text}`}>{p.nombre}</h3>
                  {p.contacto && <p className={`text-xs ${textSub}`}>{p.contacto}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirModal(p)} className={`p-1.5 rounded-lg ${modoOscuro ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}>✏️</button>
                <button onClick={() => eliminar(p)} className={`p-1.5 rounded-lg ${modoOscuro ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-red-50 text-red-600'}`}>🗑️</button>
              </div>
            </div>

            <div className="space-y-1 mb-3">
              {p.telefono && <p className={`text-xs ${textSub}`}>📞 {p.telefono}</p>}
              {p.email && <p className={`text-xs ${textSub}`}>📧 {p.email}</p>}
              {p.direccion && <p className={`text-xs ${textSub}`}>📍 {p.direccion}</p>}
            </div>

            <div className={`grid grid-cols-2 gap-2 p-3 rounded-xl mb-3 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className="text-sm font-black text-blue-500">{p.total_compras || 0}</div>
                <div className={`text-xs ${textSub}`}>Compras</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-black text-green-500">Q{parseFloat(p.total_gastado || 0).toFixed(0)}</div>
                <div className={`text-xs ${textSub}`}>Total</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => abrirModalCompra(p)}
                className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-700 shadow-sm">
                + Registrar Compra
              </button>
              <button onClick={() => verCompras(p)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold ${modoOscuro ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                📋 Historial
              </button>
            </div>
          </div>
        ))}
        {proveedoresFiltrados.length === 0 && (
          <div className={`col-span-3 ${card} p-12 text-center`}>
            <div className="text-4xl mb-2">🏭</div>
            <p className={textSub}>No se encontraron proveedores</p>
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-black mb-4 ${text}`}>{editando ? '✏️ Editar' : '🏭 Nuevo Proveedor'}</h2>
            <div className="space-y-3">
              {[
                { key: 'nombre', placeholder: 'Nombre *' },
                { key: 'contacto', placeholder: 'Persona de contacto' },
                { key: 'telefono', placeholder: 'Teléfono' },
                { key: 'email', placeholder: 'Email' },
                { key: 'direccion', placeholder: 'Dirección' },
                { key: 'notas', placeholder: 'Notas' },
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

      {/* MODAL HISTORIAL */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-slide-up max-h-96 overflow-y-auto ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-black ${text}`}>📋 {modalDetalle.nombre}</h2>
              <button onClick={() => setModalDetalle(null)} className={`w-8 h-8 rounded-xl ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>✕</button>
            </div>
            {comprasProveedor.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📋</div>
                <p className={textSub}>Sin compras registradas</p>
              </div>
            ) : comprasProveedor.map(c => (
              <div key={c.id} className={`p-4 rounded-xl mb-3 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-bold ${text}`}>{new Date(c.fecha).toLocaleDateString('es-GT')}</span>
                  <span className="text-sm font-black text-blue-500">Q{parseFloat(c.total).toFixed(2)}</span>
                </div>
                {c.notas && <p className={`text-xs ${textSub}`}>{c.notas}</p>}
                {c.detalle && c.detalle.map((d, i) => (
                  <div key={i} className={`text-xs mt-1 ${textSub}`}>• {d.nombre}: {d.cantidad} uds @ Q{d.precio_unitario}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL COMPRA */}
      {modalCompra && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-slide-up max-h-screen overflow-y-auto ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-black ${text}`}>🛒 Compra a {modalCompra.nombre}</h2>
              <button onClick={() => setModalCompra(null)} className={`w-8 h-8 rounded-xl ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>✕</button>
            </div>

            <div className="space-y-3 mb-4">
              {formCompra.items.map((item, i) => (
                <div key={i} className={`p-3 rounded-xl ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold ${textSub}`}>Producto {i + 1}</span>
                    {formCompra.items.length > 1 && (
                      <button onClick={() => eliminarItem(i)} className="ml-auto text-xs text-red-500 font-bold">🗑️</button>
                    )}
                  </div>
                  <select value={item.producto_id} onChange={e => actualizarItem(i, 'producto_id', e.target.value)} className={`${inputCls} mb-2`}>
                    <option value="">Selecciona producto *</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={item.cantidad} onChange={e => actualizarItem(i, 'cantidad', e.target.value)} placeholder="Cantidad *" className={inputCls} />
                    <input type="number" value={item.precio_unitario} onChange={e => actualizarItem(i, 'precio_unitario', e.target.value)} placeholder="Precio unit. *" className={inputCls} />
                  </div>
                  {item.cantidad && item.precio_unitario && (
                    <p className={`text-xs mt-1 font-bold text-blue-500`}>Subtotal: Q{(parseFloat(item.cantidad) * parseFloat(item.precio_unitario)).toFixed(2)}</p>
                  )}
                </div>
              ))}
            </div>

            <button onClick={agregarItem} className={`w-full py-2 rounded-xl text-sm font-bold mb-4 ${modoOscuro ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              + Agregar otro producto
            </button>

            <input value={formCompra.notas} onChange={e => setFormCompra({...formCompra, notas: e.target.value})} placeholder="Notas de la compra (opcional)" className={`${inputCls} mb-4`} />

            <div className={`flex justify-between items-center p-3 rounded-xl mb-4 ${modoOscuro ? 'bg-blue-900' : 'bg-blue-50'}`}>
              <span className="text-sm font-bold text-blue-500">Total de la compra</span>
              <span className="text-xl font-black text-blue-500">Q{totalCompra.toFixed(2)}</span>
            </div>

            <div className={`p-3 rounded-xl mb-4 text-xs ${modoOscuro ? 'bg-green-900 text-green-300' : 'bg-green-50 text-green-700'}`}>
              ✅ Al registrar la compra, el stock de los productos se actualizará automáticamente
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalCompra(null)} className={`flex-1 py-2 rounded-xl border text-sm ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cancelar</button>
              <button onClick={registrarCompra} disabled={guardandoCompra} className="flex-1 py-2 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 disabled:opacity-50 shadow-md">
                {guardandoCompra ? '⏳ Registrando...' : '✅ Registrar Compra'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}