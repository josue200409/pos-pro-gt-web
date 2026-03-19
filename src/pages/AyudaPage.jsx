import { useState } from 'react'
import { useTema } from '../context/TemaContext'

const SECCIONES = [
  {
    id: 'inicio',
    titulo: '🚀 Inicio Rápido',
    contenido: [
      { pregunta: '¿Cómo iniciar sesión?', respuesta: 'Ingresa tu email y contraseña en la pantalla de login. Si tienes 5 intentos fallidos tu cuenta se bloqueará automáticamente.' },
      { pregunta: '¿Cómo cambiar mi contraseña?', respuesta: 'Ve a Mi Perfil en el menú lateral y selecciona la pestaña "Contraseña". Ingresa tu contraseña actual y la nueva.' },
      { pregunta: '¿Cómo activar el modo oscuro?', respuesta: 'Presiona el botón 🌙 en la parte inferior del menú lateral para activar el modo oscuro.' },
    ]
  },
  {
    id: 'pos',
    titulo: '🛒 POS / Cobrar',
    contenido: [
      { pregunta: '¿Cómo realizar una venta?', respuesta: '1. Busca el producto por nombre o código de barras.\n2. Haz clic para agregarlo al carrito.\n3. Selecciona el método de pago.\n4. Presiona "Cobrar".' },
      { pregunta: '¿Cómo aplicar un descuento?', respuesta: 'En la sección del carrito hay un campo "Descuento %" donde puedes ingresar el porcentaje a descontar.' },
      { pregunta: '¿Cómo hacer pago mixto?', respuesta: 'Selecciona múltiples métodos de pago presionando cada botón (Efectivo, Tarjeta, Transferencia) e ingresa el monto de cada uno.' },
      { pregunta: '¿Cómo asociar un cliente?', respuesta: 'En el carrito hay un selector de cliente donde puedes buscar y seleccionar el cliente para la venta.' },
    ]
  },
  {
    id: 'inventario',
    titulo: '📦 Inventario',
    contenido: [
      { pregunta: '¿Cómo agregar un producto?', respuesta: 'Presiona "+ Agregar" en la página de inventario. Completa nombre, precio, costo, stock y emoji. Puedes agregar una URL de foto.' },
      { pregunta: '¿Cómo importar productos desde Excel?', respuesta: 'Presiona "📊 Importar Excel" y selecciona tu archivo .xlsx. Las columnas deben llamarse: nombre, precio, costo, stock, codigo_barras.' },
      { pregunta: '¿Qué son los lotes?', respuesta: 'Los lotes permiten rastrear fechas de vencimiento de productos. El sistema te alertará cuando un lote esté próximo a vencer.' },
      { pregunta: '¿Cómo crear una promoción?', respuesta: 'Ve a la pestaña "Promociones" en Inventario y presiona "+ Nueva Promoción". Puedes crear descuentos, 2x1, pague/lleve y combos.' },
    ]
  },
  {
    id: 'caja',
    titulo: '💰 Caja',
    contenido: [
      { pregunta: '¿Cómo abrir la caja?', respuesta: 'Presiona "🔓 Abrir Caja" e ingresa el efectivo inicial disponible. Debes abrir la caja cada día antes de empezar a vender.' },
      { pregunta: '¿Cómo cerrar la caja?', respuesta: 'Presiona "🔒 Cerrar", cuenta el efectivo físico e ingrésalo. El sistema calculará si hay sobrante o faltante.' },
      { pregunta: '¿Cómo registrar un gasto?', respuesta: 'Presiona "+ Gasto" cuando la caja esté abierta. Ingresa la descripción, monto y categoría del gasto.' },
      { pregunta: 'La caja muestra Q0', respuesta: 'Debes abrir la caja del día primero. Cada día se inicia una nueva apertura.' },
    ]
  },
  {
    id: 'reportes',
    titulo: '📄 Reportes',
    contenido: [
      { pregunta: '¿Cómo imprimir el reporte del día?', respuesta: 'En la página de Reportes presiona "🖨️ Imprimir Reporte Hoy". Se abrirá una ventana con el reporte listo para imprimir.' },
      { pregunta: '¿Cómo generar un reporte por período?', respuesta: 'Selecciona las fechas de inicio y fin en la sección "Reporte por Período" y presiona "📊 Generar".' },
      { pregunta: '¿Qué es el efectivo neto?', respuesta: 'Es el efectivo real en caja: total de ventas en efectivo menos el vuelto entregado a los clientes.' },
    ]
  },
  {
    id: 'usuarios',
    titulo: '👥 Administración',
    contenido: [
      { pregunta: '¿Cómo crear un usuario?', respuesta: 'Ve a Administración → Usuarios y presiona "+ Nuevo". Completa nombre, email, contraseña y rol (Admin o Empleado).' },
      { pregunta: '¿Cuál es la diferencia entre Admin y Empleado?', respuesta: 'Admin tiene acceso total al sistema. Empleado solo puede usar POS, ver sus ventas y el dashboard.' },
      { pregunta: '¿Cómo desbloquear una cuenta?', respuesta: 'Ve a Seguridad → Alertas y presiona "Desbloquear" en la cuenta bloqueada.' },
    ]
  },
  {
    id: 'seguridad',
    titulo: '🔒 Seguridad',
    contenido: [
      { pregunta: '¿Cómo hacer un backup?', respuesta: 'Ve a Seguridad → Backup y presiona "📥 Descargar Backup" para guardar una copia local, o "📧 Enviar por Email" para recibirlo en tu correo.' },
      { pregunta: '¿El backup es automático?', respuesta: 'Sí, el sistema genera un backup automático todos los días a las 2:00 AM.' },
      { pregunta: '¿Cómo ver la actividad del sistema?', respuesta: 'Ve a Seguridad → Actividad para ver todos los accesos, ventas y acciones realizadas en el sistema.' },
    ]
  },
  {
    id: 'mermas',
    titulo: '📉 Mermas',
    contenido: [
      { pregunta: '¿Qué es una merma?', respuesta: 'Una merma es cualquier pérdida de inventario por vencimiento, daño, robo o pérdida. Al registrarla el stock se descuenta automáticamente.' },
      { pregunta: '¿Cómo registrar una merma?', respuesta: 'Ve a Mermas → Registrar, selecciona el producto, el tipo de merma, la cantidad y opcionalmente el motivo.' },
      { pregunta: '¿Se puede deshacer una merma?', respuesta: 'Sí, los administradores pueden eliminar una merma desde el Historial y el stock se restaurará automáticamente.' },
    ]
  },
]

