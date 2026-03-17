import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './HomePage.css'

export function HomePage() {
  const { isAuthenticated, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="home" style={{ padding: '2rem', textAlign: 'center' }}>
        Cargando...
      </div>
    )
  }

  if (isAuthenticated && profile?.role === 'admin') {
    return <Navigate to="/admin/pacientes" replace />
  }

  return (
    <div className="home">
      {isAuthenticated ? (
        <>
          <div className="home-welcome">
            <h1>
              Hola{profile?.name ? `, ${profile.name}` : ''}
            </h1>
            <p>Tu panel de nutrición te espera.</p>
          </div>
          <div className="home-actions">
            <Link to="/app" className="home-btn home-btn-primary">
              Ir a la app
            </Link>
            {(profile?.role === 'professional' || profile?.role === 'admin') && (
              <Link to="/admin/pacientes" className="home-btn home-btn-secondary">
                Panel admin
              </Link>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="home-brand-wrap">
            <img src="/logo.png" alt="LE Nutrición" className="home-logo" />
            <h1 className="home-brand">
              LE <span className="home-brand-accent">Nutrición</span>
            </h1>
          </div>
          <div className="home-actions">
            <Link to="/auth/login" className="home-btn home-btn-primary">
              Iniciar sesión
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
