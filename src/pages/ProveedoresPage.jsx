import { useState, useEffect } from 'react'
import { proveedoresService } from '../services/api'
import { useTema } from '../context/TemaContext'

export default function ProveedoresPage() {
  const { modoOscuro } = useTema()
  const [proveedores, setProveedores] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modalForm, setModalForm] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', direccion: '', notas: '' })

  useEffect(() => { cargarProveedores() }, [])

  const cargarProveedores = async () => {
    try {
      const r = await proveedoresService.obtenerTodos()
      setProveedores(r.data || [])
    } catch (e) { console.log(e) }
  }

  const abrirModal = (p = null) => {
    if (p) { setEditando(p); setForm({ nombre: p.nombre, contacto: p.contacto || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '', notas: p.notas || '' }) }
    else { setEditando(null); setForm({ nombre: '', contacto: '', telefono: '', email: '', direccion: '', notas: '' }) }
    setModalForm(true)
  }

  const guardar = async () => {
    if (!form.nombre) return alert('Nombre requerido')
    try {
      if (editando) await proveedoresService.actualizar(editando.id, form)
      else await proveedoresService.crear(form)
      setModalForm(false)
      cargarProveedores()
    } catch (e) { alert(e.response?.data?.error || 'Error') }
  }

  const eliminar = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    await proveedoresService.eliminar(p.id)
    cargarProveedores()
  }

  const proveedoresFiltrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
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
          <h1 className={`text-2xl font-black ${text}`}>🏭 Proveedores</h1>
          <p className={`text-sm mt-1 ${textSub}`}>{proveedores.length} proveedores registrados</p>
        </div>
        <button onClick={() => abrirModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">+ Nuevo</button>
      </div>

      <div className={`${card} p-4 mb-4`}>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar proveedor..."
          className={`w-full px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200'}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proveedoresFiltrados.map(p => (
          <div key={p.id} className={`${card} p-5 hover:shadow-md transition-all cursor-pointer`} onClick={() => setModalDetalle(p)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${modoOscuro ? 'bg-gray-700' : 'bg-blue-50'}`}>🏭</div>
                <div>
                  <h3 className={`font-black text-sm ${text}`}>{p.nombre}</h3>
                  {p.contacto && <p className={`text-xs ${textSub}`}>{p.contacto}</p>}
                </div>
              </div>
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => abrirModal(p)} className={`p-1.5 rounded-lg ${modoOscuro ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}>✏️</button>
                <button onClick={() => eliminar(p)} className={`p-1.5 rounded-lg ${modoOscuro ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-red-50 text-red-600'}`}>🗑️</button>
              </div>
            </div>

            <div className="space-y-1">
              {p.telefono && <p className={`text-xs flex items-center gap-1 ${textSub}`}>📞 {p.telefono}</p>}
              {p.email && <p className={`text-xs flex items-center gap-1 ${textSub}`}>📧 {p.email}</p>}
              {p.direccion && <p className={`text-xs flex items-center gap-1 ${textSub}`}>📍 {p.direccion}</p>}
            </div>

            <div className={`flex gap-4 mt-3 pt-3 border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="text-center">
                <div className="text-sm font-black text-blue-500">{p.total_compras || 0}</div>
                <div className={`text-xs ${textSub}`}>Compras</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-black text-green-500">Q{parseFloat(p.total_gastado || 0).toFixed(0)}</div>
                <div className={`text-xs ${textSub}`}>Total</div>
              </div>
              {p.ultima_compra && (
                <div className="text-center">
                  <div className={`text-xs font-bold ${textSub}`}>{new Date(p.ultima_compra).toLocaleDateString('es-GT')}</div>
                  <div className={`text-xs ${textSub}`}>Última compra</div>
                </div>
              )}
            </div>
          </div>
        ))}
        {proveedoresFiltrados.length === 0 && (
          <div className={`col-span-3 ${card} p-12 text-center`}>
            <div className="text-4xl mb-2">🏭</div>
            <p className={textSub}>No se encontraron proveedores</p>
          </div>
        )}
      </div>

      {/* MODAL DETALLE */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-black ${text}`}>{modalDetalle.nombre}</h2>
              <button onClick={() => setModalDetalle(null)} className={`w-8 h-8 rounded-xl ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>✕</button>
            </div>
            {[
              { label: 'Contacto', val: modalDetalle.contacto || '—' },
              { label: 'Teléfono', val: modalDetalle.telefono || '—' },
              { label: 'Email', val: modalDetalle.email || '—' },
              { label: 'Dirección', val: modalDetalle.direccion || '—' },
              { label: 'Notas', val: modalDetalle.notas || '—' },
              { label: 'Total compras', val: modalDetalle.total_compras || 0 },
              { label: 'Total gastado', val: `Q${parseFloat(modalDetalle.total_gastado || 0).toFixed(2)}` },
            ].map(({ label, val }) => (
              <div key={label} className={`flex justify-between py-2 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={`text-sm ${textSub}`}>{label}</span>
                <span className={`text-sm font-bold ${text}`}>{val}</span>
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setModalDetalle(null); abrirModal(modalDetalle) }} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm">✏️ Editar</button>
              <button onClick={() => setModalDetalle(null)} className={`flex-1 py-2 rounded-xl border text-sm ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-black mb-4 ${text}`}>{editando ? '✏️ Editar' : '🏭 Nuevo Proveedor'}</h2>
            <div className="space-y-3">
              {[
                { key: 'nombre', placeholder: 'Nombre *' },
                { key: 'contacto', placeholder: 'Persona de contacto' },
                { key: 'telefono', placeholder: 'Teléfono' },
                { key: 'email', placeholder: 'Email' },
                { key: 'direccion', placeholder: 'Dirección' },
                { key: 'notas', placeholder: 'Notas' },
              ].map(f => (
                <input key={f.key} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} placeholder={f.placeholder} className={inputCls} />
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setModalForm(false)} className={`flex-1 py-2 rounded-xl border text-sm ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cancelar</button>
              <button onClick={guardar} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}