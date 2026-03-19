import { useState, useEffect, useRef } from 'react'
import { dashboardService } from '../services/api'
import { useTema } from '../context/TemaContext'

export default function IAPage() {
    const { modoOscuro } = useTema()
  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const [mensajes, setMensajes] = useState([{
    id: 1, rol: 'bot',
    texto: '¡Hola! 👋 Soy tu asistente IA del negocio.\n\nPuedo ayudarte con:\n• 💰 Ventas del día\n• 📦 Estado del inventario\n• 📈 Márgenes de ganancia\n• 🏆 Productos más vendidos\n• 🛒 Qué comprar pronto\n\n¿En qué te puedo ayudar?'
  }])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [datos, setDatos] = useState(null)
  const scrollRef = useRef()
  const inputRef = useRef()

  useEffect(() => { cargarDatos() }, [])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes])

  const cargarDatos = async () => {
    try {
      const r = await dashboardService.obtener()
      setDatos(r.data)
    } catch (e) { console.log(e) }
  }

  const generarRespuesta = (pregunta) => {
    if (!datos) return 'Estoy cargando los datos del negocio... Intenta en un momento.'
    const q = pregunta.toLowerCase()
    const hoy = datos.hoy || {}
    const topProductos = datos.top_productos || []
    const stockBajo = datos.stock_bajo || []
    const totalVentas = parseFloat(hoy.total_ventas || 0)
    const totalTx = parseInt(hoy.total_transacciones || 0)

    if (q.includes('vend') || q.includes('hoy') || q.includes('día') || q.includes('cuanto')) {
      if (totalVentas === 0) return '📊 Hoy no hay ventas registradas todavía.\n\n💡 ¡Es un buen momento para revisar el inventario!'
      return `📊 Ventas de hoy:\n\n💰 Total: Q${totalVentas.toFixed(2)}\n🧾 Transacciones: ${totalTx}\n📈 Promedio por venta: Q${totalTx > 0 ? (totalVentas/totalTx).toFixed(2) : '0.00'}\n\n${totalVentas > 1000 ? '🔥 ¡Excelente día de ventas!' : totalVentas > 500 ? '✅ Buen día de ventas' : '💡 Día con ventas moderadas'}`
    }
    if (q.includes('producto') || q.includes('top') || q.includes('estrella') || q.includes('vendido')) {
      if (topProductos.length === 0) return '🏆 Aún no hay productos vendidos hoy.'
      return `🏆 Productos más vendidos hoy:\n\n${topProductos.slice(0,5).map((p,i) => `${i+1}. ${p.emoji || '📦'} ${p.nombre}\n   ${p.total_vendido} uds · Q${parseFloat(p.total_dinero).toFixed(2)}`).join('\n\n')}`
    }
    if (q.includes('stock') || q.includes('inventario') || q.includes('agotad') || q.includes('bajo')) {
      if (stockBajo.length === 0) return '📦 ¡Excelente! Todo el inventario está en buen estado.'
      const agotados = stockBajo.filter(p => p.stock === 0)
      return `⚠️ Productos con stock bajo:\n\n${stockBajo.slice(0,8).map(p => `${p.stock === 0 ? '❌' : '⚠️'} ${p.nombre}: ${p.stock === 0 ? 'AGOTADO' : `${p.stock} uds`}`).join('\n')}\n\n${agotados.length > 0 ? `🚨 ${agotados.length} producto(s) agotado(s)` : ''}`.trim()
    }
    if (q.includes('ganancia') || q.includes('margen') || q.includes('utilidad')) {
      return `📈 Para calcular márgenes necesito los costos de cada producto.\n\nTip: Asegúrate de ingresar el precio de costo en cada producto del inventario para ver la ganancia real.`
    }
    if (q.includes('comprar') || q.includes('reabastecer') || q.includes('pedir')) {
      if (stockBajo.length === 0) return '✅ No necesitas comprar nada urgente, el inventario está bien.'
      return `🛒 Productos que necesitas reabastecer:\n\n${stockBajo.slice(0,5).map(p => `• ${p.nombre} (stock: ${p.stock})`).join('\n')}\n\n💡 Contacta a tus proveedores pronto.`
    }
    if (q.includes('resumen') || q.includes('reporte') || q.includes('análisis')) {
      return `📋 Resumen del negocio hoy:\n\n💰 Ventas: Q${totalVentas.toFixed(2)}\n🧾 Transacciones: ${totalTx}\n⚠️ Productos con stock bajo: ${stockBajo.length}\n🏆 Productos más vendidos: ${topProductos.length}\n\n${totalVentas > 0 ? '✅ El negocio está operando con normalidad.' : '💡 Todavía no hay ventas hoy.'}`
    }
    if (q.includes('hola') || q.includes('buenas') || q.includes('hi')) {
      return '¡Hola! 😊 ¿En qué puedo ayudarte hoy?\n\nPuedo darte información sobre:\n• Ventas del día\n• Inventario y stock\n• Productos más vendidos\n• Qué necesitas comprar'
    }
    if (q.includes('gracias') || q.includes('thanks')) {
      return '¡De nada! 😊 Estoy aquí para ayudarte a tomar mejores decisiones para tu negocio. ¿Hay algo más en lo que pueda ayudarte?'
    }
    return `No entendí tu pregunta sobre "${pregunta}".\n\nPuedes preguntarme sobre:\n• 💰 Ventas del día\n• 📦 Stock e inventario\n• 🏆 Productos más vendidos\n• 🛒 Qué necesitas comprar\n• 📊 Resumen del negocio`
  }

  const enviar = async () => {
    if (!input.trim() || cargando) return
    const pregunta = input.trim()
    setInput('')
    setMensajes(prev => [...prev, { id: Date.now(), rol: 'user', texto: pregunta }])
    setCargando(true)
    await new Promise(r => setTimeout(r, 800))
    const respuesta = generarRespuesta(pregunta)
    setMensajes(prev => [...prev, { id: Date.now() + 1, rol: 'bot', texto: respuesta }])
    setCargando(false)
    inputRef.current?.focus()
  }

  const SUGERENCIAS = [
    '¿Cuánto vendí hoy?',
    '¿Qué productos tienen stock bajo?',
    '¿Cuáles son los más vendidos?',
    '¿Qué necesito comprar?',
    'Dame un resumen del negocio',
  ]

  return (
    <div className={`flex flex-col h-full p-6 ${bg}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl">🧠</div>
        <div>
          <h1 className={`text-2xl font-black ${text}`}>Asistente IA</h1>
          <p className={`text-sm ${textSub}`}>Analiza tu negocio con inteligencia artificial</p>
        </div>
        <button onClick={cargarDatos} className="ml-auto text-xs text-blue-600 font-bold bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100">
          🔄 Actualizar datos
        </button>
      </div>

      {/* CHAT */}
      <div className={`flex-1 ${card} flex flex-col overflow-hidden`}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {mensajes.map(m => (
            <div key={m.id} className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.rol === 'bot' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">🧠</div>
              )}
              <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                m.rol === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : modoOscuro ? 'bg-gray-700 text-gray-200 rounded-bl-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                {m.texto}
              </div>
            </div>
          ))}
          {cargando && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-sm mr-2">🧠</div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SUGERENCIAS */}
        <div className={`px-4 py-2 border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SUGERENCIAS.map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus() }}
                className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-all font-medium flex-shrink-0 ${modoOscuro ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* INPUT */}
        <div className={`p-4 border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
              placeholder="Escribe tu pregunta..."
              className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`}
              disabled={cargando}
            />
            <button
              onClick={enviar}
              disabled={cargando || !input.trim()}
              className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}