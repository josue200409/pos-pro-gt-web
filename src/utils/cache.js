const CACHE = new Map()

// TTL por defecto: 5 minutos
const TTL_DEFAULT = 5 * 60 * 1000

export const cache = {
  get: (key) => {
    const item = CACHE.get(key)
    if (!item) return null
    if (Date.now() > item.expira) {
      CACHE.delete(key)
      return null
    }
    return item.data
  },

  set: (key, data, ttl = TTL_DEFAULT) => {
    CACHE.set(key, { data, expira: Date.now() + ttl })
  },

  delete: (key) => CACHE.delete(key),

  clear: () => CACHE.clear(),

  // Invalida todas las keys que contengan el prefijo
  invalidar: (prefijo) => {
    for (const key of CACHE.keys()) {
      if (key.startsWith(prefijo)) CACHE.delete(key)
    }
  }
}

// Helper para cachear llamadas async
export const conCache = async (key, fn, ttl = TTL_DEFAULT) => {
  const cached = cache.get(key)
  if (cached !== null) return cached
  const resultado = await fn()
  cache.set(key, resultado, ttl)
  return resultado
}