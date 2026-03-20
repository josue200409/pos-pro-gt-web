import { useState, useEffect } from 'react'
import { usuariosService, configuracionService } from '../services/api'
import { useTema } from '../context/TemaContext'
import { useToast } from '../components/Toast'
import SubirFoto from '../components/SubirFoto'

export default function AdminPage() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'empleado', foto_url: '' })
  const { toast } = useToast()
  const { modoOscuro } = useTema()
  const [usuarios, setUsuarios] = useState([])
  const [config, setConfig] = useState({})
  const [modalUsuario, setModalUsuario] = useState(false)
  const [guardandoConfig, setGuardandoConfig] = useState(false)
  const [tab, setTab] = useState('usuarios')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [u, c] = await Promise.all([
        usuariosService.listar(),
        configuracionService.obtener()
      ])
      setUsuarios(u.data || [])
      setConfig(c.data || {})
    } catch (e) { console.log(e) }
  }

  const crearUsuario = async () => {
    if (!form.nombre || !form.email || !form.password) return alert('Todos los campos son requeridos')
    try {
      await usuariosService.crear(form)
      setModalUsuario(false)
      setForm({ nombre: '', email: '', password: '', rol: 'empleado', foto_url: '' })
      cargarDatos()
      toast('Usuario creado correctamente', 'exito')
    } catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const toggleActivo = async (u) => {
    await usuariosService.toggleActivo(u.id)
    cargarDatos()
  }

  const eliminar = async (u) => {
    if (!confirm(`¿Eliminar permanentemente a "${u.nombre}"?`)) return
    await usuariosService.eliminar(u.id)
    cargarDatos()
  }

  const guardarConfig = async () => {
    setGuardandoConfig(true)
    try {
      await configuracionService.actualizar(config)
      toast('Configuración guardada correctamente', 'exito')
    } catch { toast('Error al guardar configuración', 'error') }
    setGuardandoConfig(false)
  }

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black ${text}`}>⚙️ Administración</h1>
          <p className={`text-sm mt-1 ${textSub}`}>Gestión de usuarios y configuración</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'usuarios', label: '👥 Usuarios' },
          { id: 'config', label: '🏪 Configuración' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-md' : modoOscuro ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-white text-gray-500 border border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* USUARIOS */}
      {tab === 'usuarios' && (
        <div className={`${card} overflow-hidden`}>
          <div className={`p-4 border-b flex items-center justify-between ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`font-bold ${text}`}>Usuarios ({usuarios.length})</h2>
            <button onClick={() => setModalUsuario(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md">+ Nuevo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`text-xs font-bold uppercase ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                <tr>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-center">Rol</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-left">Último acceso</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {usuarios.map(u => (
                  <tr key={u.id} className={`transition-colors ${modoOscuro ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center text-lg ${u.rol === 'admin' ? (modoOscuro ? 'bg-yellow-900' : 'bg-yellow-50') : (modoOscuro ? 'bg-gray-700' : 'bg-gray-100')}`}>
                          {u.foto_url ? (
                            <img src={u.foto_url} alt={u.nombre} className="w-full h-full object-cover" />
                          ) : u.rol === 'admin' ? '👑' : '👤'}
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${text}`}>{u.nombre}</div>
                          <div className={`text-xs ${textSub}`}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.rol === 'admin' ? 'bg-yellow-100 text-yellow-700' : modoOscuro ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {u.rol === 'admin' ? '👑 Admin' : '👤 Empleado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.activo ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {u.activo ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${textSub}`}>
                      {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-GT') : 'Nunca'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => toggleActivo(u)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg ${u.activo ? (modoOscuro ? 'bg-gray-700 text-orange-400' : 'bg-orange-50 text-orange-600') : (modoOscuro ? 'bg-gray-700 text-green-400' : 'bg-green-50 text-green-600')}`}>
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => eliminar(u)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg ${modoOscuro ? 'bg-gray-700 text-red-400' : 'bg-red-50 text-red-600'}`}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIGURACION */}
      {tab === 'config' && (
        <div className="space-y-4">
          <div className={`${card} p-6`}>
            <h2 className={`font-black text-lg mb-1 ${text}`}>🏪 Datos de la Empresa</h2>
            <p className={`text-xs mb-5 ${textSub}`}>Esta información aparece en tus tickets y facturas</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { key: 'empresa_nombre', label: 'Nombre de la empresa', placeholder: 'Mi Negocio GT' },
                { key: 'empresa_nit', label: 'NIT', placeholder: 'CF o tu NIT' },
                { key: 'empresa_telefono', label: 'Teléfono', placeholder: '4444-5555' },
                { key: 'empresa_direccion', label: 'Dirección', placeholder: 'Zona 1, Ciudad de Guatemala' },
                { key: 'empresa_serie_factura', label: 'Serie de factura', placeholder: 'A' },
                { key: 'empresa_email', label: 'Email', placeholder: 'negocio@gmail.com' },
              ].map(f => (
                <div key={f.key}>
                  <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>{f.label}</label>
                  <input value={config[f.key] || ''} onChange={e => setConfig({...config, [f.key]: e.target.value})}
                    placeholder={f.placeholder} className={inputCls} />
                </div>
              ))}
            </div>

            {/* PREVIEW TICKET */}
            <div className={`p-4 rounded-xl mb-5 border ${modoOscuro ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-xs font-bold uppercase mb-3 ${textSub}`}>👀 Preview del ticket</p>
              <div className="font-mono text-xs space-y-0.5 text-center">
                <p className={`font-black text-sm ${text}`}>{config.empresa_nombre || 'Mi Negocio'}</p>
                {config.empresa_direccion && <p className={textSub}>{config.empresa_direccion}</p>}
                {config.empresa_telefono && <p className={textSub}>Tel: {config.empresa_telefono}</p>}
                <p className={textSub}>NIT: {config.empresa_nit || 'CF'}</p>
                <p className={`${textSub} mt-1`}>--------------------------------</p>
                <p className={textSub}>Fecha: {new Date().toLocaleString('es-GT')}</p>
                <p className={`${textSub}`}>--------------------------------</p>
                <p className={`font-black ${text}`}>TOTAL: Q0.00</p>
                <p className={`${textSub} mt-1`}>¡Gracias por su compra!</p>
              </div>
            </div>

            <button onClick={guardarConfig} disabled={guardandoConfig}
              className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 shadow-md transition-all">
              {guardandoConfig ? '⏳ Guardando...' : '💾 Guardar Configuración'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL USUARIO */}
      {modalUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up ${modoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-black mb-4 ${text}`}>👤 Nuevo Usuario</h2>
            <div className="space-y-3">
              <div className="flex justify-center mb-3">
                <SubirFoto fotoActual={form.foto_url} onFotoSubida={(url) => setForm({...form, foto_url: url})}
                  label="Foto empleado" size="md" />
              </div>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                placeholder="Nombre completo" className={inputCls} />
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                placeholder="Email" type="email" className={inputCls} />
              <input value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                placeholder="Contraseña" type="password" className={inputCls} />
              <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} className={inputCls}>
                <option value="empleado">👤 Empleado</option>
                <option value="admin">👑 Administrador</option>
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setModalUsuario(false)}
                className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}>Cancelar</button>
              <button onClick={crearUsuario}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md">Crear Usuario</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}