import { useState, useEffect, useRef } from 'react'
import { productosService } from '../services/api'
import JsBarcode from 'jsbarcode'
import { useTema } from '../context/TemaContext'

export default function BarcodesPage() {
  const { modoOscuro } = useTema()
  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [seleccionados, setSeleccionados] = useState([])
  const [cargando, setCargando] = useState(true)
  const printRef = useRef()

  useEffect(() => { cargarProductos() }, [])

  const cargarProductos = async () => {
    try {
      const r = await productosService.obtenerTodos()
      setProductos(r.data || [])
    } catch (e) { console.log(e) }
    setCargando(false)
  }

  const toggleSeleccionado = (producto) => {
    setSeleccionados(prev =>
      prev.find(p => p.id === producto.id)
        ? prev.filter(p => p.id !== producto.id)
        : [...prev, producto]
    )
  }

  const seleccionarTodos = () => {
    setSeleccionados(productosFiltrados)
  }

  const deseleccionarTodos = () => setSeleccionados([])

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo_barras && p.codigo_barras.includes(busqueda))
  )

  const imprimirCodigos = () => {
    const items = seleccionados.length > 0 ? seleccionados : productosFiltrados
    if (items.length === 0) return alert('No hay productos para imprimir')

    const ventana = window.open('', '_blank')
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Códigos de Barras — POS Pro GT</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: white; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 10px; }
          .item { border: 1px solid #ddd; border-radius: 6px; padding: 8px; text-align: center; break-inside: avoid; }
          .nombre { font-size: 10px; font-weight: bold; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .precio { font-size: 12px; font-weight: 900; color: #1a56db; margin-bottom: 4px; }
          .codigo { font-size: 8px; color: #666; margin-top: 4px; }
          svg { max-width: 100%; height: auto; }
          @media print { body { margin: 0; } .no-print { display: none; } }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      </head>
      <body>
        <div class="no-print" style="padding:10px; background:#1a56db; color:white; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:bold;">🏪 POS Pro GT — ${items.length} códigos de barras</span>
          <button onclick="window.print()" style="background:white; color:#1a56db; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ Imprimir</button>
        </div>
        <div class="grid">
          ${items.map(p => `
            <div class="item">
              <div class="nombre">${p.nombre}</div>
              <div class="precio">Q${parseFloat(p.precio).toFixed(2)}</div>
              <svg id="barcode-${p.id}"></svg>
              <div class="codigo">${p.codigo_barras || ''}</div>
            </div>
          `).join('')}
        </div>
        <script>
          window.onload = function() {
            ${items.map(p => p.codigo_barras ? `
              try {
                JsBarcode("#barcode-${p.id}", "${p.codigo_barras}", {
                  format: "CODE128",
                  width: 1.5,
                  height: 40,
                  displayValue: false,
                  margin: 2
                });
              } catch(e) {}
            ` : '').join('')}
          }
        </script>
      </body>
      </html>
    `)
    ventana.document.close()
  }

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-black ${text}`}>📷 Códigos de Barras</h1>
        <div className="flex gap-2">
          <button onClick={seleccionarTodos} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-200">
            Seleccionar todos
          </button>
          {seleccionados.length > 0 && (
            <button onClick={deseleccionarTodos} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-200">
              Deseleccionar ({seleccionados.length})
            </button>
          )}
          <button onClick={imprimirCodigos} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700">
            🖨️ {seleccionados.length > 0 ? `Imprimir ${seleccionados.length} seleccionados` : 'Imprimir todos'}
          </button>
        </div>
      </div>

      <div className={`${card} p-4 mb-4`}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar producto o código..."
          className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`}
        />
        <p className={`text-xs mt-2 ${textSub}`}>{productosFiltrados.length} productos — {seleccionados.length} seleccionados</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {productosFiltrados.map(p => {
          const estaSeleccionado = seleccionados.find(s => s.id === p.id)
          return (
            <div
              key={p.id}
              onClick={() => toggleSeleccionado(p)}
              className={`rounded-xl border-2 p-3 cursor-pointer transition-all hover:shadow-md ${estaSeleccionado ? 'border-blue-500 bg-blue-900' : modoOscuro ? 'border-gray-700 bg-gray-800 hover:border-gray-500' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{p.emoji || '📦'}</span>
                {estaSeleccionado && <span className="text-blue-500 text-lg">✓</span>}
              </div>
              <p className={`text-xs font-bold line-clamp-2 mb-1 ${text}`}>{p.nombre}</p>
              <p className="text-sm font-black text-blue-600">Q{parseFloat(p.precio).toFixed(2)}</p>
              {p.codigo_barras ? (
                <p className="text-xs text-gray-400 mt-1 truncate">{p.codigo_barras}</p>
              ) : (
                <p className="text-xs text-red-400 mt-1">Sin código</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}