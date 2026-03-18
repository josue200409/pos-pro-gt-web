import { useState, useEffect, useRef } from 'react'
import { productosService, categoriasService } from '../services/api'
import { useTema } from '../context/TemaContext'

export default function InventarioPage() {
  const { modoOscuro } = useTema()
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modalForm, setModalForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [tab, setTab] = useState('productos')
  const [form, setForm] = useState({ nombre: '', precio: '', costo: '', stock: '', stock_minimo: '5', emoji: '📦', codigo_barras: '', categoria_id: '', foto_url: '' })
  const fileRef = useRef()

  useEffect(() => { cargarDatos() }, [])

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
    } catch (e) { alert(e.response?.data?.error || 'Error al guardar') }
  }

  const eliminar = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    await productosService.eliminar(p.id)
    cargarDatos()
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

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>📦 Inventario</h1>
          <p className={`text-sm mt-1 ${textSub}`}>{productos.length} productos registrados</p>
        </div>
        <button onClick={() => abrirModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
          + Agregar Producto
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', val: productos.length, color: 'text-blue-500', bg: modoOscuro ? 'bg-blue-900' : 'bg-blue-50' },
          { label: 'Stock Bajo', val: productos.filter(p => p.stock <= p.stock_minimo && p.stock > 0).length, color: 'text-yellow-500', bg: modoOscuro ? 'bg-yellow-900' : 'bg-yellow-50' },
          { label: 'Agotados', val: productos.filter(p => p.stock === 0).length, color: 'text-red-500', bg: modoOscuro ? 'bg-red-900' : 'bg-red-50' },
          { label: 'Con Foto', val: productos.filter(p => p.foto_url).length, color: 'text-green-500', bg: modoOscuro ? 'bg-green-900' : 'bg-green-50' },
        ].map(({ label, val, color, bg: bgCard }) => (
          <div key={label} className={`${bgCard} rounded-2xl p-4 text-center transition-all hover:scale-105`}>
            <div className={`text-2xl font-black ${color}`}>{val}</div>
            <div className={`text-xs mt-1 ${textSub}`}>{label}</div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className={`${card} p-4 mb-4`}>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar producto o código..."
            className={`flex-1 min-w-48 px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200'}`}
          />
          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
              <tr>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-right">Costo</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {productosFiltrados.map(p => {
                const cat = categorias.find(c => c.id === p.categoria_id)
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
                        <div>
                          <div className={`text-sm font-semibold ${text}`}>{p.nombre}</div>
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
                    <td className={`px-4 py-3 text-center text-sm font-bold ${text}`}>{p.stock}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock === 0 ? 'bg-red-100 text-red-600' : p.stock <= p.stock_minimo ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                        {p.stock === 0 ? 'Agotado' : p.stock <= p.stock_minimo ? 'Stock Bajo' : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => abrirModal(p)} className={`p-1.5 rounded-lg transition-all ${modoOscuro ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}>✏️</button>
                        <button onClick={() => eliminar(p)} className={`p-1.5 rounded-lg transition-all ${modoOscuro ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-red-50 text-red-600'}`}>🗑️</button>
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

      {/* MODAL */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-black mb-4 ${text}`}>{editando ? '✏️ Editar Producto' : '📦 Nuevo Producto'}</h2>

            {/* FOTO URL */}
            <div className="mb-4">
              <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>URL de Foto</label>
              <div className="flex gap-2">
                <input value={form.foto_url} onChange={e => setForm({...form, foto_url: e.target.value})} placeholder="https://..." className={inputCls} />
                {form.foto_url && <img src={form.foto_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" onError={e => e.target.style.display='none'} />}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Nombre *" className={`${inputCls} flex-1`} />
                <input value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} placeholder="📦" className={`${inputCls} w-14 text-center text-xl`} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} placeholder="Precio *" type="number" className={inputCls} />
                <input value={form.costo} onChange={e => setForm({...form, costo: e.target.value})} placeholder="Costo" type="number" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="Stock" type="number" className={inputCls} />
                <input value={form.stock_minimo} onChange={e => setForm({...form, stock_minimo: e.target.value})} placeholder="Stock mín." type="number" className={inputCls} />
              </div>
              <input value={form.codigo_barras} onChange={e => setForm({...form, codigo_barras: e.target.value})} placeholder="Código de barras" className={inputCls} />
              <select value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})} className={inputCls}>
                <option value="">Sin categoría</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
              </select>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setModalForm(false)} className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cancelar</button>
              <button onClick={guardar} className="flex-2 px-6 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}