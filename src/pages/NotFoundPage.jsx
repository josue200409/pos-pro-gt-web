import { useNavigate } from 'react-router-dom'
import { useTema } from '../context/TemaContext'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const { modoOscuro } = useTema()

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${modoOscuro ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className={`text-6xl font-black mb-4 ${modoOscuro ? 'text-white' : 'text-gray-800'}`}>404</h1>
        <h2 className={`text-xl font-bold mb-3 ${modoOscuro ? 'text-gray-300' : 'text-gray-600'}`}>Página no encontrada</h2>
        <p className={`text-sm mb-8 ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
          La página que buscas no existe o fue movida.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className={`px-6 py-3 rounded-xl font-bold text-sm border transition-all ${modoOscuro ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
          >
            ← Volver
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all"
          >
            🏠 Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}