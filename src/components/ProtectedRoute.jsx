import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Protege rutas que requieren autenticación.
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {'user' | 'admin' | null} props.requiredRole - Rol requerido (null = cualquier autenticado)
 */
export function ProtectedRoute({ children, requiredRole = null }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Cargando...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  const userRole = profile?.role || user.user_metadata?.role || 'user'

  if (requiredRole === 'admin' || requiredRole === 'professional') {
    const allowed = ['admin', 'professional'].includes(requiredRole)
    if (allowed && userRole !== 'admin' && userRole !== 'professional') {
      return <Navigate to="/app" replace />
    }
  }

  return children
}
