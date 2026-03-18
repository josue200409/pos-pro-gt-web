import { useState, useEffect, useRef } from 'react'
import { productosService, ventasService, clientesService } from '../services/api'
import { useTema } from '../context/TemaContext'

export default function POSPage() {
  const { modoOscuro } = useTema()
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [clientes, setClientes] = useState([])
  const [clienteActivo, setClienteActivo] = useState(null)
  const [descuento, setDescuento] = useState(0)
  const [ventaExitosa, setVentaExitosa] = useState(false)
  const [ventasHoy, setVentasHoy] = useState([])
  const [vistaCarrito, setVistaCarrito] = useState('carrito')
  const [modalDetalle, setModalDetalle] = useState(null)
  const busquedaRef = useRef()

  // Pago mixto
  const [metodosActivos, setMetodosActivos] = useState(['efectivo'])
  const [pagos, setPagos] = useState({ efectivo: '', tarjeta: '', transferencia: '' })

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [prods, clts, ventas] = await Promise.all([
        productosService.obtenerTodos(),
        clientesService.obtenerTodos(),
        ventasService.obtenerTodas()
      ])
      setProductos(prods.data || [])
      setClientes(clts.data || [])
      setVentasHoy(ventas.data || [])
    } catch (e) { console.log('Error:', e) }
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo_barras && p.codigo_barras.includes(busqueda))
  )

  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) return
    setCarrito(prev => {
      const existe = prev.find(i => i.id === producto.id)
      if (existe) {
        if (existe.cantidad >= producto.stock) return prev
        return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      return [...prev, { ...producto, cantidad: 1 }]
    })
  }

  const cambiarCantidad = (id, cantidad) => {
    if (cantidad <= 0) return eliminarDelCarrito(id)
    const producto = productos.find(p => p.id === id)
    if (cantidad > producto.stock) return
    setCarrito(prev => prev.map(i => i.id === id ? { ...i, cantidad } : i))
  }

  const eliminarDelCarrito = (id) => setCarrito(prev => prev.filter(i => i.id !== id))

  const toggleMetodo = (m) => {
    setMetodosActivos(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    )
    setPagos(prev => ({ ...prev, [m]: '' }))
  }

  const subtotal = carrito.reduce((s, i) => s + parseFloat(i.precio) * i.cantidad, 0)
  const montoDescuento = subtotal * (descuento / 100)
  const total = subtotal - montoDescuento
  const totalPagado = metodosActivos.reduce((s, m) => s + (parseFloat(pagos[m]) || 0), 0)
  const vuelto = metodosActivos.includes('efectivo') && totalPagado >= total ? totalPagado - total : 0
  const pagoValido = totalPagado >= total && total > 0

  const metodoPagoBackend = () => {
    if (metodosActivos.length === 1) return metodosActivos[0]
    return 'mixto'
  }

  const procesarVenta = async () => {
    if (carrito.length === 0) return alert('El carrito está vacío')
    if (!pagoValido) return alert(`Faltan Q${(total - totalPagado).toFixed(2)} por cubrir`)
    setProcesando(true)
    try {
      await ventasService.crear({
        items: carrito.map(i => ({ producto_id: i.id, cantidad: i.cantidad, precio: parseFloat(i.precio) })),
        subtotal, descuento: montoDescuento, total,
        metodo_pago: metodoPagoBackend(),
        cliente_id: clienteActivo?.id || null,
        efectivo_recibido: totalPagado,
        vuelto,
        pagos_detalle: {
          efectivo: parseFloat(pagos.efectivo) || 0,
          tarjeta: parseFloat(pagos.tarjeta) || 0,
          transferencia: parseFloat(pagos.transferencia) || 0,
        }
      })
      setCarrito([])
      setPagos({ efectivo: '', tarjeta: '', transferencia: '' })
      setMetodosActivos(['efectivo'])
      setDescuento(0)
      setClienteActivo(null)
      setVentaExitosa(true)
      setTimeout(() => setVentaExitosa(false), 3000)
      cargarDatos()
      busquedaRef.current?.focus()
    } catch (e) {
      alert(e.response?.data?.error || 'Error al procesar la venta')
    }
    setProcesando(false)
  }

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-800'}`

  const metodoInfo = {
    efectivo: { emoji: '💵', label: 'Efectivo', color: 'bg-green-600' },
    tarjeta: { emoji: '💳', label: 'Tarjeta', color: 'bg-blue-600' },
    transferencia: { emoji: '📱', label: 'Transfer', color: 'bg-purple-600' },
  }

  const formatHora = (iso) => new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex h-full ${bg}`}>
      {/* PRODUCTOS */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="mb-3">
          <input
            ref={busquedaRef}
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar producto o escanear código de barras..."
            className={inputCls}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 overflow-y-auto flex-1 pb-2">
          {productosFiltrados.map(p => {
            const enCarrito = carrito.find(i => i.id === p.id)
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  p.stock <= 0 ? 'opacity-50 cursor-not-allowed' :
                  enCarrito ? (modoOscuro ? 'border-blue-500 bg-gray-700' : 'border-blue-400 bg-blue-50') :
                  (modoOscuro ? 'border-gray-700 bg-gray-800 hover:border-gray-500' : 'border-gray-100 bg-white hover:border-blue-200')
                }`}
                onClick={() => !modalDetalle && agregarAlCarrito(p)}
              >
                {/* FOTO O EMOJI */}
                <div className={`h-24 flex items-center justify-center ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'} relative`}>
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{p.emoji || '📦'}</span>
                  )}
                  {enCarrito && (
                    <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-md">
                      {enCarrito.cantidad}
                    </div>
                  )}
                  {p.stock <= p.stock_minimo && p.stock > 0 && (
                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">⚠</div>
                  )}
                </div>

                <div className="p-2">
                  <p className={`text-xs font-semibold line-clamp-2 mb-1 ${text}`}>{p.nombre}</p>
                  <p className="text-sm font-black text-blue-500">Q{parseFloat(p.precio).toFixed(2)}</p>
                  <p className={`text-xs ${p.stock <= 0 ? 'text-red-500' : p.stock <= p.stock_minimo ? 'text-yellow-500' : 'text-green-500'}`}>
                    {p.stock <= 0 ? 'Agotado' : `${p.stock} uds`}
                  </p>
                </div>

                {/* BOTÓN INFO */}
                <button
                  onClick={e => { e.stopPropagation(); setModalDetalle(p) }}
                  className={`absolute bottom-1 right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-60 hover:opacity-100 ${modoOscuro ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-500'}`}
                >
                  i
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* CARRITO */}
      <div className={`w-80 flex flex-col border-l ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* TABS */}
        <div className={`flex border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
          {[
            { id: 'carrito', label: `🧾 Factura (${carrito.length})` },
            { id: 'historial', label: `📋 Hoy (${ventasHoy.filter(v => !v.cancelada).length})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setVistaCarrito(t.id)}
              className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                vistaCarrito === t.id
                  ? 'border-blue-500 text-blue-500'
                  : `border-transparent ${textSub}`
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* VISTA CARRITO */}
        {vistaCarrito === 'carrito' && (
          <>
            {/* CLIENTE Y DESCUENTO */}
            <div className={`p-3 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'} space-y-2`}>
              <select
                value={clienteActivo?.id || ''}
                onChange={e => setClienteActivo(clientes.find(c => c.id === parseInt(e.target.value)) || null)}
                className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
              >
                <option value="">👤 Sin cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${textSub}`}>Descuento %</span>
                <input
                  type="number"
                  value={descuento}
                  onChange={e => setDescuento(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className={`w-16 text-xs px-2 py-1.5 rounded-lg border focus:outline-none text-center ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                  min="0" max="100"
                />
                {descuento > 0 && <span className="text-xs text-red-500 font-bold">-Q{(subtotal * descuento / 100).toFixed(2)}</span>}
                {carrito.length > 0 && (
                  <button onClick={() => setCarrito([])} className="ml-auto text-xs text-red-500 hover:text-red-700 font-bold">Limpiar</button>
                )}
              </div>
            </div>

            {/* ITEMS */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {ventaExitosa && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-xl text-center font-bold animate-bounce-subtle">
                  ✅ ¡Venta completada!
                </div>
              )}
              {carrito.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">🛒</div>
                  <p className={`text-xs ${textSub}`}>Selecciona productos</p>
                </div>
              ) : carrito.map(item => (
                <div key={item.id} className={`flex items-center gap-2 p-2 rounded-xl ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${modoOscuro ? 'bg-gray-600' : 'bg-white'}`}>
                    {item.foto_url ? (
                      <img src={item.foto_url} alt={item.nombre} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-lg">{item.emoji || '📦'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${text}`}>{item.nombre}</p>
                    <p className="text-xs text-blue-500 font-bold">Q{parseFloat(item.precio).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => cambiarCantidad(item.id, item.cantidad - 1)} className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${modoOscuro ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>-</button>
                    <span className={`w-5 text-center text-xs font-black ${text}`}>{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.id, item.cantidad + 1)} className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${modoOscuro ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>+</button>
                  </div>
                  <p className={`text-xs font-black w-12 text-right flex-shrink-0 ${text}`}>Q{(parseFloat(item.precio) * item.cantidad).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* TOTALES Y PAGO */}
            <div className={`p-3 border-t space-y-3 ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className={`flex justify-between text-lg font-black ${text}`}>
                <span>TOTAL</span>
                <span className="text-blue-500">Q{total.toFixed(2)}</span>
              </div>

              {/* MÉTODOS DE PAGO */}
              <div className="grid grid-cols-3 gap-1">
                {Object.entries(metodoInfo).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => toggleMetodo(key)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      metodosActivos.includes(key)
                        ? `${info.color} text-white shadow-md`
                        : modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {info.emoji} {info.label}
                  </button>
                ))}
              </div>

              {/* INPUTS DE PAGO */}
              <div className="space-y-1.5">
                {metodosActivos.map(m => (
                  <div key={m} className="flex items-center gap-2">
                    <span className="text-lg">{metodoInfo[m].emoji}</span>
                    <input
                      type="number"
                      value={pagos[m]}
                      onChange={e => setPagos(prev => ({ ...prev, [m]: e.target.value }))}
                      placeholder={`Q${m === 'efectivo' && metodosActivos.length === 1 ? total.toFixed(2) : '0.00'}`}
                      className={`flex-1 text-sm px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`}
                    />
                  </div>
                ))}
              </div>

              {/* VUELTO */}
              {vuelto > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-green-700">💵 Vuelto</span>
                  <span className="text-sm font-black text-green-700">Q{vuelto.toFixed(2)}</span>
                </div>
              )}

              {/* PENDIENTE */}
              {totalPagado > 0 && !pagoValido && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-red-600">Pendiente</span>
                  <span className="text-sm font-black text-red-600">Q{(total - totalPagado).toFixed(2)}</span>
                </div>
              )}

              <button
                onClick={procesarVenta}
                disabled={procesando || carrito.length === 0 || !pagoValido}
                className={`w-full font-black py-3 rounded-xl transition-all shadow-md text-white text-sm ${
                  pagoValido && carrito.length > 0
                    ? 'bg-green-600 hover:bg-green-700 hover:shadow-lg active:scale-95'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {procesando ? '⏳ Procesando...' : `✅ Cobrar Q${total.toFixed(2)}`}
              </button>
            </div>
          </>
        )}

        {/* VISTA HISTORIAL */}
        {vistaCarrito === 'historial' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {ventasHoy.filter(v => !v.cancelada).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">📋</div>
                <p className={`text-xs ${textSub}`}>Sin ventas hoy</p>
              </div>
            ) : ventasHoy.filter(v => !v.cancelada).map(v => (
              <div key={v.id} className={`p-3 rounded-xl border ${modoOscuro ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${textSub}`}>{formatHora(v.created_at)}</span>
                  <span className="text-sm font-black text-blue-500">Q{parseFloat(v.total).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs">{v.metodo_pago === 'efectivo' ? '💵' : v.metodo_pago === 'tarjeta' ? '💳' : '📱'}</span>
                  <span className={`text-xs capitalize ${textSub}`}>{v.metodo_pago}</span>
                  {v.vuelto > 0 && <span className={`text-xs ml-auto ${textSub}`}>Vuelto: Q{parseFloat(v.vuelto).toFixed(2)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DETALLE PRODUCTO */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setModalDetalle(null)}>
          <div className={`rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className={`w-full h-40 rounded-xl mb-4 flex items-center justify-center overflow-hidden ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
              {modalDetalle.foto_url ? (
                <img src={modalDetalle.foto_url} alt={modalDetalle.nombre} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-6xl">{modalDetalle.emoji || '📦'}</span>
              )}
            </div>
            <h2 className={`text-lg font-black mb-3 ${text}`}>{modalDetalle.nombre}</h2>
            {[
              { label: 'Precio venta', val: `Q${parseFloat(modalDetalle.precio).toFixed(2)}`, color: 'text-blue-500' },
              { label: 'Precio costo', val: `Q${parseFloat(modalDetalle.costo || 0).toFixed(2)}`, color: textSub },
              { label: 'Stock disponible', val: `${modalDetalle.stock} unidades`, color: modalDetalle.stock <= 0 ? 'text-red-500' : 'text-green-500' },
              { label: 'Código de barras', val: modalDetalle.codigo_barras || 'Sin código', color: textSub },
            ].map(({ label, val, color }) => (
              <div key={label} className={`flex justify-between py-2 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={`text-sm ${textSub}`}>{label}</span>
                <span className={`text-sm font-bold ${color}`}>{val}</span>
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setModalDetalle(null)} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cerrar</button>
              <button
                onClick={() => { agregarAlCarrito(modalDetalle); setModalDetalle(null) }}
                disabled={modalDetalle.stock <= 0}
                className="flex-2 px-6 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                + Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}