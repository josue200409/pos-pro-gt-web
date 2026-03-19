import { useState, useEffect, useRef } from 'react'
import { dashboardService, productosService } from '../services/api'
import { useTema } from '../context/TemaContext'

export default function IAPage() {
  const { modoOscuro } = useTema()
  const [mensajes, setMensajes] = useState([{
    id: 1, rol: 'bot',
    texto: '¡Hola! 👋 Soy tu asistente IA.\n\nPuedo ayudarte con análisis de tu negocio:\n• 💰 Ventas y tendencias\n• 📦 Estado del inventario\n• 📈 Márgenes de ganancia\n• 🏆 Productos más rentables\n• 💡 Consejos personalizados\n\n¿En qué te puedo ayudar hoy?'
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
      const [dash, prods] = await Promise.all([
        dashboardService.obtener(),
        productosService.obtenerTodos()
      ])
      setDatos({ dashboard: dash.data, productos: prods.data || [] })
    } catch (e) { console.log(e) }
  }

  const analizarPregunta = (pregunta) => {
    const q = pregunta.toLowerCase()
    const hoy = datos?.dashboard?.hoy || {}
    const topProductos = datos?.dashboard?.top_productos || []
    const stockBajo = datos?.dashboard?.stock_bajo || []
    const porMetodo = datos?.dashboard?.por_metodo_pago || []
    const productos = datos?.productos || []
    const totalVentas = parseFloat(hoy.total_ventas || 0)
    const totalTx = parseInt(hoy.total_transacciones || 0)
    const promedio = totalTx > 0 ? totalVentas / totalTx : 0
    const agotados = stockBajo.filter(p => p.stock === 0)
    const bajos = stockBajo.filter(p => p.stock > 0)

    if (q.includes('vend') || q.includes('hoy') || q.includes('cuanto') || q.includes('dinero')) {
      if (totalVentas === 0) return '📊 Hoy no hay ventas registradas todavía.\n\n💡 Consejos:\n• Ofrece descuentos en productos con stock alto\n• Promociona combos de productos\n• Asegúrate de tener la caja abierta'
      const efectivo = parseFloat(porMetodo.find(p => p.metodo_pago === 'efectivo')?.total || 0)
      const tarjeta = parseFloat(porMetodo.find(p => p.metodo_pago === 'tarjeta')?.total || 0)
      return `📊 Ventas de hoy:\n\n💰 Total: Q${totalVentas.toFixed(2)}\n🧾 Transacciones: ${totalTx}\n📈 Promedio: Q${promedio.toFixed(2)}\n\n💵 Efectivo: Q${efectivo.toFixed(2)}\n💳 Tarjeta: Q${tarjeta.toFixed(2)}\n\n${totalVentas > 1000 ? '🔥 ¡Excelente día!' : totalVentas > 500 ? '✅ Buen día de ventas.' : '💪 Día moderado. Considera hacer promociones.'}`
    }

    if (q.includes('stock') || q.includes('inventario') || q.includes('agotad')) {
      if (agotados.length === 0 && bajos.length === 0) return '📦 ¡Todo el inventario está bien!\n\n✅ No hay productos agotados ni con stock bajo.\n\n💡 Consejo: Revisa regularmente tus niveles de stock.'
      let resp = `⚠️ Estado del inventario:\n\n`
      if (agotados.length > 0) resp += `🚨 AGOTADOS (${agotados.length}):\n${agotados.slice(0, 5).map(p => `• ${p.nombre}`).join('\n')}\n\n`
      if (bajos.length > 0) resp += `⚡ STOCK BAJO (${bajos.length}):\n${bajos.slice(0, 5).map(p => `• ${p.nombre}: ${p.stock} uds`).join('\n')}\n\n`
      resp += `💡 Realiza un pedido a tus proveedores lo antes posible.`
      return resp
    }

    if (q.includes('top') || q.includes('mejor') || q.includes('vendido')) {
      if (topProductos.length === 0) return '🏆 Aún no hay productos vendidos hoy.\n\n💡 ¿Tienes suficiente stock de tus productos más populares?'
      return `🏆 Top productos de hoy:\n\n${topProductos.slice(0, 5).map((p, i) => `${i+1}. ${p.emoji || '📦'} ${p.nombre}\n   💰 Q${parseFloat(p.total_dinero).toFixed(2)} | ${p.total_vendido} uds`).join('\n\n')}\n\n💡 Asegúrate de tener suficiente stock de estos.`
    }

    if (q.includes('comprar') || q.includes('pedir') || q.includes('reabastecer')) {
      if (stockBajo.length === 0) return '✅ No necesitas comprar nada urgente.\n\n💡 Aprovecha para revisar precios con tus proveedores.'
      return `🛒 Lista de compras urgente:\n\n${stockBajo.slice(0, 8).map(p => `• ${p.nombre}: ${p.stock === 0 ? '❌ AGOTADO' : `⚠️ ${p.stock} uds`}`).join('\n')}\n\n💡 Contacta a tus proveedores hoy mismo.`
    }

    if (q.includes('ganancia') || q.includes('margen') || q.includes('rentable')) {
      const conCosto = productos.filter(p => p.costo > 0)
      if (conCosto.length === 0) return '📈 Para calcular márgenes agrega el precio de costo en tus productos del inventario.'
      const masRentables = [...conCosto].sort((a, b) => ((b.precio - b.costo) / b.costo) - ((a.precio - a.costo) / a.costo)).slice(0, 5)
      return `📈 Productos más rentables:\n\n${masRentables.map((p, i) => `${i+1}. ${p.nombre}\n   Margen: ${(((p.precio - p.costo) / p.costo) * 100).toFixed(0)}% | Q${parseFloat(p.precio).toFixed(2)}`).join('\n\n')}\n\n💡 Enfócate en vender más de estos.`
    }

    if (q.includes('analiz') || q.includes('resumen') || q.includes('negocio')) {
      const salud = totalVentas > 1000 ? '🟢 Excelente' : totalVentas > 500 ? '🟡 Bueno' : totalVentas > 0 ? '🟠 Moderado' : '🔴 Sin ventas'
      return `📋 Análisis del negocio:\n\n🏥 Salud: ${salud}\n\n💰 VENTAS HOY:\n• Total: Q${totalVentas.toFixed(2)}\n• Transacciones: ${totalTx}\n• Promedio: Q${promedio.toFixed(2)}\n\n📦 INVENTARIO:\n• Total productos: ${productos.length}\n• Agotados: ${agotados.length}\n• Stock bajo: ${bajos.length}\n\n💡 ${totalVentas === 0 ? 'Empieza con una promoción especial.' : totalVentas < 500 ? 'Considera descuentos en productos con stock alto.' : '¡Sigue así, tu negocio va bien!'}`
    }

    if (q.includes('consejo') || q.includes('mejorar') || q.includes('aumentar')) {
      return `💡 Consejos para tu negocio:\n\n1. 📦 Mantén el inventario actualizado\n2. 💰 Registra todos los gastos del día\n3. 👥 Fideliza clientes con el sistema de puntos\n4. 🏷️ Crea promociones en productos con stock alto\n5. 📊 Revisa el dashboard diariamente\n6. 🛒 Haz pedidos antes de que se agoten\n7. 📄 Genera reportes semanales\n8. 💳 Ofrece múltiples métodos de pago\n\n¿Quieres que profundice en alguno?`
    }

    if (q.includes('hola') || q.includes('buenos') || q.includes('buenas')) {
      return `¡Hola! 😊 ¿En qué puedo ayudarte?\n\n• 💰 Ventas del día\n• 📦 Inventario\n• 🏆 Más vendidos\n• 📈 Márgenes\n• 💡 Consejos`
    }

    if (q.includes('gracias')) return '¡De nada! 😊 ¿Hay algo más en lo que pueda ayudarte?'

    return `No entendí tu pregunta. Puedo ayudarte con:\n\n• 💰 "¿Cuánto vendí hoy?"\n• 📦 "¿Qué tiene stock bajo?"\n• 🏆 "¿Cuáles son los más vendidos?"\n• 📈 "¿Cuáles son mis más rentables?"\n• 🛒 "¿Qué necesito comprar?"\n• 📋 "Analiza mi negocio"\n• 💡 "Dame consejos"`
  }

  const enviar = async () => {
    if (!input.trim() || cargando) return
    const pregunta = input.trim()
    setInput('')
    setMensajes(prev => [...prev, { id: Date.now(), rol: 'user', texto: pregunta }])
    setCargando(true)
    await new Promise(r => setTimeout(r, 600))
    const respuesta = analizarPregunta(pregunta)
    setMensajes(prev => [...prev, { id: Date.now() + 1, rol: 'bot', texto: respuesta }])
    setCargando(false)
    inputRef.current?.focus()
  }

  const SUGERENCIAS = ['¿Cuánto vendí hoy?', '¿Qué tiene stock bajo?', '¿Cuáles son los más vendidos?', '¿Qué necesito comprar?', 'Dame consejos', 'Analiza mi negocio']

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`flex flex-col h-full p-6 ${bg}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">🧠</div>
        <div>
          <h1 className={`text-2xl font-black ${text}`}>Asistente IA</h1>
          <p className={`text-sm ${textSub}`}>Análisis inteligente de tu negocio</p>
        </div>
        <button onClick={cargarDatos} className="ml-auto text-xs text-blue-500 font-bold bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100">🔄 Actualizar</button>
      </div>

      <div className={`flex-1 ${card} flex flex-col overflow-hidden`}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {mensajes.map(m => (
            <div key={m.id} className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.rol === 'bot' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">🧠</div>
              )}
              <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${m.rol === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : modoOscuro ? 'bg-gray-700 text-gray-200 rounded-bl-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                {m.texto}
              </div>
            </div>
          ))}
          {cargando && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm mr-2">🧠</div>
              <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${modoOscuro ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className={`text-xs ml-2 ${textSub}`}>Analizando...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`px-4 py-2 border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SUGERENCIAS.map(s => (
              <button key={s} onClick={() => { setInput(s); inputRef.current?.focus() }}
                className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-all font-medium flex-shrink-0 ${modoOscuro ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className={`p-4 border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-3">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
              placeholder="Pregunta sobre tu negocio..."
              className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`}
              disabled={cargando} />
            <button onClick={enviar} disabled={cargando || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 shadow-md">
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}