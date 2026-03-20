import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://pos-pro-gt-backend.onrender.com/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(
  async config => {
    try {
      const token = window.localStorage.getItem('token')
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch (e) {}
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response,
  error => {
    try {
      if (error.response?.status === 401) {
        window.localStorage.removeItem('token')
        window.localStorage.removeItem('usuario')
        window.location.href = '/login'
      }
    } catch (e) {}
    return Promise.reject(error)
  }
)

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
}

export const productosService = {
  historialPrecios: (id) => api.get(`/productos/${id}/historial-precios`),
  obtenerTodos: () => api.get('/productos'),
  crear: (data) => api.post('/productos', data),
  actualizar: (id, data) => api.put(`/productos/${id}`, data),
  eliminar: (id) => api.delete(`/productos/${id}`),
}

export const ventasService = {
  obtenerTodas: () => api.get('/ventas'),
  crear: (data) => api.post('/ventas', data),
  resumenHoy: () => api.get('/ventas/resumen/hoy'),
  resumenRango: (desde, hasta) => api.get(`/ventas/resumen/rango?desde=${desde}&hasta=${hasta}`),
  cancelar: (id, data) => api.put(`/ventas/${id}/cancelar`, data),
}

export const clientesService = {
  obtenerTodos: () => api.get('/clientes'),
  crear: (data) => api.post('/clientes', data),
  actualizar: (id, data) => api.put(`/clientes/${id}`, data),
  eliminar: (id) => api.delete(`/clientes/${id}`),
}

export const usuariosService = {
  listar: () => api.get('/auth/usuarios'),
  crear: (data) => api.post('/auth/crear-usuario', data),
  toggleActivo: (id) => api.put(`/auth/usuarios/${id}/toggle`),
  eliminar: (id) => api.delete(`/auth/usuarios/${id}`),
  cambiarPassword: (id, password) => api.put(`/auth/usuarios/${id}/password`, { password }),
}

export const cajaService = {
  obtenerHoy: () => api.get('/caja/hoy'),
  abrir: (data) => api.post('/caja/abrir', data),
  cerrar: (data) => api.post('/caja/cerrar', data),
  agregarGasto: (data) => api.post('/caja/gasto', data),
  eliminarGasto: (id) => api.delete(`/caja/gasto/${id}`),
  historial: () => api.get('/caja/historial'),
}

export const dashboardService = {
  obtener: () => api.get('/dashboard'),
}

export const proveedoresService = {
  obtenerTodos: () => api.get('/proveedores'),
  crear: (data) => api.post('/proveedores', data),
  actualizar: (id, data) => api.put(`/proveedores/${id}`, data),
  eliminar: (id) => api.delete(`/proveedores/${id}`),
  compras: (id) => api.get(`/proveedores/${id}/compras`),
  registrarCompra: (id, data) => api.post(`/proveedores/${id}/compra`, data),
  alertasStockBajo: () => api.get('/proveedores/alertas/stock-bajo'),
}

export const sucursalesService = {
  obtenerTodas: () => api.get('/sucursales'),
  crear: (data) => api.post('/sucursales', data),
  actualizar: (id, data) => api.put(`/sucursales/${id}`, data),
  eliminar: (id) => api.delete(`/sucursales/${id}`),
  reporte: (id, desde, hasta) => api.get(`/sucursales/${id}/reporte?desde=${desde}&hasta=${hasta}`),
}

export const monitorService = {
  health: () => api.get('/monitor/health'),
  stats: () => api.get('/monitor/stats'),
}
export const categoriasService = {
  obtenerTodas: () => api.get('/productos/categorias/todas'),
  crear: (data) => api.post('/productos/categorias', data),
  actualizar: (id, data) => api.put(`/productos/categorias/${id}`, data),
  eliminar: (id) => api.delete(`/productos/categorias/${id}`),
}

export const configuracionService = {
  obtener: () => api.get('/configuracion'),
  actualizar: (data) => api.put('/configuracion', data),
}

export const perfilService = {
  actualizar: (data) => api.put('/auth/perfil', data),
  cambiarPassword: (data) => api.put('/auth/cambiar-password', data),
}

export const inventarioService = {
  movimientos: () => api.get('/inventario/movimientos'),
  lotes: () => api.get('/inventario/lotes'),
  lotesAlertas: () => api.get('/inventario/lotes/alertas'),
  crearLote: (data) => api.post('/inventario/lotes', data),
  actualizarLote: (id, data) => api.put(`/inventario/lotes/${id}`, data),
  eliminarLote: (id) => api.delete(`/inventario/lotes/${id}`),
  promociones: () => api.get('/inventario/promociones'),
  promocionesActivas: () => api.get('/inventario/promociones/activas'),
  crearPromocion: (data) => api.post('/inventario/promociones', data),
  actualizarPromocion: (id, data) => api.put(`/inventario/promociones/${id}`, data),
  eliminarPromocion: (id) => api.delete(`/inventario/promociones/${id}`),
  importarExcel: (data) => api.post('/inventario/importar', data),
}

export default api