export default function AyudaPage() {
  const { modoOscuro } = useTema()
  const [seccionAbierta, setSeccionAbierta] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'

  const seccionesFiltradas = busqueda
    ? SECCIONES.map(s => ({
        ...s,
        contenido: s.contenido.filter(c =>
          c.pregunta.toLowerCase().includes(busqueda.toLowerCase()) ||
          c.respuesta.toLowerCase().includes(busqueda.toLowerCase())
        )
      })).filter(s => s.contenido.length > 0)
    : SECCIONES

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-black ${text}`}>📖 Ayuda y Documentación</h1>
        <p className={`text-sm mt-1 ${textSub}`}>Manual de uso del sistema POS Pro GT</p>
      </div>

      {/* BUSQUEDA */}
      <div className={`${card} p-4 mb-6`}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar en la documentación..."
          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200'}`}
        />
      </div>

      {/* SECCIONES */}
      <div className="space-y-3 max-w-3xl">
        {seccionesFiltradas.map(seccion => (
          <div key={seccion.id}>
            <button
              onClick={() => setSeccionAbierta(seccionAbierta === seccion.id ? null : seccion.id)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border font-bold text-sm transition-all ${
                seccionAbierta === seccion.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : modoOscuro
                    ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
                    : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{seccion.titulo}</span>
              <span className="text-lg">{seccionAbierta === seccion.id ? '▲' : '▼'}</span>
            </button>

            {seccionAbierta === seccion.id && (
              <div className={`${card} rounded-t-none border-t-0 p-5 space-y-4`}>
                {seccion.contenido.map((item, i) => (
                  <div key={i} className={`pb-4 border-b last:border-0 last:pb-0 ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className="text-sm font-bold text-blue-500 mb-2">❓ {item.pregunta}</p>
                    <p className={`text-sm leading-relaxed whitespace-pre-line ${textSub}`}>{item.respuesta}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {seccionesFiltradas.length === 0 && (
          <div className={`${card} p-12 text-center`}>
            <div className="text-4xl mb-2">🔍</div>
            <p className={textSub}>No se encontraron resultados para "{busqueda}"</p>
          </div>
        )}
      </div>

      {/* CONTACTO */}
      <div className={`mt-6 max-w-3xl ${card} p-5`}>
        <h2 className={`font-black mb-2 ${text}`}>📞 ¿Necesitas más ayuda?</h2>
        <p className={`text-sm ${textSub} mb-3`}>Si tienes alguna pregunta que no está en esta documentación puedes contactarnos.</p>
        <div className="flex gap-3 flex-wrap">
          <a href="https://github.com/josue200409/pos-pro-gt-backend" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-all">
            💻 GitHub
          </a>
          <a href="mailto:mazariegosjosue70@gmail.com"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all">
            📧 Email
          </a>
        </div>
      </div>
    </div>
  )
}