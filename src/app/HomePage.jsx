import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './HomePage.css'

export function HomePage() {
  const { isAuthenticated, profile } = useAuth()

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
            {profile?.role === 'professional' && (
              <Link to="/admin" className="home-btn home-btn-secondary">
                Panel profesional
              </Link>
            )}
          </div>
        </>
      ) : (
        <>
          <h1 className="home-brand">
            Ludimila <span className="home-brand-accent">Nutrición</span>
          </h1>
          <p className="home-subtitle">
            Seguimiento nutricional personalizado. Registra comidas, control semanal y feedback profesional.
          </p>
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
