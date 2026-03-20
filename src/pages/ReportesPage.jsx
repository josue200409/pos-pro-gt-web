import { useState, useEffect } from 'react'
import { ventasService, configuracionService } from '../services/api'
import { useTema } from '../context/TemaContext'
import { useToast } from '../components/Toast'
import * as XLSX from 'xlsx'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function ReportesPage() {
  const { modoOscuro } = useTema()
  const { toast } = useToast()
  const [resumenHoy, setResumenHoy] = useState(null)
  const [ventasHoy, setVentasHoy] = useState([])
  const [fechaDesde, setFechaDesde] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [reporteRango, setReporteRango] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [config, setConfig] = useState({})
  const [tab, setTab] = useState('hoy')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [r, v, cfg] = await Promise.all([
        ventasService.resumenHoy(),
        ventasService.obtenerTodas(),
        configuracionService.obtener()
      ])
      setResumenHoy(r.data)
      setVentasHoy(v.data || [])
      setConfig(cfg.data || {})
    } catch (e) { console.log(e) }
  }

  const cargarReporteRango = async () => {
    setCargando(true)
    try {
      const r = await ventasService.resumenRango(fechaDesde, fechaHasta)
      setReporteRango(r.data)
      setTab('rango')
    } catch { toast('Error al cargar reporte', 'error') }
    setCargando(false)
  }

  const exportarExcelHoy = () => {
    const datos = ventasHoy.filter(v => !v.cancelada).map(v => ({
      'Hora': new Date(v.created_at).toLocaleTimeString('es-GT'),
      'Método': v.metodo_pago,
      'Total': parseFloat(v.total).toFixed(2),
      'Vuelto': parseFloat(v.vuelto || 0).toFixed(2),
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas Hoy')
    XLSX.writeFile(wb, `reporte_hoy_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast('Excel exportado correctamente', 'exito')
  }

  const exportarExcelRango = () => {
    if (!reporteRango) return
    const datos = (reporteRango.por_dia || []).map(d => ({
      'Fecha': d.fecha,
      'Transacciones': d.transacciones,
      'Total': parseFloat(d.total).toFixed(2),
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
    XLSX.writeFile(wb, `reporte_${fechaDesde}_${fechaHasta}.xlsx`)
    toast('Excel exportado correctamente', 'exito')
  }

  const imprimirReporte = (tipo) => {
    const empresa = config.empresa_nombre || 'Mi Negocio'
    const nit = config.empresa_nit || 'CF'
    const telefono = config.empresa_telefono || ''
    const direccion = config.empresa_direccion || ''

    const ventasActivas = ventasHoy.filter(v => !v.cancelada)
    const totalEfectivo = ventasActivas.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + parseFloat(v.total || 0), 0)
    const totalTarjeta = ventasActivas.filter(v => v.metodo_pago === 'tarjeta').reduce((s, v) => s + parseFloat(v.total || 0), 0)
    const totalTransferencia = ventasActivas.filter(v => v.metodo_pago === 'transferencia').reduce((s, v) => s + parseFloat(v.total || 0), 0)
    const totalVuelto = ventasActivas.reduce((s, v) => s + parseFloat(v.vuelto || 0), 0)

    const ventana = window.open('', '_blank')
    ventana.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Reporte</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 13px; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 15px; }
        .empresa { font-size: 20px; font-weight: 900; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
        .stat { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
        .stat-val { font-size: 20px; font-weight: 900; color: #1a56db; }
        .stat-lbl { font-size: 11px; color: #6b7280; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #1a56db; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        .total { font-size: 18px; font-weight: 900; text-align: right; margin-top: 10px; color: #1a56db; }
        @media print { .no-print { display: none; } }
      </style>
      </head><body>
      <div class="no-print" style="background:#1a56db;color:white;padding:10px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;border-radius:8px;">
        <span style="font-weight:bold;">📄 Reporte — POS Pro GT</span>
        <button onclick="window.print()" style="background:white;color:#1a56db;border:none;padding:8px 16px;border-radius:6px;font-weight:bold;cursor:pointer;">🖨️ Imprimir</button>
      </div>
      <div class="header">
        <div class="empresa">${empresa}</div>
        ${direccion ? `<div style="font-size:12px;color:#555">${direccion}</div>` : ''}
        ${telefono ? `<div style="font-size:12px;color:#555">Tel: ${telefono}</div>` : ''}
        <div style="font-size:12px;color:#555">NIT: ${nit}</div>
        <div style="font-size:14px;font-weight:bold;margin-top:8px;">
          ${tipo === 'hoy' ? `REPORTE DEL DÍA — ${new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : `REPORTE DEL ${fechaDesde} AL ${fechaHasta}`}
        </div>
      </div>

      ${tipo === 'hoy' ? `
      <div class="grid">
        <div class="stat"><div class="stat-val">Q${parseFloat(resumenHoy?.total_ventas || 0).toFixed(2)}</div><div class="stat-lbl">Total Ventas</div></div>
        <div class="stat"><div class="stat-val">${resumenHoy?.total_transacciones || 0}</div><div class="stat-lbl">Transacciones</div></div>
        <div class="stat"><div class="stat-val">Q${totalEfectivo.toFixed(2)}</div><div class="stat-lbl">Efectivo</div></div>
        <div class="stat"><div class="stat-val">Q${totalTarjeta.toFixed(2)}</div><div class="stat-lbl">Tarjeta</div></div>
      </div>
      <table>
        <thead><tr><th>Hora</th><th>Método</th><th>Total</th><th>Vuelto</th></tr></thead>
        <tbody>
          ${ventasActivas.map(v => `<tr><td>${new Date(v.created_at).toLocaleTimeString('es-GT')}</td><td>${v.metodo_pago}</td><td>Q${parseFloat(v.total).toFixed(2)}</td><td>Q${parseFloat(v.vuelto || 0).toFixed(2)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="total">TOTAL DEL DÍA: Q${parseFloat(resumenHoy?.total_ventas || 0).toFixed(2)}</div>
      ` : `
      <div class="grid">
        <div class="stat"><div class="stat-val">Q${parseFloat(reporteRango?.total_ventas || 0).toFixed(2)}</div><div class="stat-lbl">Total Ventas</div></div>
        <div class="stat"><div class="stat-val">${reporteRango?.total_transacciones || 0}</div><div class="stat-lbl">Transacciones</div></div>
      </div>
      <table>
        <thead><tr><th>Fecha</th><th>Transacciones</th><th>Total</th></tr></thead>
        <tbody>
          ${(reporteRango?.por_dia || []).map(d => `<tr><td>${d.fecha}</td><td>${d.transacciones}</td><td>Q${parseFloat(d.total).toFixed(2)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="total">TOTAL DEL PERÍODO: Q${parseFloat(reporteRango?.total_ventas || 0).toFixed(2)}</div>
      `}

      <div class="footer">
        <div>Generado por POS Pro GT — ${new Date().toLocaleString('es-GT')}</div>
      </div>
      </body></html>
    `)
    ventana.document.close()
  }

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const tooltipStyle = { background: modoOscuro ? '#1f2937' : '#fff', border: 'none', borderRadius: 12 }
  const tickColor = modoOscuro ? '#9ca3af' : '#6b7280'
  const gridColor = modoOscuro ? '#374151' : '#f3f4f6'

  const ventasActivas = ventasHoy.filter(v => !v.cancelada)
  const totalEfectivo = ventasActivas.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + parseFloat(v.total || 0), 0)
  const totalTarjeta = ventasActivas.filter(v => v.metodo_pago === 'tarjeta').reduce((s, v) => s + parseFloat(v.total || 0), 0)
  const totalTransferencia = ventasActivas.filter(v => v.metodo_pago === 'transferencia').reduce((s, v) => s + parseFloat(v.total || 0), 0)

  const datosMetodo = [
    { name: 'Efectivo', value: totalEfectivo },
    { name: 'Tarjeta', value: totalTarjeta },
    { name: 'Transfer.', value: totalTransferencia },
  ].filter(d => d.value > 0)

  const datosPorDia = (reporteRango?.por_dia || []).map(d => ({
    fecha: new Date(d.fecha).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' }),
    total: parseFloat(d.total),
    transacciones: parseInt(d.transacciones)
  }))

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>📄 Reportes</h1>
          <p className={`text-sm mt-1 ${textSub}`}>{new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarExcelHoy} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-700 shadow-md">📊 Excel Hoy</button>
          <button onClick={() => imprimirReporte('hoy')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">🖨️ Imprimir Hoy</button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'hoy', label: '📅 Hoy' },
          { id: 'rango', label: '📆 Por Período' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-md' : modoOscuro ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-white text-gray-500 border border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB HOY */}
      {tab === 'hoy' && (
        <>
          {/* TARJETAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Ventas', val: `Q${parseFloat(resumenHoy?.total_ventas || 0).toFixed(2)}`, emoji: '💰', color: 'from-blue-500 to-blue-700' },
              { label: 'Transacciones', val: resumenHoy?.total_transacciones || 0, emoji: '🧾', color: 'from-green-500 to-green-700' },
              { label: 'IVA (12%)', val: `Q${(parseFloat(resumenHoy?.total_ventas || 0) * 0.12).toFixed(2)}`, emoji: '🏛️', color: 'from-purple-500 to-purple-700' },
              { label: 'Promedio/Venta', val: `Q${resumenHoy?.total_transacciones > 0 ? (parseFloat(resumenHoy.total_ventas) / parseInt(resumenHoy.total_transacciones)).toFixed(2) : '0.00'}`, emoji: '📈', color: 'from-orange-500 to-orange-700' },
            ].map(({ label, val, emoji, color }) => (
              <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-lg`}>
                <div className="text-2xl mb-2">{emoji}</div>
                <div className="text-xl font-black">{val}</div>
                <div className="text-xs opacity-80 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* GRÁFICA MÉTODOS */}
            <div className={`${card} p-5`}>
              <h2 className={`text-xs font-bold uppercase mb-4 ${textSub}`}>💳 Por Método de Pago</h2>
              {datosMetodo.length === 0 ? (
                <div className="text-center py-8"><div className="text-3xl mb-2">💳</div><p className={textSub}>Sin ventas hoy</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={datosMetodo} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                      {datosMetodo.map((_, i) => <Cell key={i} fill={COLORES[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={v => [`Q${v.toFixed(2)}`, '']} />
                    <Legend formatter={v => <span style={{ color: tickColor, fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* DESGLOSE */}
            <div className={`${card} p-5`}>
              <h2 className={`text-xs font-bold uppercase mb-4 ${textSub}`}>💰 Desglose del Día</h2>
              <div className="space-y-3">
                {[
                  { label: '💵 Efectivo', val: totalEfectivo, color: 'text-green-500' },
                  { label: '💳 Tarjeta', val: totalTarjeta, color: 'text-blue-500' },
                  { label: '📱 Transferencia', val: totalTransferencia, color: 'text-purple-500' },
                  { label: '🏛️ IVA estimado', val: parseFloat(resumenHoy?.total_ventas || 0) * 0.12, color: 'text-orange-500' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className={`text-sm ${textSub}`}>{label}</span>
                    <span className={`text-sm font-black ${color}`}>Q{val.toFixed(2)}</span>
                  </div>
                ))}
                <div className={`pt-3 border-t flex justify-between items-center ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
                  <span className={`font-black text-sm ${text}`}>💰 TOTAL</span>
                  <span className="text-lg font-black text-blue-500">Q{parseFloat(resumenHoy?.total_ventas || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TABLA VENTAS HOY */}
          <div className={`${card} overflow-hidden`}>
            <div className={`p-4 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`font-bold ${text}`}>📋 Transacciones del Día ({ventasActivas.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <tr>
                    <th className="px-4 py-3 text-left">Hora</th>
                    <th className="px-4 py-3 text-left">Método</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {ventasHoy.map(v => (
                    <tr key={v.id} className={`${modoOscuro ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${v.cancelada ? 'opacity-50' : ''}`}>
                      <td className={`px-4 py-3 text-sm ${textSub}`}>{new Date(v.created_at).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className={`px-4 py-3 text-sm capitalize font-semibold ${text}`}>{v.metodo_pago === 'efectivo' ? '💵' : v.metodo_pago === 'tarjeta' ? '💳' : '📱'} {v.metodo_pago}</td>
                      <td className="px-4 py-3 text-right text-sm font-black text-blue-500">Q{parseFloat(v.total).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${v.cancelada ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {v.cancelada ? '❌' : '✅'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ventasHoy.length === 0 && (
                <div className="text-center py-8"><div className="text-4xl mb-2">📋</div><p className={textSub}>Sin ventas hoy</p></div>
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB RANGO */}
      {tab === 'rango' && (
        <>
          {/* SELECTOR DE FECHAS */}
          <div className={`${card} p-4 mb-6`}>
            <div className="flex gap-3 flex-wrap items-end">
              <div>
                <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Desde</label>
                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Hasta</label>
                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} />
              </div>
              <div className="flex gap-2">
                {[
                  { label: '7 días', desde: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
                  { label: '15 días', desde: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
                  { label: 'Este mes', desde: new Date(new Date().setDate(1)).toISOString().split('T')[0] },
                  { label: '3 meses', desde: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
                ].map(p => (
                  <button key={p.label} onClick={() => { setFechaDesde(p.desde); setFechaHasta(new Date().toISOString().split('T')[0]) }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${modoOscuro ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <button onClick={cargarReporteRango} disabled={cargando}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 shadow-md">
                {cargando ? '⏳ Cargando...' : '📊 Generar Reporte'}
              </button>
            </div>
          </div>

          {reporteRango ? (
            <>
              {/* TARJETAS RANGO */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Ventas', val: `Q${parseFloat(reporteRango.total_ventas || 0).toFixed(2)}`, emoji: '💰', color: 'from-blue-500 to-blue-700' },
                  { label: 'Transacciones', val: reporteRango.total_transacciones || 0, emoji: '🧾', color: 'from-green-500 to-green-700' },
                  { label: 'IVA Estimado', val: `Q${(parseFloat(reporteRango.total_ventas || 0) * 0.12).toFixed(2)}`, emoji: '🏛️', color: 'from-purple-500 to-purple-700' },
                  { label: 'Promedio/Día', val: `Q${reporteRango.por_dia?.length > 0 ? (parseFloat(reporteRango.total_ventas) / reporteRango.por_dia.length).toFixed(2) : '0.00'}`, emoji: '📈', color: 'from-orange-500 to-orange-700' },
                ].map(({ label, val, emoji, color }) => (
                  <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-lg`}>
                    <div className="text-2xl mb-2">{emoji}</div>
                    <div className="text-xl font-black">{val}</div>
                    <div className="text-xs opacity-80 mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* GRÁFICA LÍNEA POR DÍA */}
              {datosPorDia.length > 0 && (
                <div className={`${card} p-5 mb-6`}>
                  <h2 className={`text-xs font-bold uppercase mb-4 ${textSub}`}>📅 Ventas por Día</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={datosPorDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: tickColor }} />
                      <YAxis tick={{ fontSize: 10, fill: tickColor }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [`Q${v.toFixed(2)}`, 'Ventas']} />
                      <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* GRÁFICA BARRAS TRANSACCIONES */}
              {datosPorDia.length > 0 && (
                <div className={`${card} p-5 mb-6`}>
                  <h2 className={`text-xs font-bold uppercase mb-4 ${textSub}`}>🧾 Transacciones por Día</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={datosPorDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: tickColor }} />
                      <YAxis tick={{ fontSize: 10, fill: tickColor }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [v, 'Transacciones']} />
                      <Bar dataKey="transacciones" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* BOTONES EXPORTAR */}
              <div className="flex gap-3">
                <button onClick={exportarExcelRango} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 shadow-md">
                  📊 Exportar Excel
                </button>
                <button onClick={() => imprimirReporte('rango')} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">
                  🖨️ Imprimir PDF
                </button>
              </div>
            </>
          ) : (
            <div className={`${card} p-12 text-center`}>
              <div className="text-4xl mb-2">📊</div>
              <p className={`${textSub} mb-4`}>Selecciona un período y genera el reporte</p>
              <button onClick={cargarReporteRango} disabled={cargando}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">
                {cargando ? '⏳ Cargando...' : '📊 Generar Reporte'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}