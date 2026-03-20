import { useTema } from '../context/TemaContext'

export default function Paginacion({ total, porPagina, paginaActual, onCambiar }) {
  const { modoOscuro } = useTema()
  const totalPaginas = Math.ceil(total / porPagina)
  if (totalPaginas <= 1) return null

  const paginas = []
  const inicio = Math.max(1, paginaActual - 2)
  const fin = Math.min(totalPaginas, paginaActual + 2)

  for (let i = inicio; i <= fin; i++) paginas.push(i)

  const btn = `w-9 h-9 rounded-xl text-sm font-bold transition-all`
  const btnActivo = `bg-blue-600 text-white shadow-md`
  const btnInactivo = modoOscuro ? `bg-gray-700 text-gray-300 hover:bg-gray-600` : `bg-white text-gray-600 hover:bg-gray-100 border border-gray-200`

  return (
    <div className={`flex items-center justify-between p-4 border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
      <span className={`text-xs ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
        Mostrando {Math.min((paginaActual - 1) * porPagina + 1, total)}–{Math.min(paginaActual * porPagina, total)} de {total}
      </span>
      <div className="flex gap-1">
        <button onClick={() => onCambiar(1)} disabled={paginaActual === 1}
          className={`${btn} ${paginaActual === 1 ? 'opacity-30 cursor-not-allowed ' + btnInactivo : btnInactivo}`}>«</button>
        <button onClick={() => onCambiar(paginaActual - 1)} disabled={paginaActual === 1}
          className={`${btn} ${paginaActual === 1 ? 'opacity-30 cursor-not-allowed ' + btnInactivo : btnInactivo}`}>‹</button>
        {paginas.map(p => (
          <button key={p} onClick={() => onCambiar(p)}
            className={`${btn} ${p === paginaActual ? btnActivo : btnInactivo}`}>{p}</button>
        ))}
        <button onClick={() => onCambiar(paginaActual + 1)} disabled={paginaActual === totalPaginas}
          className={`${btn} ${paginaActual === totalPaginas ? 'opacity-30 cursor-not-allowed ' + btnInactivo : btnInactivo}`}>›</button>
        <button onClick={() => onCambiar(totalPaginas)} disabled={paginaActual === totalPaginas}
          className={`${btn} ${paginaActual === totalPaginas ? 'opacity-30 cursor-not-allowed ' + btnInactivo : btnInactivo}`}>»</button>
      </div>
    </div>
  )
}