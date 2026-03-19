import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TemaProvider } from './context/TemaContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import Layout from './components/Layout'
import POSPage from './pages/POSPage'
import InventarioPage from './pages/InventarioPage'
import VentasPage from './pages/VentasPage'
import ClientesPage from './pages/ClientesPage'
import CajaPage from './pages/CajaPage'
import ReportesPage from './pages/ReportesPage'
import AdminPage from './pages/AdminPage'
import ProveedoresPage from './pages/ProveedoresPage'
import SucursalesPage from './pages/SucursalesPage'
import BarcodesPage from './pages/BarcodesPage'
import MermasPage from './pages/MermasPage'
import TurnosPage from './pages/TurnosPage'
import SeguridadPage from './pages/SeguridadPage'
import IAPage from './pages/IAPage'
import PerfilPage from './pages/PerfilPage'

function RutaProtegida({ children, soloAdmin = false }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!usuario) return <Navigate to="/login" />
  if (soloAdmin && usuario.rol !== 'admin') return <Navigate to="/" />
  return children
}

function AppRoutes() {
  const { usuario } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={!usuario ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route index element={<DashboardPage />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="ventas" element={<VentasPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="caja" element={<CajaPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="admin" element={<RutaProtegida soloAdmin><AdminPage /></RutaProtegida>} />
        <Route path="proveedores" element={<ProveedoresPage />} />
        <Route path="sucursales" element={<RutaProtegida soloAdmin><SucursalesPage /></RutaProtegida>} />
        <Route path="barcodes" element={<BarcodesPage />} />
        <Route path="mermas" element={<MermasPage />} />
        <Route path="turnos" element={<TurnosPage />} />
        <Route path="seguridad" element={<RutaProtegida soloAdmin><SeguridadPage /></RutaProtegida>} />
        <Route path="ia" element={<IAPage />} />
        <Route path="perfil" element={<PerfilPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <TemaProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TemaProvider>
  )
}