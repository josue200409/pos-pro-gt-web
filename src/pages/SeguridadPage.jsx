import { useState, useEffect } from 'react'
import { monitorService } from '../services/api'
import { useTema } from '../context/TemaContext'

const BASE_URL = 'https://pos-pro-gt-backend.onrender.com/api'

async function apiSeguridad(endpoint, method = 'GET', body = null) {
  const config = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  }
  if (body) config.body = JSON.stringify(body)
  const res = await fetch(`${BASE_URL}/seguridad${endpoint}`, config)
  return res.json()
}

export default function SeguridadPage() {
  const [vista, setVista] = useState('actividad')
  const [actividad, setActividad] = useState([])
  const [bloqueados, setBloqueados] = useState([])
  const [historialBackup, setHistorialBackup] = useState([])
  const [healthData, setHealthData] = useState(null)
  const [statsData, setStatsData] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [filtroAccion, setFiltroAccion] = useState('')
  const [emailBackup, setEmailBackup] = useState('')
  const [modalEmail, setModalEmail] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const { modoOscuro } = useTema()
  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `flex-1 px-3 py-2 rounded-xl border focus:outline-none text-sm ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`

  useEffect(() => {
    if (vista === 'actividad') cargarActividad()
    if (vista === 'alertas') cargarBloqueados()
    if (vista === 'backup') cargarHistorialBackup()
    if (vista === 'monitor') cargarMonitor()
  }, [vista])

  const cargarActividad = async () => {
    setCargando(true)
    try {
      const data = await apiSeguridad('/actividad?limite=100')
      setActividad(Array.isArray(data) ? data : [])
    } catch { setActividad([]) }
    setCargando(false)
  }

  const cargarBloqueados = async () => {
    setCargando(true)
    try {
      const data = await apiSeguridad('/bloqueados')
      setBloqueados(Array.isArray(data) ? data : [])
    } catch { setBloqueados([]) }
    setCargando(false)
  }

  const cargarHistorialBackup = async () => {
    setCargando(true)
    try {
      const data = await apiSeguridad('/backup/historial')
      setHistorialBackup(Array.isArray(data) ? data : [])
    } catch { setHistorialBackup([]) }
    setCargando(false)
  }

  const cargarMonitor = async () => {
    setCargando(true)
    try {
      const [health, stats] = await Promise.all([
        monitorService.health(),
        monitorService.stats()
      ])
      setHealthData(health.data)
      setStatsData(stats.data)
    } catch { }
    setCargando(false)
  }

  const desbloquearCuenta = async (email) => {
    if (!confirm(`¿Desbloquear la cuenta de ${email}?`)) return
    await apiSeguridad('/desbloquear', 'POST', { email })
    cargarBloqueados()
  }

  const descargarBackup = async () => {
    setDescargando(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${BASE_URL}/seguridad/backup/generar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_posprogt_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      cargarHistorialBackup()
    } catch { alert('Error al descargar backup') }
    setDescargando(false)
  }

  const enviarBackupEmail = async () => {
    if (!emailBackup) return alert('Ingresa un email')
    try {
      const res = await apiSeguridad('/backup/email', 'POST', { email_destino: emailBackup })
      if (res.ok) { alert(`✅ Backup enviado a ${emailBackup}`); setModalEmail(false); cargarHistorialBackup() }
      else alert(res.error)
    } catch { alert('Error') }
  }

  const colorAccion = (accion) => {
    if (accion.includes('EXITOSO')) return 'text-green-600 bg-green-50'
    if (accion.includes('FALLIDO') || accion.includes('BLOQUEADO')) return 'text-red-600 bg-red-50'
    if (accion.includes('LOGOUT')) return 'text-gray-600 bg-gray-50'
    if (accion.includes('BACKUP')) return 'text-purple-600 bg-purple-50'
    return 'text-blue-600 bg-blue-50'
  }

  const formatFecha = (f) => f ? new Date(f).toLocaleString('es-GT') : ''

  const actividadFiltrada = filtroAccion
    ? actividad.filter(a => a.accion.toLowerCase().includes(filtroAccion.toLowerCase()))
    : actividad

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      <h1 className={`text-2xl font-black mb-6 ${text}`}>🔒 Seguridad</h1>

      {/* TABS */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: 'actividad', label: '📋 Actividad' },
          { id: 'alertas', label: '🚨 Alertas' },
          { id: 'backup', label: '☁️ Backup' },
          { id: 'monitor', label: '📊 Monitor' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setVista(t.id)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${vista === t.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ACTIVIDAD */}
      {vista === 'actividad' && (
        <div className={`${card} overflow-hidden`}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
            <input
              value={filtroAccion}
              onChange={e => setFiltroAccion(e.target.value)}
              placeholder="Filtrar por acción..."
              className={inputCls}
            />
            <button onClick={cargarActividad} className="text-sm text-blue-600 font-bold whitespace-nowrap">🔄 Actualizar</button>
          </div>
          {cargando ? (
            <div className="p-8 text-center text-gray-400">Cargando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <tr>
                    <th className="px-4 py-3 text-left">Usuario</th>
                    <th className="px-4 py-3 text-left">Acción</th>
                    <th className="px-4 py-3 text-left">Módulo</th>
                    <th className="px-4 py-3 text-left">IP</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {actividadFiltrada.slice(0, 50).map(a => (
                    <tr key={a.id} className={modoOscuro ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">{a.nombre_usuario || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${colorAccion(a.accion)}`}>{a.accion}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">{a.modulo || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{a.ip || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatFecha(a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ALERTAS */}
      {vista === 'alertas' && (
        <div className="space-y-4">
          <div className={`${card} overflow-hidden`}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className={`font-bold ${text}`}>🔴 Cuentas Bloqueadas</h2>
              <button onClick={cargarBloqueados} className="text-sm text-blue-600 font-bold">🔄 Actualizar</button>
            </div>
            {bloqueados.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">✅</div>
                <p>No hay cuentas bloqueadas</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <tr>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-center">Intentos</th>
                    <th className="px-4 py-3 text-left">Bloqueada</th>
                    <th className="px-4 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {bloqueados.map(b => (
                    <tr key={b.id} className={modoOscuro ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">{b.email}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">{b.intentos}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatFecha(b.fecha_bloqueo)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => desbloquearCuenta(b.email)} className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-green-700">
                          Desbloquear
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* BACKUP */}
      {vista === 'backup' && (
        <div className="space-y-4">
          <div className={`rounded-2xl p-4 ${modoOscuro ? 'bg-indigo-900 border border-indigo-700' : 'bg-indigo-50 border border-indigo-200'}`}>
            <h3 className={`font-bold mb-1 ${modoOscuro ? 'text-indigo-300' : 'text-indigo-800'}`}>⏰ Backup automático</h3>
            <p className={`text-sm ${modoOscuro ? 'text-indigo-400' : 'text-indigo-600'}`}>El sistema genera un backup automático cada día a las 2:00 AM y lo envía al email configurado en el servidor.</p>
          </div>

          <div className={`${card} p-5`}>
            <h3 className={`font-bold mb-4 ${text}`}>Backup Manual</h3>
            <div className="flex gap-3">
              <button
                onClick={descargarBackup}
                disabled={descargando}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {descargando ? '⏳ Generando...' : '📥 Descargar Backup'}
              </button>
              <button
                onClick={() => setModalEmail(true)}
                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 text-sm"
              >
                📧 Enviar por Email
              </button>
            </div>
          </div>

          <div className={`${card} overflow-hidden`}>
            <div className="p-4 border-b border-gray-200 font-bold text-gray-700">Historial de Backups</div>
            {historialBackup.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Sin backups registrados</div>
            ) : (
              <table className="w-full">
                <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <tr>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-center">Registros</th>
                    <th className="px-4 py-3 text-center">Email</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {historialBackup.map(b => (
                    <tr key={b.id} className={modoOscuro ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${b.tipo === 'automatico' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {b.tipo === 'automatico' ? '⏰ Automático' : '👤 Manual'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{b.registros}</td>
                      <td className="px-4 py-3 text-center">
                        {b.enviado_email ? <span className="text-green-600 text-xs">✅ Enviado</span> : <span className="text-gray-400 text-xs">No</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatFecha(b.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MONITOR */}
      {vista === 'monitor' && (
        <div className="space-y-4">
          <button
            onClick={cargarMonitor}
            disabled={cargando}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {cargando ? '⏳ Cargando...' : '🔄 Actualizar Monitor'}
          </button>

          {healthData && (
            <div className={`${card} p-5`}>
              <h3 className={`font-bold mb-4 ${text}`}>🖥️ Estado del Servidor</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Estado', val: healthData.status === 'ok' ? '✅ Funcionando' : '❌ Error', color: healthData.status === 'ok' ? 'text-green-600' : 'text-red-600' },
                  { label: 'Base de datos', val: `${healthData.database?.status === 'ok' ? '✅' : '❌'} ${healthData.database?.responseTime}` },
                  { label: 'Memoria usada', val: healthData.memoria?.usado },
                  { label: 'Memoria libre', val: healthData.memoria?.libre },
                  { label: 'Uptime', val: healthData.uptime },
                  { label: 'Node.js', val: healthData.node },
                ].map(({ label, val, color }) => (
                  <div key={label} className={`rounded-xl p-3 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-xs mb-1 ${textSub}`}>{label}</div>
                    <div className={`text-sm font-bold ${color || 'text-gray-800'}`}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {statsData && (
            <div className={`${card} p-5`}>
              <h3 className={`font-bold mb-4 ${text}`}>📊 Estadísticas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Ventas hoy', val: statsData.hoy?.ventas, color: 'text-blue-600' },
                  { label: 'Monto hoy', val: `Q${statsData.hoy?.monto}`, color: 'text-green-600' },
                  { label: 'Productos', val: statsData.productos, color: 'text-purple-600' },
                  { label: 'Intentos fallidos/hora', val: statsData.intentos_fallidos_hora, color: statsData.intentos_fallidos_hora > 5 ? 'text-red-600' : 'text-green-600' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className={`text-xl font-black ${color}`}>{val}</div>
                    <div className="text-xs text-gray-400 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!healthData && !cargando && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">📊</div>
              <p>Presiona actualizar para ver el estado del sistema</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL EMAIL */}
      {modalEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-sm ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-black mb-4 ${text}`}>📧 Enviar Backup por Email</h2>
            <input
              value={emailBackup}
              onChange={e => setEmailBackup(e.target.value)}
              placeholder="correo@ejemplo.com"
              type="email"
              className={`w-full px-3 py-2 rounded-xl border focus:outline-none text-sm mb-4 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setModalEmail(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm">Cancelar</button>
              <button onClick={enviarBackupEmail} className="flex-1 py-2 rounded-xl bg-green-600 text-white font-bold text-sm">Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}