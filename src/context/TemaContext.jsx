import { createContext, useContext, useState, useEffect } from 'react'

const TemaContext = createContext(null)

export function TemaProvider({ children }) {
  const [modoOscuro, setModoOscuro] = useState(() => {
    return localStorage.getItem('tema') === 'oscuro'
  })

  useEffect(() => {
    localStorage.setItem('tema', modoOscuro ? 'oscuro' : 'claro')
    if (modoOscuro) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [modoOscuro])

  const toggleTema = () => setModoOscuro(prev => !prev)

  return (
    <TemaContext.Provider value={{ modoOscuro, toggleTema }}>
      {children}
    </TemaContext.Provider>
  )
}

export const useTema = () => useContext(TemaContext)