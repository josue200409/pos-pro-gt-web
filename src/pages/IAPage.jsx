import { useState, useEffect, useRef } from 'react'
import { dashboardService, ventasService, productosService } from '../services/api'
import { useTema } from '../context/TemaContext'

export default function IAPage() {
  const { modoOscuro } = useTema()
  const [mensajes, setMensajes] = useState([{
    id: 1, rol: 'bot',
    texto: '¡Hola! 👋 Soy tu asistente IA potenciado por Claude.\n\nPuedo ayudarte con análisis inteligente de tu negocio:\n• 💰 Análisis de ventas y tendencias\n• 📦 Estado del inventario\n• 📈 Consejos para mejorar ganancias\n• 🏆 Productos más rentables\n• 💡 Sugerencias personalizadas\n\n¿En qué te puedo ayudar hoy?'
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

  const enviar = async () => {
    if (!input.trim() || cargando) return
    const pregunta = input.trim()
    setInput('')
    setMensajes(prev => [...prev, { id: Date.now(), rol: 'user', texto: pregunta }])
    setCargando(true)

    try {
      // Preparar contexto del negocio
      const hoy = datos?.dashboard?.hoy || {}
      const topProductos = datos?.dashboard?.top_productos || []
      const stockBajo = datos?.dashboard?.stock_bajo || []
      const porMetodo = datos?.dashboard?.por_metodo_pago || []
      const productos = datos?.productos || []

      const contexto = `
Eres un asistente de negocios experto para una tienda guatemalteca que usa POS Pro GT.
Responde siempre en español, de forma amigable, concisa y con emojis.
Da consejos prácticos y específicos basados en los datos reales del negocio.

DATOS ACTUALES DEL NEGOCIO:
- Ventas hoy: Q${parseFloat(hoy.total_ventas || 0).toFixed(2)}
- Transacciones hoy: ${hoy.total_transacciones || 0}
- IVA generado: Q${parseFloat(hoy.total_iva || 0).toFixed(2)}
- Promedio por venta: Q${hoy.total_transacciones > 0 ? (parseFloat(hoy.total_ventas) / parseInt(hoy.total_transacciones)).toFixed(2) : '0.00'}

VENTAS POR MÉTODO:
${porMetodo.map(m => `- ${m.metodo_pago}: Q${parseFloat(m.total).toFixed(2)} (${m.cantidad} ventas)`).join('\n') || '- Sin datos'}

TOP PRODUCTOS HOY:
${topProductos.slice(0, 5).map((p, i) => `${i+1}. ${p.nombre}: ${p.total_vendido} uds = Q${parseFloat(p.total_dinero).toFixed(2)}`).join('\n') || '- Sin ventas hoy'}

PRODUCTOS CON STOCK BAJO:
${stockBajo.slice(0, 8).map(p => `- ${p.nombre}: ${p.stock === 0 ? 'AGOTADO' : p.stock + ' uds'}`).join('\n') || '- Todo el inventario está bien'}

TOTAL DE PRODUCTOS: ${productos.length}
PRODUCTOS AGOTADOS: ${productos.filter(p => p.stock === 0).length}
PRODUCTOS STOCK BAJO: ${productos.filter(p => p.stock > 0 && p.stock <= p.stock_minimo).length}
`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: contexto,
          messages: [
            ...mensajes.filter(m => m.rol !== 'bot' || m.id !== 1).map(m => ({
              role: m.rol === 'user' ? 'user' : 'assistant',
              content: m.texto
            })),
            { role: 'user', content: pregunta }
          ]
        })
      })

      const data = await response.json()
      const respuesta = data.content?.[0]?.text || 'No pude procesar tu pregunta. Intenta de nuevo.'

      setMensajes(prev => [...prev, { id: Date.now() + 1, rol: 'bot', texto: respuesta }])
    } catch (e) {
      console.log(e)
      setMensajes(prev => [...prev, { id: Date.now() + 1, rol: 'bot', texto: '❌ Error al conectar con la IA. Verifica tu conexión e intenta de nuevo.' }])
    }
    setCargando(false)
    inputRef.current?.focus()
  }

  const SUGERENCIAS = [
    '¿Cuánto vendí hoy?',
    '¿Qué productos tienen stock bajo?',
    '¿Cuáles son los más vendidos?',
    '¿Qué necesito comprar?',
    'Dame consejos para aumentar ventas',
    'Analiza mi negocio',
  ]

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
          <p className={`text-sm ${textSub}`}>Potenciado por Claude — Análisis inteligente de tu negocio</p>
        </div>
        <button onClick={cargarDatos} className="ml-auto text-xs text-blue-500 font-bold bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100">
          🔄 Actualizar datos
        </button>
      </div>

      <div className={`flex-1 ${card} flex flex-col overflow-hidden`}>
        {/* CHAT */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {mensajes.map(m => (
            <div key={m.id} className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.rol === 'bot' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">🧠</div>
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm mr-2">🧠</div>
              <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${modoOscuro ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className={`text-xs ml-2 ${textSub}`}>Claude está analizando...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SUGERENCIAS */}
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

        {/* INPUT */}
        <div className={`p-4 border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
              placeholder="Pregunta sobre tu negocio..."
              className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`}
              disabled={cargando}
            />
            <button onClick={enviar} disabled={cargando || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-md">
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}