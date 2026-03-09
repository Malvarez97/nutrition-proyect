import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { SnackbarProvider } from './contexts/SnackbarContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './app/HomePage'
import { LoginPage } from './app/auth/LoginPage'
import { UserLayout } from './app/user/UserLayout'
import { DashboardPage } from './app/user/DashboardPage'
import { SeguimientoPage } from './app/user/SeguimientoPage'
import { ControlPage } from './app/user/ControlPage'
import { PerfilPage } from './app/user/PerfilPage'
import { AdminLayout } from './app/admin/AdminLayout'
import { AdminPatientsPage } from './app/admin/AdminPatientsPage'
import { AdminPatientDetailPage } from './app/admin/AdminPatientDetailPage'
import { AdminPlansPage } from './app/admin/AdminPlansPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SnackbarProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="seguimiento" element={<SeguimientoPage />} />
            <Route path="control" element={<ControlPage />} />
            <Route path="diario" element={<Navigate to="/app" replace />} />
            <Route path="perfil" element={<PerfilPage />} />
          </Route>
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="professional">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminPatientsPage />} />
            <Route path="pacientes" element={<AdminPatientsPage />} />
            <Route path="pacientes/:id" element={<AdminPatientDetailPage />} />
            <Route path="planes" element={<AdminPlansPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </SnackbarProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
