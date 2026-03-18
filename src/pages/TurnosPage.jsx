import { useState, useEffect } from 'react'
import { usuariosService } from '../services/api'

const TURNOS = {
  mañana: { label: 'Mañana', emoji: '🌅', hora: '07:00 - 14:00', color: '#f59e0b', bg: 'bg-yellow-50 border-yellow-200' },
  tarde: { label: 'Tarde', emoji: '🌇', hora: '14:00 - 21:00', color: '#6366f1', bg: 'bg-indigo-50 border-indigo-200' },
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function getLunes() {
  const d = new Date()
  const dia = d.getDay()
  const diff = d.getDate() - dia + (dia === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDias(fecha, dias) {
  const d = new Date(fecha)
  d.setDate(d.getDate() + dias)
  return d
}

function fechaKey(fecha) {
  const d = new Date(fecha)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TurnosPage() {
  const [empleados, setEmpleados] = useState([])
  const [asignaciones, setAsignaciones] = useState({})
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [vista, setVista] = useState('semana')
  const [cargando, setCargando] = useState(true)

  const lunes = addDias(getLunes(), semanaOffset * 7)
  const diasSemana = DIAS.map((_, i) => addDias(lunes, i))

  useEffect(() => {
    cargarEmpleados()
    const saved = localStorage.getItem('turnos_asignaciones')
    if (saved) setAsignaciones(JSON.parse(saved))
  }, [])

  const cargarEmpleados = async () => {
    try {
      const r = await usuariosService.listar()
      setEmpleados((r.data || []).map(u => ({
        id: String(u.id),
        nombre: u.nombre,
        rol: u.rol,
        avatar: u.rol === 'admin' ? '👑' : '👤'
      })))
    } catch (e) { console.log(e) }
    setCargando(false)
  }

  const asignarTurno = (empleadoId, fecha, turno) => {
    const key = fechaKey(fecha)
    const nuevas = {
      ...asignaciones,
      [key]: { ...(asignaciones[key] || {}), [empleadoId]: asignaciones[key]?.[empleadoId] === turno ? null : turno }
    }
    setAsignaciones(nuevas)
    localStorage.setItem('turnos_asignaciones', JSON.stringify(nuevas))
  }

  const getTurno = (empleadoId, fecha) => {
    return asignaciones[fechaKey(fecha)]?.[empleadoId] || null
  }

  const empleadosHoy = empleados.map(e => ({
    ...e,
    turno: getTurno(e.id, new Date())
  }))

  const formatFecha = (fecha) => new Date(fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-gray-800 mb-6">👥 Turnos de Empleados</h1>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'hoy', label: '📅 Hoy' },
          { id: 'semana', label: '📆 Semana' },
          { id: 'asignar', label: '✏️ Asignar' },
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

      {/* VISTA HOY */}
      {vista === 'hoy' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Turno Mañana', val: empleadosHoy.filter(e => e.turno === 'mañana').length, color: 'text-yellow-600' },
              { label: 'Turno Tarde', val: empleadosHoy.filter(e => e.turno === 'tarde').length, color: 'text-indigo-600' },
              { label: 'Sin Turno', val: empleadosHoy.filter(e => !e.turno).length, color: 'text-gray-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
                <div className={`text-2xl font-black ${color}`}>{val}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(TURNOS).map(([key, turno]) => (
              <div key={key} className={`bg-white rounded-2xl border-2 p-5 ${turno.bg}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{turno.emoji}</span>
                  <div>
                    <h3 className="font-black text-gray-800">{turno.label}</h3>
                    <p className="text-xs text-gray-500">{turno.hora}</p>
                  </div>
                  <span className="ml-auto text-2xl font-black" style={{ color: turno.color }}>
                    {empleadosHoy.filter(e => e.turno === key).length}
                  </span>
                </div>
                {empleadosHoy.filter(e => e.turno === key).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">Sin empleados asignados</p>
                ) : empleadosHoy.filter(e => e.turno === key).map(emp => (
                  <div key={emp.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <span className="text-xl">{emp.avatar}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{emp.nombre}</p>
                      <p className="text-xs text-gray-400 capitalize">{emp.rol}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA SEMANA */}
      {vista === 'semana' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSemanaOffset(s => s - 1)} className="bg-gray-100 px-3 py-2 rounded-xl font-bold hover:bg-gray-200">◀</button>
            <span className="font-bold text-gray-700">
              {formatFecha(lunes)} — {formatFecha(addDias(lunes, 6))}
            </span>
            <button onClick={() => setSemanaOffset(s => s + 1)} className="bg-gray-100 px-3 py-2 rounded-xl font-bold hover:bg-gray-200">▶</button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-32">Empleado</th>
                    {diasSemana.map((dia, i) => {
                      const esHoy = fechaKey(dia) === fechaKey(new Date())
                      return (
                        <th key={i} className={`px-2 py-3 text-center text-xs font-bold uppercase ${esHoy ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}>
                          <div>{DIAS[i]}</div>
                          <div className="font-normal text-gray-400">{formatFecha(dia)}</div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {empleados.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{emp.avatar}</span>
                          <span className="text-sm font-semibold text-gray-800 truncate max-w-20">{emp.nombre}</span>
                        </div>
                      </td>
                      {diasSemana.map((dia, i) => {
                        const turno = getTurno(emp.id, dia)
                        const t = turno ? TURNOS[turno] : null
                        return (
                          <td key={i} className="px-2 py-3 text-center">
                            {t ? (
                              <span className="text-lg" title={t.label}>{t.emoji}</span>
                            ) : (
                              <span className="text-gray-200">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-4">
              {Object.entries(TURNOS).map(([key, t]) => (
                <div key={key} className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{t.emoji}</span>
                  <span>{t.label} ({t.hora})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISTA ASIGNAR */}
      {vista === 'asignar' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSemanaOffset(s => s - 1)} className="bg-gray-100 px-3 py-2 rounded-xl font-bold hover:bg-gray-200">◀</button>
            <span className="font-bold text-gray-700">
              Semana: {formatFecha(lunes)} — {formatFecha(addDias(lunes, 6))}
            </span>
            <button onClick={() => setSemanaOffset(s => s + 1)} className="bg-gray-100 px-3 py-2 rounded-xl font-bold hover:bg-gray-200">▶</button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-32">Empleado</th>
                    {diasSemana.map((dia, i) => (
                      <th key={i} className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                        <div>{DIAS[i]}</div>
                        <div className="font-normal text-gray-400">{formatFecha(dia)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {empleados.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{emp.avatar}</span>
                          <span className="text-sm font-semibold text-gray-800 truncate max-w-20">{emp.nombre}</span>
                        </div>
                      </td>
                      {diasSemana.map((dia, i) => {
                        const turnoActual = getTurno(emp.id, dia)
                        return (
                          <td key={i} className="px-2 py-2 text-center">
                            <div className="flex flex-col gap-1">
                              {Object.entries(TURNOS).map(([key, t]) => (
                                <button
                                  key={key}
                                  onClick={() => asignarTurno(emp.id, dia, key)}
                                  className={`text-xs px-2 py-1 rounded-lg transition-all ${turnoActual === key ? 'text-white font-bold' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                  style={turnoActual === key ? { backgroundColor: t.color } : {}}
                                >
                                  {t.emoji}
                                </button>
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}