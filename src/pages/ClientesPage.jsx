import { useState, useEffect } from 'react'
import { clientesService } from '../services/api'
import { useTema } from '../context/TemaContext'
import { useToast } from '../components/Toast'
import { SkeletonTable } from '../components/Skeleton'

const NIVELES = {
  bronce: { color: '#cd7f32', emoji: '🥉', label: 'Bronce', descuento: 2 },
  plata: { color: '#9ca3af', emoji: '🥈', label: 'Plata', descuento: 5 },
  oro: { color: '#d97706', emoji: '🥇', label: 'Oro', descuento: 8 },
  platino: { color: '#7c3aed', emoji: '💎', label: 'Platino', descuento: 12 },
}

export default function ClientesPage() {
  const [cargando, setCargando] = useState(true)
  const { toast } = useToast()
  const { modoOscuro } = useTema()
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modalForm, setModalForm] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', nit: '', direccion: '' })

  useEffect(() => { cargarClientes() }, [])

  const cargarClientes = async () => {
    try {
      const r = await clientesService.obtenerTodos()
      setClientes(r.data || [])
    } catch (e) { console.log(e) }
    setCargando(false)
  }

  const abrirModal = (c = null) => {
    if (c) { setEditando(c); setForm({ nombre: c.nombre, telefono: c.telefono || '', email: c.email || '', nit: c.nit || '', direccion: c.direccion || '' }) }
    else { setEditando(null); setForm({ nombre: '', telefono: '', email: '', nit: '', direccion: '' }) }
    setModalForm(true)
  }

  const guardar = async () => {
    if (!form.nombre) return alert('Nombre requerido')
    try {
      if (editando) await clientesService.actualizar(editando.id, form)
      else await clientesService.crear(form)
      setModalForm(false)
      cargarClientes()
      toast(editando ? 'Cliente actualizado' : 'Cliente creado', 'exito')
    } catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const eliminar = async (c) => {
    if (!confirm(`¿Eliminar "${c.nombre}"?`)) return
    await clientesService.eliminar(c.id)
    cargarClientes()
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.telefono && c.telefono.includes(busqueda)) ||
    (c.nit && c.nit.includes(busqueda))
  )

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>👥 Clientes</h1>
          <p className={`text-sm mt-1 ${textSub}`}>{clientes.length} clientes registrados</p>
        </div>
        <button onClick={() => abrirModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">+ Nuevo Cliente</button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(NIVELES).map(([key, n]) => (
          <div key={key} className={`${card} p-4 text-center hover:scale-105 transition-all`}>
            <div className="text-2xl mb-1">{n.emoji}</div>
            <div className="text-xl font-black" style={{ color: n.color }}>{clientes.filter(c => c.nivel === key).length}</div>
            <div className={`text-xs ${textSub}`}>{n.label}</div>
          </div>
        ))}
      </div>

      {/* TABLA */}
      {cargando ? (
        <SkeletonTable filas={5} modoOscuro={modoOscuro} />
      ) : (
        <div className={`${card} overflow-hidden`}>
          <div className={`p-4 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, teléfono o NIT..."
              className={`w-full px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200'}`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                <tr>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-left">NIT</th>
                  <th className="px-4 py-3 text-center">Nivel</th>
                  <th className="px-4 py-3 text-center">Puntos</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {clientesFiltrados.map(c => {
                  const nivel = NIVELES[c.nivel] || NIVELES.bronce
                  return (
                    <tr key={c.id} onClick={() => setModalDetalle(c)}
                      className={`transition-colors cursor-pointer ${modoOscuro ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: nivel.color + '22' }}>
                            {nivel.emoji}
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${text}`}>{c.nombre}</div>
                            {c.email && <div className={`text-xs ${textSub}`}>{c.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-sm ${textSub}`}>{c.telefono || '—'}</td>
                      <td className={`px-4 py-3 text-sm ${textSub}`}>{c.nit || 'CF'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: nivel.color + '22', color: nivel.color }}>
                          {nivel.emoji} {nivel.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-black text-purple-500">{c.puntos_acumulados || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => abrirModal(c)} className={`p-1.5 rounded-lg ${modoOscuro ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}>✏️</button>
                          <button onClick={() => eliminar(c)} className={`p-1.5 rounded-lg ${modoOscuro ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-red-50 text-red-600'}`}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {clientesFiltrados.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">👥</div>
                <p className={textSub}>No se encontraron clientes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-black ${text}`}>{modalDetalle.nombre}</h2>
              <button onClick={() => setModalDetalle(null)} className={`w-8 h-8 rounded-xl ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>✕</button>
            </div>
            {[
              { label: 'Teléfono', val: modalDetalle.telefono || '—' },
              { label: 'Email', val: modalDetalle.email || '—' },
              { label: 'NIT', val: modalDetalle.nit || 'CF' },
              { label: 'Dirección', val: modalDetalle.direccion || '—' },
              { label: 'Nivel', val: `${NIVELES[modalDetalle.nivel]?.emoji || '🥉'} ${NIVELES[modalDetalle.nivel]?.label || 'Bronce'}` },
              { label: 'Puntos', val: modalDetalle.puntos_acumulados || 0 },
            ].map(({ label, val }) => (
              <div key={label} className={`flex justify-between py-2 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={`text-sm ${textSub}`}>{label}</span>
                <span className={`text-sm font-bold ${text}`}>{val}</span>
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setModalDetalle(null); abrirModal(modalDetalle) }} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm">✏️ Editar</button>
              <button onClick={() => setModalDetalle(null)} className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-black mb-4 ${text}`}>{editando ? '✏️ Editar Cliente' : '👥 Nuevo Cliente'}</h2>
            <div className="space-y-3">
              {[
                { key: 'nombre', placeholder: 'Nombre completo *' },
                { key: 'telefono', placeholder: 'Teléfono' },
                { key: 'email', placeholder: 'Email', type: 'email' },
                { key: 'nit', placeholder: 'NIT (CF si no tiene)' },
                { key: 'direccion', placeholder: 'Dirección' },
              ].map(f => (
                <input key={f.key} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                  placeholder={f.placeholder} type={f.type || 'text'} className={inputCls} />
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setModalForm(false)} className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cancelar</button>
              <button onClick={guardar} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}