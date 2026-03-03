import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function HomePage() {
  const { isAuthenticated, profile } = useAuth()

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>
        {isAuthenticated ? `Hola${profile?.name ? `, ${profile.name}` : ''}` : 'Ludimila Nutrición'}
      </h1>
      {isAuthenticated ? (
        <>
          <p>Tu panel de nutrición.</p>
          <Link to="/app" style={{ display: 'inline-block', margin: '0.5rem', padding: '0.6rem 1.2rem', background: '#007A8A', color: 'white', borderRadius: 12 }}>
            Ir a la app
          </Link>
          {profile?.role === 'professional' && (
            <Link to="/admin" style={{ display: 'inline-block', margin: '0.5rem', padding: '0.6rem 1.2rem', border: '1px solid #007A8A', color: '#007A8A', borderRadius: 12 }}>
              Panel profesional
            </Link>
          )}
        </>
      ) : (
        <Link to="/auth/login" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.2rem', background: '#007A8A', color: 'white', borderRadius: 12 }}>
          Iniciar sesión
        </Link>
      )}
    </div>
  )
}
