import { createContext, useContext, useState, useCallback } from 'react'
import { useTema } from '../context/TemaContext'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((mensaje, tipo = 'exito', duracion = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensaje, tipo }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duracion)
  }, [])

  const eliminar = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} eliminar={eliminar} />
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

function ToastContainer({ toasts, eliminar }) {
  const { modoOscuro } = useTema()

  const TIPOS = {
    exito: { emoji: '✅', bg: modoOscuro ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200', text: modoOscuro ? 'text-green-300' : 'text-green-800' },
    error: { emoji: '❌', bg: modoOscuro ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200', text: modoOscuro ? 'text-red-300' : 'text-red-800' },
    advertencia: { emoji: '⚠️', bg: modoOscuro ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-200', text: modoOscuro ? 'text-yellow-300' : 'text-yellow-800' },
    info: { emoji: 'ℹ️', bg: modoOscuro ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200', text: modoOscuro ? 'text-blue-300' : 'text-blue-800' },
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(t => {
        const tipo = TIPOS[t.tipo] || TIPOS.info
        return (
          <div key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg animate-slide-up ${tipo.bg}`}
          >
            <span className="text-lg flex-shrink-0">{tipo.emoji}</span>
            <p className={`text-sm font-semibold flex-1 ${tipo.text}`}>{t.mensaje}</p>
            <button onClick={() => eliminar(t.id)} className={`text-lg opacity-50 hover:opacity-100 flex-shrink-0 ${tipo.text}`}>×</button>
          </div>
        )
      })}
    </div>
  )
}