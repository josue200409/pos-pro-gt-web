import { useState, useEffect } from 'react'
import { ventasService } from '../services/api'
import { useTema } from '../context/TemaContext'

export default function ReportesPage() {
  const { modoOscuro } = useTema()
  const [resumenHoy, setResumenHoy] = useState(null)
  const [ventasHoy, setVentasHoy] = useState([])
  const [fechaDesde, setFechaDesde] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [reporteRango, setReporteRango] = useState(null)
  const [cargando, setCargando] = useState(false)
  const config = JSON.parse(localStorage.getItem('config') || '{}')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [r, v] = await Promise.all([
        ventasService.resumenHoy(),
        ventasService.obtenerTodas()
      ])
      setResumenHoy(r.data)
      setVentasHoy(v.data || [])
    } catch (e) { console.log(e) }
  }

  const generarReporte = async () => {
    setCargando(true)
    try {
      const r = await ventasService.resumenRango(fechaDesde, fechaHasta)
      setReporteRango(r.data)
    } catch (e) { alert('Error al generar reporte') }
    setCargando(false)
  }

  const ventasActivas = ventasHoy.filter(v => !v.cancelada)
  const totalEfectivo = ventasActivas.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + parseFloat(v.total || 0), 0)
  const totalTarjeta = ventasActivas.filter(v => v.metodo_pago === 'tarjeta').reduce((s, v) => s + parseFloat(v.total || 0), 0)
  const totalTransferencia = ventasActivas.filter(v => v.metodo_pago === 'transferencia').reduce((s, v) => s + parseFloat(v.total || 0), 0)
  const totalVuelto = ventasActivas.reduce((s, v) => s + parseFloat(v.vuelto || 0), 0)
  const efectivoNeto = totalEfectivo - totalVuelto

  const imprimirReporteHoy = () => {
    const ventana = window.open('', '_blank')
    ventana.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Reporte del Día</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
        h1 { font-size: 20px; font-weight: 900; margin-bottom: 4px; }
        h2 { font-size: 14px; font-weight: 700; margin: 16px 0 8px; color: #444; text-transform: uppercase; }
        .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
        .empresa { font-size: 12px; color: #666; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
        .stat { border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center; }
        .stat-val { font-size: 20px; font-weight: 900; color: #1a56db; }
        .stat-label { font-size: 10px; color: #666; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f3f4f6; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; }
        td { padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; }
        .total-row { font-weight: 900; font-size: 14px; }
        .footer { text-align: center; font-size: 10px; color: #999; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        @media print { .no-print { display: none; } }
      </style>
      </head><body>
      <div class="no-print" style="background:#1a56db;color:white;padding:10px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;border-radius:8px;">
        <span style="font-weight:bold;">📄 Reporte del Día — POS Pro GT</span>
        <button onclick="window.print()" style="background:white;color:#1a56db;border:none;padding:8px 16px;border-radius:6px;font-weight:bold;cursor:pointer;">🖨️ Imprimir</button>
      </div>
      <div class="header">
        <h1>🏪 Reporte de Ventas</h1>
        <div class="empresa">${new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
      <h2>Resumen General</h2>
      <div class="grid">
        <div class="stat"><div class="stat-val">Q${parseFloat(resumenHoy?.total_ventas || 0).toFixed(2)}</div><div class="stat-label">Total Ventas</div></div>
        <div class="stat"><div class="stat-val">${resumenHoy?.total_transacciones || 0}</div><div class="stat-label">Transacciones</div></div>
        <div class="stat"><div class="stat-val">Q${totalEfectivo.toFixed(2)}</div><div class="stat-label">Efectivo</div></div>
        <div class="stat"><div class="stat-val">Q${totalTarjeta.toFixed(2)}</div><div class="stat-label">Tarjeta</div></div>
      </div>
      <h2>Desglose por Método de Pago</h2>
      <table>
        <tr><th>Método</th><th>Monto</th><th>Ventas</th></tr>
        <tr><td>💵 Efectivo</td><td>Q${totalEfectivo.toFixed(2)}</td><td>${ventasActivas.filter(v => v.metodo_pago === 'efectivo').length}</td></tr>
        <tr><td>💳 Tarjeta</td><td>Q${totalTarjeta.toFixed(2)}</td><td>${ventasActivas.filter(v => v.metodo_pago === 'tarjeta').length}</td></tr>
        <tr><td>📱 Transferencia</td><td>Q${totalTransferencia.toFixed(2)}</td><td>${ventasActivas.filter(v => v.metodo_pago === 'transferencia').length}</td></tr>
        <tr><td>🔄 Vuelto entregado</td><td>-Q${totalVuelto.toFixed(2)}</td><td>—</td></tr>
        <tr class="total-row"><td>💰 Efectivo Neto</td><td>Q${efectivoNeto.toFixed(2)}</td><td>—</td></tr>
      </table>
      <h2>Transacciones del Día</h2>
      <table>
        <tr><th>Hora</th><th>Método</th><th>Total</th><th>Vuelto</th></tr>
        ${ventasActivas.map(v => `
          <tr>
            <td>${new Date(v.created_at).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</td>
            <td style="text-transform:capitalize">${v.metodo_pago}</td>
            <td>Q${parseFloat(v.total).toFixed(2)}</td>
            <td>${v.vuelto > 0 ? `Q${parseFloat(v.vuelto).toFixed(2)}` : '—'}</td>
          </tr>
        `).join('')}
      </table>
      <div class="footer">Generado por POS Pro GT — ${new Date().toLocaleString('es-GT')}</div>
      </body></html>
    `)
    ventana.document.close()
  }

  const imprimirReporteRango = () => {
    if (!reporteRango) return alert('Genera el reporte primero')
    const ventana = window.open('', '_blank')
    ventana.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Reporte por Período</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { font-size: 20px; font-weight: 900; }
        h2 { font-size: 14px; font-weight: 700; margin: 16px 0 8px; color: #444; text-transform: uppercase; }
        .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .stat { border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center; }
        .stat-val { font-size: 18px; font-weight: 900; color: #1a56db; }
        .stat-label { font-size: 10px; color: #666; }
        .footer { text-align: center; font-size: 10px; color: #999; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        @media print { .no-print { display: none; } }
      </style>
      </head><body>
      <div class="no-print" style="background:#1a56db;color:white;padding:10px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;border-radius:8px;">
        <span style="font-weight:bold;">📊 Reporte por Período</span>
        <button onclick="window.print()" style="background:white;color:#1a56db;border:none;padding:8px 16px;border-radius:6px;font-weight:bold;cursor:pointer;">🖨️ Imprimir</button>
      </div>
      <div class="header">
        <h1>📊 Reporte por Período</h1>
        <div style="font-size:12px;color:#666">${fechaDesde} al ${fechaHasta}</div>
      </div>
      <div class="grid">
        <div class="stat"><div class="stat-val">Q${parseFloat(reporteRango.total_ventas || 0).toFixed(2)}</div><div class="stat-label">Total Ventas</div></div>
        <div class="stat"><div class="stat-val">${reporteRango.total_transacciones || 0}</div><div class="stat-label">Transacciones</div></div>
        <div class="stat"><div class="stat-val">Q${parseFloat(reporteRango.total_iva || 0).toFixed(2)}</div><div class="stat-label">IVA Generado</div></div>
      </div>
      <div class="footer">Generado por POS Pro GT — ${new Date().toLocaleString('es-GT')}</div>
      </body></html>
    `)
    ventana.document.close()
  }

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>📄 Reportes</h1>
          <p className={`text-sm mt-1 ${textSub}`}>Análisis de ventas y rendimiento</p>
        </div>
        <button onClick={imprimirReporteHoy} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">
          🖨️ Imprimir Reporte Hoy
        </button>
      </div>

      {/* RESUMEN HOY */}
      <div className={`bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white mb-6 shadow-lg`}>
        <h2 className="text-sm font-bold opacity-80 uppercase mb-4">Resumen de Hoy</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-black">Q{parseFloat(resumenHoy?.total_ventas || 0).toFixed(2)}</div>
            <div className="text-xs opacity-70 mt-1">Total ventas</div>
          </div>
          <div>
            <div className="text-2xl font-black">{resumenHoy?.total_transacciones || 0}</div>
            <div className="text-xs opacity-70 mt-1">Transacciones</div>
          </div>
          <div>
            <div className="text-2xl font-black">Q{parseFloat(resumenHoy?.total_iva || 0).toFixed(2)}</div>
            <div className="text-xs opacity-70 mt-1">IVA generado</div>
          </div>
        </div>
      </div>

      {/* DESGLOSE HOY */}
      <div className={`${card} p-5 mb-6`}>
        <h2 className={`text-xs font-bold uppercase mb-4 ${textSub}`}>Desglose por Método de Pago</h2>
        <div className="space-y-2">
          {[
            { label: '💵 Efectivo', val: totalEfectivo, color: 'text-green-500', bgBar: 'bg-green-500' },
            { label: '💳 Tarjeta', val: totalTarjeta, color: 'text-blue-500', bgBar: 'bg-blue-500' },
            { label: '📱 Transferencia', val: totalTransferencia, color: 'text-purple-500', bgBar: 'bg-purple-500' },
            { label: '🔄 Vuelto entregado', val: totalVuelto, color: 'text-red-500', bgBar: 'bg-red-400', negativo: true },
          ].map(({ label, val, color, bgBar, negativo }) => {
            const totalGeneral = parseFloat(resumenHoy?.total_ventas || 1)
            const pct = Math.min(100, (val / totalGeneral) * 100)
            return (
              <div key={label}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm ${textSub}`}>{label}</span>
                  <span className={`text-sm font-black ${color}`}>{negativo ? '-' : ''}Q{val.toFixed(2)}</span>
                </div>
                <div className={`h-1.5 rounded-full ${modoOscuro ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className={`h-full rounded-full ${bgBar} transition-all`} style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            )
          })}
          <div className={`flex justify-between items-center pt-3 border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
            <span className={`text-sm font-bold ${text}`}>💰 Efectivo Neto</span>
            <span className="text-lg font-black text-green-500">Q{efectivoNeto.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* REPORTE POR RANGO */}
      <div className={`${card} p-5`}>
        <h2 className={`text-xs font-bold uppercase mb-4 ${textSub}`}>Reporte por Período</h2>
        <div className="flex gap-3 items-end flex-wrap mb-4">
          <div>
            <label className={`text-xs ${textSub} mb-1 block`}>Desde</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={`text-xs ${textSub} mb-1 block`}>Hasta</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className={inputCls} />
          </div>
          <button onClick={generarReporte} disabled={cargando} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 shadow-md">
            {cargando ? '⏳' : '📊 Generar'}
          </button>
          {reporteRango && (
            <button onClick={imprimirReporteRango} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-700 shadow-md">
              🖨️ Imprimir
            </button>
          )}
        </div>

        {reporteRango && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total ventas', val: `Q${parseFloat(reporteRango.total_ventas || 0).toFixed(2)}`, color: 'text-blue-500' },
              { label: 'Transacciones', val: reporteRango.total_transacciones || 0, color: 'text-green-500' },
              { label: 'IVA', val: `Q${parseFloat(reporteRango.total_iva || 0).toFixed(2)}`, color: 'text-purple-500' },
            ].map(({ label, val, color }) => (
              <div key={label} className={`p-4 rounded-xl text-center ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-xl font-black ${color}`}>{val}</div>
                <div className={`text-xs mt-1 ${textSub}`}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}