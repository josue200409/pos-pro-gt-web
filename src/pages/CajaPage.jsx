import { useState, useEffect } from 'react'
import { cajaService } from '../services/api'
import { useTema } from '../context/TemaContext'
import { useToast } from '../components/Toast'

export default function CajaPage() {
  const { toast } = useToast()
  const { modoOscuro } = useTema()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [efectivoInicial, setEfectivoInicial] = useState('')
  const [efectivoContado, setEfectivoContado] = useState('')
  const [gastoDesc, setGastoDesc] = useState('')
  const [gastoMonto, setGastoMonto] = useState('')
  const [gastoCategoria, setGastoCategoria] = useState('general')
  const [modalApertura, setModalApertura] = useState(false)
  const [modalCierre, setModalCierre] = useState(false)
  const [modalGasto, setModalGasto] = useState(false)
  const [historial, setHistorial] = useState([])
  const [modalHistorial, setModalHistorial] = useState(false)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const r = await cajaService.obtenerHoy()
      setDatos(r.data)
    } catch (e) { console.log(e) }
    setCargando(false)
  }

  const cargarHistorial = async () => {
    try {
      const r = await cajaService.historial()
      setHistorial(r.data || [])
      setModalHistorial(true)
    } catch { alert('Error al cargar historial') }
  }

  const abrirCaja = async () => {
    try {
      await cajaService.abrir({ efectivo_inicial: parseFloat(efectivoInicial) || 0 })
      setModalApertura(false)
      setEfectivoInicial('')
      cargarDatos()
      toast('Caja abierta correctamente', 'exito')
    } catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const cerrarCaja = async () => {
    if (!confirm('¿Confirmar cierre de caja?')) return
    try {
      await cajaService.cerrar({ efectivo_contado: parseFloat(efectivoContado), notas: '' })
      setModalCierre(false)
      setEfectivoContado('')
      cargarDatos()
      toast('Caja cerrada correctamente', 'exito')
    } catch (e) { alert(e.response?.data?.error || 'Error') }
  }

  const agregarGasto = async () => {
    if (!gastoDesc || !gastoMonto) return alert('Completa descripción y monto')
    try {
      await cajaService.agregarGasto({ descripcion: gastoDesc, monto: parseFloat(gastoMonto), categoria: gastoCategoria })
      setModalGasto(false)
      setGastoDesc(''); setGastoMonto('')
      cargarDatos()
      toast('Gasto registrado correctamente', 'exito')
    } catch { toast('Error al registrar gasto', 'error') }
  }

  const eliminarGasto = async (id, desc) => {
    if (!confirm(`¿Eliminar "${desc}"?`)) return
    await cajaService.eliminarGasto(id)
    cargarDatos()
  }

  const ventasPorMetodo = (metodo) => {
    const v = (datos?.ventas || []).find(v => v.metodo_pago === metodo)
    return parseFloat(v?.total || 0)
  }
  const totalEfectivo = ventasPorMetodo('efectivo')
  const totalTarjeta = ventasPorMetodo('tarjeta')
  const totalTransferencia = ventasPorMetodo('transferencia')
  const totalVuelto = parseFloat((datos?.ventas || []).find(v => v.metodo_pago === 'efectivo')?.vuelto || 0)
  const totalGastos = (datos?.gastos || []).reduce((s, g) => s + parseFloat(g.monto || 0), 0)
  const efectivoInCaja = parseFloat(datos?.apertura?.efectivo_inicial || 0) + totalEfectivo - totalVuelto - totalGastos
  const cajaCerrada = !!datos?.cierre
  const diferenciaCierre = efectivoContado ? parseFloat(efectivoContado) - efectivoInCaja : null

  const CATEGORIAS = [
    { id: 'general', label: '📦 General' },
    { id: 'compras', label: '🛒 Compras' },
    { id: 'servicios', label: '🔧 Servicios' },
    { id: 'transporte', label: '🚗 Transporte' },
    { id: 'limpieza', label: '🧹 Limpieza' },
    { id: 'otros', label: '📝 Otros' },
  ]

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`
  const modal = `rounded-2xl p-6 w-full shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>💰 Caja del Día</h1>
          <p className={`text-sm mt-1 ${textSub}`}>{new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={cargarHistorial} className={`px-4 py-2 rounded-xl font-bold text-sm border ${modoOscuro ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            📋 Historial
          </button>
          {!datos?.apertura && !cajaCerrada && (
            <button onClick={() => setModalApertura(true)} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-700 shadow-md">🔓 Abrir Caja</button>
          )}
          {datos?.apertura && !cajaCerrada && (
            <>
              <button onClick={() => setModalGasto(true)} className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-600 shadow-md">+ Gasto</button>
              <button onClick={() => setModalCierre(true)} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-700 shadow-md">🔒 Cerrar</button>
            </>
          )}
        </div>
      </div>

      {/* ESTADO */}
      <div className={`${cajaCerrada ? 'bg-gradient-to-r from-red-500 to-red-700' : datos?.apertura ? 'bg-gradient-to-r from-green-500 to-green-700' : 'bg-gradient-to-r from-gray-400 to-gray-600'} rounded-2xl p-5 text-white mb-6 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black">{cajaCerrada ? '🔒 CERRADA' : datos?.apertura ? '🟢 ABIERTA' : '⚪ SIN APERTURA'}</div>
            {datos?.apertura && <div className="text-sm opacity-80 mt-1">Efectivo inicial: Q{parseFloat(datos.apertura.efectivo_inicial).toFixed(2)}</div>}
          </div>
          <div className="text-right">
            <div className="text-3xl font-black">Q{efectivoInCaja.toFixed(2)}</div>
            <div className="text-xs opacity-80">Efectivo en caja</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DESGLOSE */}
        <div className={`${card} p-5`}>
          <h2 className={`text-xs font-bold uppercase mb-4 ${textSub}`}>Desglose de Efectivo</h2>
          <div className="space-y-3">
            {[
              { label: '🔓 Efectivo inicial', val: parseFloat(datos?.apertura?.efectivo_inicial || 0), color: textSub },
              { label: '💵 Ventas efectivo', val: totalEfectivo, color: 'text-green-500' },
              { label: '💳 Ventas tarjeta', val: totalTarjeta, color: 'text-blue-500' },
              { label: '📱 Transferencias', val: totalTransferencia, color: 'text-purple-500' },
              { label: '🔄 Vuelto entregado', val: -totalVuelto, color: 'text-orange-500' },
              { label: '💸 Gastos del día', val: -totalGastos, color: 'text-red-500' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex justify-between items-center">
                <span className={`text-sm ${textSub}`}>{label}</span>
                <span className={`text-sm font-bold ${color}`}>{val < 0 ? `-Q${Math.abs(val).toFixed(2)}` : `Q${val.toFixed(2)}`}</span>
              </div>
            ))}
            <div className={`flex justify-between items-center pt-3 border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
              <span className={`font-black ${text}`}>💰 Efectivo en Caja</span>
              <span className="text-xl font-black text-green-500">Q{efectivoInCaja.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* GASTOS */}
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xs font-bold uppercase ${textSub}`}>💸 Gastos del Día</h2>
            <span className="text-sm font-black text-red-500">-Q{totalGastos.toFixed(2)}</span>
          </div>
          {(datos?.gastos || []).length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">💸</div>
              <p className={`text-sm ${textSub}`}>Sin gastos registrados</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(datos?.gastos || []).map(g => (
                <div key={g.id} className={`flex items-center justify-between p-3 rounded-xl ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div>
                    <div className={`text-sm font-semibold ${text}`}>{g.descripcion}</div>
                    <div className={`text-xs capitalize ${textSub}`}>{g.categoria}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-red-500">-Q{parseFloat(g.monto).toFixed(2)}</span>
                    {!cajaCerrada && (
                      <button onClick={() => eliminarGasto(g.id, g.descripcion)} className="text-xs text-red-400 hover:text-red-600">🗑️</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CIERRE DEL DÍA */}
      {cajaCerrada && datos?.cierre && (
        <div className={`mt-6 ${card} p-5`}>
          <h2 className={`text-xs font-bold uppercase mb-4 ${textSub}`}>📋 Resumen del Cierre</h2>
          <div className={`grid grid-cols-3 gap-4`}>
            {[
              { label: 'Esperado', val: `Q${parseFloat(datos.cierre.efectivo_esperado).toFixed(2)}`, color: textSub },
              { label: 'Contado', val: `Q${parseFloat(datos.cierre.efectivo_contado).toFixed(2)}`, color: text },
              { label: parseFloat(datos.cierre.diferencia) >= 0 ? '📈 Sobrante' : '📉 Faltante', val: `Q${Math.abs(parseFloat(datos.cierre.diferencia)).toFixed(2)}`, color: parseFloat(datos.cierre.diferencia) >= 0 ? 'text-green-500' : 'text-red-500' },
            ].map(({ label, val, color }) => (
              <div key={label} className={`p-4 rounded-xl text-center ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-lg font-black ${color}`}>{val}</div>
                <div className={`text-xs mt-1 ${textSub}`}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL APERTURA */}
      {modalApertura && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`${modal} max-w-sm`}>
            <h2 className={`text-lg font-black mb-2 ${text}`}>🔓 Apertura de Caja</h2>
            <p className={`text-sm mb-4 ${textSub}`}>¿Cuánto efectivo hay en caja al inicio?</p>
            <input type="number" value={efectivoInicial} onChange={e => setEfectivoInicial(e.target.value)} placeholder="Q0.00" className={`${inputCls} text-2xl font-black text-center mb-4`} autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setModalApertura(false)} className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cancelar</button>
              <button onClick={abrirCaja} className="flex-2 px-6 py-2 rounded-xl bg-green-600 text-white font-black text-sm hover:bg-green-700 shadow-md">🔓 Abrir Caja</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CIERRE */}
      {modalCierre && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`${modal} max-w-sm`}>
            <h2 className={`text-lg font-black mb-2 ${text}`}>🔒 Cierre de Caja</h2>
            <p className={`text-sm mb-4 ${textSub}`}>Cuenta el efectivo físico y confirma el cierre</p>
            <div className={`p-3 rounded-xl mb-4 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex justify-between text-sm mb-1">
                <span className={textSub}>Esperado en caja</span>
                <span className={`font-black text-green-500`}>Q{efectivoInCaja.toFixed(2)}</span>
              </div>
            </div>
            <input type="number" value={efectivoContado} onChange={e => setEfectivoContado(e.target.value)} placeholder="Efectivo contado Q" className={`${inputCls} text-2xl font-black text-center mb-3`} autoFocus />
            {diferenciaCierre !== null && (
              <div className={`p-3 rounded-xl text-center mb-4 ${diferenciaCierre === 0 ? 'bg-green-50 text-green-700' : diferenciaCierre > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                <div className="font-black text-lg">
                  {diferenciaCierre === 0 ? '✅ CAJA CUADRADA' : diferenciaCierre > 0 ? `📈 SOBRANTE: Q${diferenciaCierre.toFixed(2)}` : `📉 FALTANTE: Q${Math.abs(diferenciaCierre).toFixed(2)}`}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setModalCierre(false)} className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cancelar</button>
              <button onClick={cerrarCaja} className="flex-2 px-6 py-2 rounded-xl bg-red-600 text-white font-black text-sm hover:bg-red-700 shadow-md">🔒 Cerrar Caja</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GASTO */}
      {modalGasto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`${modal} max-w-sm`}>
            <h2 className={`text-lg font-black mb-4 ${text}`}>💸 Registrar Gasto</h2>
            <input value={gastoDesc} onChange={e => setGastoDesc(e.target.value)} placeholder="Descripción del gasto" className={`${inputCls} mb-3`} autoFocus />
            <input type="number" value={gastoMonto} onChange={e => setGastoMonto(e.target.value)} placeholder="Monto (Q)" className={`${inputCls} text-xl font-bold text-center mb-3`} />
            <div className="grid grid-cols-3 gap-2 mb-4">
              {CATEGORIAS.map(c => (
                <button key={c.id} onClick={() => setGastoCategoria(c.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${gastoCategoria === c.id ? 'bg-blue-600 text-white shadow-md' : modoOscuro ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalGasto(false)} className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cancelar</button>
              <button onClick={agregarGasto} className="flex-2 px-6 py-2 rounded-xl bg-orange-500 text-white font-black text-sm hover:bg-orange-600 shadow-md">💸 Registrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL */}
      {modalHistorial && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`${modal} max-w-lg max-h-96 overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-black ${text}`}>📋 Historial de Cierres</h2>
              <button onClick={() => setModalHistorial(false)} className={`w-8 h-8 rounded-xl ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>✕</button>
            </div>
            {historial.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Sin cierres registrados</div>
            ) : historial.map(c => (
              <div key={c.id} className={`p-4 rounded-xl mb-3 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-bold text-sm ${text}`}>{new Date(c.fecha).toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${parseFloat(c.diferencia) === 0 ? 'bg-green-100 text-green-600' : parseFloat(c.diferencia) > 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                    {parseFloat(c.diferencia) === 0 ? '✅ Cuadrada' : parseFloat(c.diferencia) > 0 ? `+Q${parseFloat(c.diferencia).toFixed(2)}` : `-Q${Math.abs(parseFloat(c.diferencia)).toFixed(2)}`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className={textSub}>Ventas: </span><span className={`font-bold ${text}`}>Q{parseFloat(c.total_ventas).toFixed(2)}</span></div>
                  <div><span className={textSub}>Gastos: </span><span className="font-bold text-red-500">Q{parseFloat(c.total_gastos).toFixed(2)}</span></div>
                  <div><span className={textSub}>Contado: </span><span className="font-bold text-green-500">Q{parseFloat(c.efectivo_contado).toFixed(2)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}