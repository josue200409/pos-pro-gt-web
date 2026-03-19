import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/TemaContext'
import { perfilService } from '../services/api'
import SubirFoto from '../components/SubirFoto'

export default function PerfilPage() {
  const { usuario, login } = useAuth()
  const { modoOscuro } = useTema()
  const [tab, setTab] = useState('perfil')
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    foto_url: usuario?.foto_url || '',
  })
  const [passwords, setPasswords] = useState({
    password_actual: '',
    password_nuevo: '',
    password_confirmar: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
  const card = `rounded-2xl border ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
  const text = modoOscuro ? 'text-white' : 'text-gray-800'
  const textSub = modoOscuro ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${modoOscuro ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200'}`

  const guardarPerfil = async () => {
    if (!form.nombre) return alert('El nombre es requerido')
    setGuardando(true)
    try {
      const r = await perfilService.actualizar(form)
      // Actualizar localStorage
      const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}')
      const usuarioActualizado = { ...usuarioActual, nombre: r.data.nombre, foto_url: r.data.foto_url }
      localStorage.setItem('usuario', JSON.stringify(usuarioActualizado))
      setMensaje({ tipo: 'exito', texto: '✅ Perfil actualizado correctamente' })
      setTimeout(() => setMensaje(null), 3000)
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.response?.data?.error || 'Error al guardar' })
    }
    setGuardando(false)
  }

  const cambiarPassword = async () => {
    if (!passwords.password_actual || !passwords.password_nuevo) return alert('Completa todos los campos')
    if (passwords.password_nuevo !== passwords.password_confirmar) return alert('Las contraseñas no coinciden')
    if (passwords.password_nuevo.length < 6) return alert('La contraseña debe tener al menos 6 caracteres')
    setGuardando(true)
    try {
      await perfilService.cambiarPassword({
        password_actual: passwords.password_actual,
        password_nuevo: passwords.password_nuevo,
      })
      setPasswords({ password_actual: '', password_nuevo: '', password_confirmar: '' })
      setMensaje({ tipo: 'exito', texto: '✅ Contraseña actualizada correctamente' })
      setTimeout(() => setMensaje(null), 3000)
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.response?.data?.error || 'Error al cambiar contraseña' })
    }
    setGuardando(false)
  }

  return (
    <div className={`p-6 ${bg} min-h-full`}>
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-4xl shadow-lg ${modoOscuro ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {usuario?.foto_url ? (
            <img src={usuario.foto_url} alt={usuario.nombre} className="w-full h-full object-cover" />
          ) : (
            usuario?.rol === 'admin' ? '👑' : '👤'
          )}
        </div>
        <div>
          <h1 className={`text-2xl font-black ${text}`}>{usuario?.nombre}</h1>
          <p className={`text-sm ${textSub}`}>{usuario?.email}</p>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${usuario?.rol === 'admin' ? 'bg-yellow-100 text-yellow-700' : modoOscuro ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {usuario?.rol === 'admin' ? '👑 Administrador' : '👤 Empleado'}
          </span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'perfil', label: '👤 Mi Perfil' },
          { id: 'password', label: '🔑 Contraseña' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-md' : modoOscuro ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-white text-gray-500 border border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* MENSAJE */}
      {mensaje && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-bold ${mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mensaje.texto}
        </div>
      )}

      {/* PERFIL */}
      {tab === 'perfil' && (
        <div className={`${card} p-6 max-w-lg`}>
          <h2 className={`font-black mb-4 ${text}`}>Información Personal</h2>

          <div className="space-y-4">
            <div>
              <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Nombre completo</label>
              <input
                value={form.nombre}
                onChange={e => setForm({...form, nombre: e.target.value})}
                placeholder="Tu nombre"
                className={inputCls}
              />
            </div>

          <div>
  <label className={`text-xs font-bold uppercase mb-2 block ${textSub}`}>Foto de perfil</label>
  <div className="flex items-center gap-4">
    <SubirFoto
      fotoActual={form.foto_url}
      onFotoSubida={(url) => setForm({...form, foto_url: url})}
      label="Mi foto"
      size="lg"
    />
    <div className="flex-1">
      <p className={`text-xs ${textSub} mb-2`}>Sube una foto desde tu dispositivo o ingresa una URL</p>
      <input
        value={form.foto_url}
        onChange={e => setForm({...form, foto_url: e.target.value})}
        placeholder="https://... (opcional)"
        className={inputCls}
      />
    </div>
  </div>
</div>

            <div>
              <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Email</label>
              <input value={usuario?.email || ''} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
              <p className={`text-xs mt-1 ${textSub}`}>El email no se puede cambiar</p>
            </div>

            <div>
              <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Rol</label>
              <input value={usuario?.rol === 'admin' ? '👑 Administrador' : '👤 Empleado'} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
            </div>
          </div>

          <button
            onClick={guardarPerfil}
            disabled={guardando}
            className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all"
          >
            {guardando ? '⏳ Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      )}

      {/* PASSWORD */}
      {tab === 'password' && (
        <div className={`${card} p-6 max-w-lg`}>
          <h2 className={`font-black mb-4 ${text}`}>Cambiar Contraseña</h2>

          <div className="space-y-4">
            <div>
              <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Contraseña actual</label>
              <input
                type="password"
                value={passwords.password_actual}
                onChange={e => setPasswords({...passwords, password_actual: e.target.value})}
                placeholder="Tu contraseña actual"
                className={inputCls}
              />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Nueva contraseña</label>
              <input
                type="password"
                value={passwords.password_nuevo}
                onChange={e => setPasswords({...passwords, password_nuevo: e.target.value})}
                placeholder="Mínimo 6 caracteres"
                className={inputCls}
              />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase mb-1 block ${textSub}`}>Confirmar nueva contraseña</label>
              <input
                type="password"
                value={passwords.password_confirmar}
                onChange={e => setPasswords({...passwords, password_confirmar: e.target.value})}
                placeholder="Repite la nueva contraseña"
                className={inputCls}
              />
            </div>
          </div>

          {passwords.password_nuevo && passwords.password_confirmar && (
            <div className={`mt-3 p-3 rounded-xl text-xs font-bold ${passwords.password_nuevo === passwords.password_confirmar ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {passwords.password_nuevo === passwords.password_confirmar ? '✅ Las contraseñas coinciden' : '❌ Las contraseñas no coinciden'}
            </div>
          )}

          <button
            onClick={cambiarPassword}
            disabled={guardando}
            className="mt-6 w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:opacity-50 shadow-md transition-all"
          >
            {guardando ? '⏳ Cambiando...' : '🔑 Cambiar Contraseña'}
          </button>
        </div>
      )}
    </div>
  )
}