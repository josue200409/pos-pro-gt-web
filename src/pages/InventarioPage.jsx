import { useState, useEffect, useRef } from 'react'
import { productosService, categoriasService, inventarioService } from '../services/api'
import { useTema } from '../context/TemaContext'
import * as XLSX from 'xlsx'
import { useToast } from '../components/Toast'

export default function InventarioPage() {
  const { toast } = useToast()
  const { modoOscuro } = useTema()
  const [tab, setTab] = useState('productos')
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modalForm, setModalForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', precio: '', costo: '', stock: '', stock_minimo: '5', emoji: '📦', codigo_barras: '', categoria_id: '', foto_url: '' })
  
  // Historial
  const [movimientos, setMovimientos] = useState([])
  
  // Lotes
  const [lotes, setLotes] = useState([])
  const [alertasLotes, setAlertasLotes] = useState([])
  const [modalLote, setModalLote] = useState(false)
  const [formLote, setFormLote] = useState({ producto_id: '', numero_lote: '', cantidad: '', fecha_vencimiento: '', notas: '' })
  
  // Promociones
  const [promociones, setPromociones] = useState([])
  const [modalPromo, setModalPromo] = useState(false)
  const [formPromo, setFormPromo] = useState({ nombre: '', tipo: 'descuento_porcentaje', producto_id: '', descuento_porcentaje: '', cantidad_paga: '', cantidad_lleva: '', precio_combo: '', fecha_inicio: '', fecha_fin: '', activa: true })
  
  // Excel
  const fileRef = useRef()

  useEffect(() => { cargarDatos() }, [])
  useEffect(() => {
    if (tab === 'historial') cargarMovimientos()
    if (tab === 'lotes') cargarLotes()
    if (tab === 'promos') cargarPromociones()
  }, [tab])

  const cargarDatos = async () => {
    try {
      const [prods, cats] = await Promise.all([
        productosService.obtenerTodos(),
        categoriasService.obtenerTodas()
      ])
      setProductos(prods.data || [])
      setCategorias(cats.data || [])
    } catch (e) { console.log(e) }
    setCargando(false)
  }

  const cargarMovimientos = async () => {
    try {
      const r = await inventarioService.movimientos()
      setMovimientos(r.data || [])
    } catch (e) { console.log(e) }
  }

  const cargarLotes = async () => {
    try {
      const [l, a] = await Promise.all([inventarioService.lotes(), inventarioService.lotesAlertas()])
      setLotes(l.data || [])
      setAlertasLotes(a.data || [])
    } catch (e) { console.log(e) }
  }

  const cargarPromociones = async () => {
    try {
      const r = await inventarioService.promociones()
      setPromociones(r.data || [])
    } catch (e) { console.log(e) }
  }

  const abrirModal = (p = null) => {
    if (p) {
      setEditando(p)
      setForm({ nombre: p.nombre, precio: p.precio, costo: p.costo || '', stock: p.stock, stock_minimo: p.stock_minimo, emoji: p.emoji || '📦', codigo_barras: p.codigo_barras || '', categoria_id: p.categoria_id || '', foto_url: p.foto_url || '' })
    } else {
      setEditando(null)
      setForm({ nombre: '', precio: '', costo: '', stock: '', stock_minimo: '5', emoji: '📦', codigo_barras: '', categoria_id: '', foto_url: '' })
    }
    setModalForm(true)
  }

  const guardar = async () => {
    if (!form.nombre || !form.precio) return alert('Nombre y precio son requeridos')
    try {
      const data = { ...form, precio: parseFloat(form.precio), costo: parseFloat(form.costo) || 0, stock: parseInt(form.stock) || 0, stock_minimo: parseInt(form.stock_minimo) || 5, categoria_id: form.categoria_id || null }
      if (editando) await productosService.actualizar(editando.id, data)
      else await productosService.crear(data)
     setModalForm(false)
      cargarDatos()
      toast(editando ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 'exito')
    } catch (e) { toast(e.response?.data?.error || 'Error al guardar', 'error')}
  }

  const eliminar = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    await productosService.eliminar(p.id)
    cargarDatos()
  }

  const crearLote = async () => {
    if (!formLote.producto_id || !formLote.cantidad || !formLote.fecha_vencimiento) return alert('Producto, cantidad y fecha son requeridos')
    try {
      await inventarioService.crearLote({ ...formLote, cantidad: parseInt(formLote.cantidad) })
      setModalLote(false)
      setFormLote({ producto_id: '', numero_lote: '', cantidad: '', fecha_vencimiento: '', notas: '' })
      toast('Lote registrado correctamente', 'exito')
    } catch (e) { alert(e.response?.data?.error || 'Error') }
  }

  const eliminarLote = async (id) => {
    if (!confirm('¿Eliminar este lote?')) return
    await inventarioService.eliminarLote(id)
    toast('Lote registrado correctamente', 'exito')
  }

  const crearPromocion = async () => {
    if (!formPromo.nombre || !formPromo.producto_id) return alert('Nombre y producto son requeridos')
    try {
      await inventarioService.crearPromocion({ ...formPromo, descuento_porcentaje: parseFloat(formPromo.descuento_porcentaje) || null, cantidad_paga: parseInt(formPromo.cantidad_paga) || null, cantidad_lleva: parseInt(formPromo.cantidad_lleva) || null, precio_combo: parseFloat(formPromo.precio_combo) || null })
      setModalPromo(false)
      setFormPromo({ nombre: '', tipo: 'descuento_porcentaje', producto_id: '', descuento_porcentaje: '', cantidad_paga: '', cantidad_lleva: '', precio_combo: '', fecha_inicio: '', fecha_fin: '', activa: true })
      toast('Promoción creada correctamente', 'exito')
    } catch (e) { alert(e.response?.data?.error || 'Error') }
  }

  const eliminarPromocion = async (id) => {
    if (!confirm('¿Eliminar esta promoción?')) return
    await inventarioService.eliminarPromocion(id)
    toast('Promoción creada correctamente', 'exito')
  }

  const importarExcel = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        const wb = XLSX.read(evt.target.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws)
        if (data.length === 0) return alert('El archivo está vacío')
        try {
          const r = await inventarioService.importarExcel({ productos: data })
          alert(`✅ ${r.data.importados || data.length} productos importados correctamente`)
          cargarDatos()
      } catch (e) { toast(e.response?.data?.error || 'Error al guardar', 'error') }
    }

      reader.readAsBinaryString(file)
    } catch (e) { alert('Error al leer el archivo') }
    e.target.value = ''
  }

  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.codigo_barras && p.codigo_barras.includes(busqueda))
    const matchCategoria = !categoriaFiltro || p.categoria_id === parseInt(categoriaFiltro)
    return matchBusqueda && matchCategoria
  })

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200'}`

  const TIPO_MOV = { entrada: { color: 'text-green-500', label: '📥 Entrada' }, salida: { color: 'text-red-500', label: '📤 Salida' }, ajuste: { color: 'text-blue-500', label: '🔧 Ajuste' }, merma: { color: 'text-orange-500', label: '📉 Merma' } }
  const TIPO_PROMO = { descuento_porcentaje: '% Descuento', dos_por_uno: '2x1', pague_lleve: 'Pague/Lleve', combo: 'Combo' }

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>📦 Inventario</h1>
          <p className={`text-sm mt-1 ${textSub}`}>{productos.length} productos registrados</p>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileRef} accept=".xlsx,.xls" onChange={importarExcel} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className={`px-4 py-2 rounded-xl font-bold text-sm border transition-all ${modoOscuro ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            📊 Importar Excel
          </button>
          <button onClick={() => abrirModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">
            + Agregar
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', val: productos.length, color: 'text-blue-500', bg: modoOscuro ? 'bg-blue-900' : 'bg-blue-50' },
          { label: 'Stock Bajo', val: productos.filter(p => p.stock <= p.stock_minimo && p.stock > 0).length, color: 'text-yellow-500', bg: modoOscuro ? 'bg-yellow-900' : 'bg-yellow-50' },
          { label: 'Agotados', val: productos.filter(p => p.stock === 0).length, color: 'text-red-500', bg: modoOscuro ? 'bg-red-900' : 'bg-red-50' },
          { label: 'Lotes por vencer', val: alertasLotes.length, color: 'text-orange-500', bg: modoOscuro ? 'bg-orange-900' : 'bg-orange-50' },
        ].map(({ label, val, color, bg: bgCard }) => (
          <div key={label} className={`${bgCard} rounded-2xl p-4 text-center transition-all hover:scale-105`}>
            <div className={`text-2xl font-black ${color}`}>{val}</div>
            <div className={`text-xs mt-1 ${textSub}`}>{label}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { id: 'productos', label: '📦 Productos' },
          { id: 'historial', label: '📋 Historial' },
          { id: 'lotes', label: '🏷️ Lotes' },
          { id: 'promos', label: '🎁 Promociones' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-md' : modoOscuro ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-white text-gray-500 border border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB PRODUCTOS */}
      {tab === 'productos' && (
        <>
          <div className={`${card} p-4 mb-4`}>
            <div className="flex gap-3 flex-wrap">
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar producto o código..."
                className={`flex-1 min-w-48 px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200'}`} />
              <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="">Todas las categorías</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className={`${card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <tr>
                    <th className="px-4 py-3 text-left">Producto</th>
                    <th className="px-4 py-3 text-left">Categoría</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-right">Costo</th>
                    <th className="px-4 py-3 text-right">Margen</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {productosFiltrados.map(p => {
                    const cat = categorias.find(c => c.id === p.categoria_id)
                    const margen = p.costo > 0 ? (((p.precio - p.costo) / p.costo) * 100).toFixed(0) : null
                    return (
                      <tr key={p.id} className={`transition-colors ${modoOscuro ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ${modoOscuro ? 'bg-gray-600' : 'bg-gray-100'}`}>
                              {p.foto_url ? (
                                <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl">{p.emoji || '📦'}</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className={`text-sm font-semibold ${text} truncate max-w-32`}>{p.nombre}</div>
                              {p.codigo_barras && <div className={`text-xs ${textSub}`}>{p.codigo_barras}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {cat ? (
                            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: cat.color + '22', color: cat.color }}>
                              {cat.emoji} {cat.nombre}
                            </span>
                          ) : <span className={`text-xs ${textSub}`}>—</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-blue-500">Q{parseFloat(p.precio).toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right text-sm ${textSub}`}>Q{parseFloat(p.costo || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          {margen ? <span className={`text-xs font-bold ${parseInt(margen) > 30 ? 'text-green-500' : 'text-orange-500'}`}>{margen}%</span> : <span className={`text-xs ${textSub}`}>—</span>}
                        </td>
                        <td className={`px-4 py-3 text-center text-sm font-bold ${text}`}>{p.stock}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock === 0 ? 'bg-red-100 text-red-600' : p.stock <= p.stock_minimo ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                            {p.stock === 0 ? 'Agotado' : p.stock <= p.stock_minimo ? 'Stock Bajo' : 'OK'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => abrirModal(p)} className={`p-1.5 rounded-lg ${modoOscuro ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}>✏️</button>
                            <button onClick={() => eliminar(p)} className={`p-1.5 rounded-lg ${modoOscuro ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-red-50 text-red-600'}`}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {productosFiltrados.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">📦</div>
                  <p className={textSub}>No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB HISTORIAL */}
      {tab === 'historial' && (
        <div className={`${card} overflow-hidden`}>
          <div className={`p-4 border-b flex items-center justify-between ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`font-bold ${text}`}>Historial de Movimientos</h2>
            <button onClick={cargarMovimientos} className="text-sm text-blue-500 font-bold">🔄 Actualizar</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                <tr>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-center">Tipo</th>
                  <th className="px-4 py-3 text-center">Cantidad</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {movimientos.map(m => {
                  const tipo = TIPO_MOV[m.tipo] || { color: 'text-gray-500', label: m.tipo }
                  return (
                    <tr key={m.id} className={`transition-colors ${modoOscuro ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className={`px-4 py-3 text-sm font-semibold ${text}`}>{m.nombre_producto || m.producto_id}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold ${tipo.color}`}>{tipo.label}</span>
                      </td>
                      <td className={`px-4 py-3 text-center text-sm font-bold ${m.cantidad > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {m.cantidad > 0 ? '+' : ''}{m.cantidad}
                      </td>
                      <td className={`px-4 py-3 text-sm ${textSub}`}>{m.motivo || '—'}</td>
                      <td className={`px-4 py-3 text-xs ${textSub}`}>{m.nombre_usuario || '—'}</td>
                      <td className={`px-4 py-3 text-xs ${textSub}`}>{new Date(m.created_at).toLocaleString('es-GT')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {movimientos.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">📋</div>
                <p className={textSub}>Sin movimientos registrados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB LOTES */}
      {tab === 'lotes' && (
        <div className="space-y-4">
          {alertasLotes.length > 0 && (
            <div className={`rounded-2xl p-4 border ${modoOscuro ? 'bg-orange-900 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
              <h3 className={`font-bold mb-2 ${modoOscuro ? 'text-orange-300' : 'text-orange-800'}`}>⚠️ {alertasLotes.length} lote(s) próximos a vencer</h3>
              {alertasLotes.map(l => (
                <div key={l.id} className={`text-sm ${modoOscuro ? 'text-orange-400' : 'text-orange-700'}`}>
                  • {l.nombre_producto} — Lote {l.numero_lote} — Vence: {new Date(l.fecha_vencimiento).toLocaleDateString('es-GT')}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={() => setModalLote(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">+ Nuevo Lote</button>
          </div>

          <div className={`${card} overflow-hidden`}>
            <table className="w-full">
              <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                <tr>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Número Lote</th>
                  <th className="px-4 py-3 text-center">Cantidad</th>
                  <th className="px-4 py-3 text-left">Vencimiento</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {lotes.map(l => {
                  const diasRestantes = Math.ceil((new Date(l.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
                  return (
                    <tr key={l.id} className={`transition-colors ${modoOscuro ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className={`px-4 py-3 text-sm font-semibold ${text}`}>{l.nombre_producto}</td>
                      <td className={`px-4 py-3 text-sm ${textSub}`}>{l.numero_lote || '—'}</td>
                      <td className={`px-4 py-3 text-center text-sm font-bold ${text}`}>{l.cantidad}</td>
                      <td className={`px-4 py-3 text-sm ${textSub}`}>{new Date(l.fecha_vencimiento).toLocaleDateString('es-GT')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${diasRestantes < 0 ? 'bg-red-100 text-red-600' : diasRestantes <= 30 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                          {diasRestantes < 0 ? 'Vencido' : diasRestantes <= 30 ? `${diasRestantes}d` : 'OK'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => eliminarLote(l.id)} className={`text-xs font-bold ${modoOscuro ? 'text-red-400' : 'text-red-600'}`}>🗑️</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {lotes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">🏷️</div>
                <p className={textSub}>No hay lotes registrados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB PROMOCIONES */}
      {tab === 'promos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setModalPromo(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">+ Nueva Promoción</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promociones.map(p => (
              <div key={p.id} className={`${card} p-5`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className={`font-black ${text}`}>{p.nombre}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${p.activa ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {p.activa ? '✅ Activa' : '⏸️ Inactiva'}
                    </span>
                  </div>
                  <button onClick={() => eliminarPromocion(p.id)} className={`text-xs ${modoOscuro ? 'text-red-400' : 'text-red-600'}`}>🗑️</button>
                </div>
                <div className={`text-xs ${textSub} space-y-1`}>
                  <div>Tipo: <span className="font-bold">{TIPO_PROMO[p.tipo] || p.tipo}</span></div>
                  {p.descuento_porcentaje && <div>Descuento: <span className="font-bold text-green-500">{p.descuento_porcentaje}%</span></div>}
                  {p.cantidad_paga && <div>Paga {p.cantidad_paga} lleva {p.cantidad_lleva}</div>}
                  {p.precio_combo && <div>Precio combo: <span className="font-bold text-blue-500">Q{p.precio_combo}</span></div>}
                  {p.fecha_fin && <div>Hasta: {new Date(p.fecha_fin).toLocaleDateString('es-GT')}</div>}
                </div>
              </div>
            ))}
            {promociones.length === 0 && (
              <div className={`col-span-3 ${card} p-12 text-center`}>
                <div className="text-4xl mb-2">🎁</div>
                <p className={textSub}>No hay promociones activas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PRODUCTO */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-black mb-4 ${text}`}>{editando ? '✏️ Editar Producto' : '📦 Nuevo Producto'}</h2>

            <div className="mb-4">
              <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>URL de Foto</label>
              <div className="flex gap-2 items-center">
                <input value={form.foto_url} onChange={e => setForm({...form, foto_url: e.target.value})} placeholder="https://..." className={`${inputCls} flex-1`} />
                {form.foto_url && <img src={form.foto_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" onError={e => e.target.style.display='none'} />}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Nombre *</label>
                  <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Nombre del producto" className={inputCls} />
                </div>
                <div className="w-16">
                  <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Emoji</label>
                  <input value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} placeholder="📦" className={`${inputCls} text-center text-xl`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Precio *</label>
                  <input value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} placeholder="0.00" type="number" className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Costo</label>
                  <input value={form.costo} onChange={e => setForm({...form, costo: e.target.value})} placeholder="0.00" type="number" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Stock</label>
                  <input value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="0" type="number" className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Stock mín.</label>
                  <input value={form.stock_minimo} onChange={e => setForm({...form, stock_minimo: e.target.value})} placeholder="5" type="number" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Código de barras</label>
                <input value={form.codigo_barras} onChange={e => setForm({...form, codigo_barras: e.target.value})} placeholder="Código de barras" className={inputCls} />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Categoría</label>
                <select value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})} className={inputCls}>
                  <option value="">Sin categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setModalForm(false)} className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cancelar</button>
              <button onClick={guardar} className="flex-2 px-6 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOTE */}
      {modalLote && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-black mb-4 ${text}`}>🏷️ Nuevo Lote</h2>
            <div className="space-y-3">
              <select value={formLote.producto_id} onChange={e => setFormLote({...formLote, producto_id: e.target.value})} className={inputCls}>
                <option value="">Selecciona un producto *</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <input value={formLote.numero_lote} onChange={e => setFormLote({...formLote, numero_lote: e.target.value})} placeholder="Número de lote" className={inputCls} />
              <input type="number" value={formLote.cantidad} onChange={e => setFormLote({...formLote, cantidad: e.target.value})} placeholder="Cantidad *" className={inputCls} />
              <div>
                <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Fecha de vencimiento *</label>
                <input type="date" value={formLote.fecha_vencimiento} onChange={e => setFormLote({...formLote, fecha_vencimiento: e.target.value})} className={inputCls} />
              </div>
              <input value={formLote.notas} onChange={e => setFormLote({...formLote, notas: e.target.value})} placeholder="Notas (opcional)" className={inputCls} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setModalLote(false)} className={`flex-1 py-2 rounded-xl border text-sm ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cancelar</button>
              <button onClick={crearLote} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md">Guardar Lote</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROMOCION */}
      {modalPromo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up max-h-screen overflow-y-auto ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-black mb-4 ${text}`}>🎁 Nueva Promoción</h2>
            <div className="space-y-3">
              <input value={formPromo.nombre} onChange={e => setFormPromo({...formPromo, nombre: e.target.value})} placeholder="Nombre de la promoción *" className={inputCls} />
              <select value={formPromo.producto_id} onChange={e => setFormPromo({...formPromo, producto_id: e.target.value})} className={inputCls}>
                <option value="">Selecciona un producto *</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <select value={formPromo.tipo} onChange={e => setFormPromo({...formPromo, tipo: e.target.value})} className={inputCls}>
                <option value="descuento_porcentaje">% Descuento porcentaje</option>
                <option value="dos_por_uno">2x1</option>
                <option value="pague_lleve">Pague X lleva Y</option>
                <option value="combo">Precio combo</option>
              </select>

              {formPromo.tipo === 'descuento_porcentaje' && (
                <input type="number" value={formPromo.descuento_porcentaje} onChange={e => setFormPromo({...formPromo, descuento_porcentaje: e.target.value})} placeholder="Porcentaje de descuento (%)" className={inputCls} />
              )}
              {formPromo.tipo === 'pague_lleve' && (
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={formPromo.cantidad_paga} onChange={e => setFormPromo({...formPromo, cantidad_paga: e.target.value})} placeholder="Cantidad que paga" className={inputCls} />
                  <input type="number" value={formPromo.cantidad_lleva} onChange={e => setFormPromo({...formPromo, cantidad_lleva: e.target.value})} placeholder="Cantidad que lleva" className={inputCls} />
                </div>
              )}
              {formPromo.tipo === 'combo' && (
                <input type="number" value={formPromo.precio_combo} onChange={e => setFormPromo({...formPromo, precio_combo: e.target.value})} placeholder="Precio especial del combo" className={inputCls} />
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Fecha inicio</label>
                  <input type="date" value={formPromo.fecha_inicio} onChange={e => setFormPromo({...formPromo, fecha_inicio: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Fecha fin</label>
                  <input type="date" value={formPromo.fecha_fin} onChange={e => setFormPromo({...formPromo, fecha_fin: e.target.value})} className={inputCls} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setModalPromo(false)} className={`flex-1 py-2 rounded-xl border text-sm ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cancelar</button>
              <button onClick={crearPromocion} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md">Crear Promoción</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}