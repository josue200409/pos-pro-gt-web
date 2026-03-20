import DOMPurify from 'dompurify'

// Sanitiza texto simple — elimina HTML y scripts maliciosos
export const sanitizarTexto = (texto) => {
  if (!texto || typeof texto !== 'string') return ''
  return DOMPurify.sanitize(texto, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
}

// Sanitiza un objeto — sanitiza todos sus valores string
export const sanitizarObjeto = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  const resultado = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') resultado[key] = sanitizarTexto(value)
    else resultado[key] = value
  }
  return resultado
}

// Sanitiza para mostrar en HTML — permite algunos tags seguros
export const sanitizarHTML = (html) => {
  if (!html || typeof html !== 'string') return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}