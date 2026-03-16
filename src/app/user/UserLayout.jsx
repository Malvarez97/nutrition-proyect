import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/app', label: 'Panel', icon: 'panel' },
  { to: '/app/seguimiento', label: 'Seguimiento', icon: 'seguimiento' },
  { to: '/app/control', label: 'Control', icon: 'control' },
  { to: '/app/perfil', label: 'Perfil', icon: 'perfil' }
]

function NavIcon({ name, active }) {
  const c = active ? 'var(--color-accent)' : 'var(--color-text-secondary)'
  const common = { width: 24, height: 24, fill: 'none', stroke: c, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'panel':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      )
    case 'seguimiento':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    case 'control':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    case 'perfil':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    default:
      return null
  }
}

export function UserLayout() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()

  if (profile?.role === 'admin') {
    return <Navigate to="/admin/pacientes" replace state={{ from: location }} />
  }

  const isActive = (to) =>
    location.pathname === to || (to !== '/app' && location.pathname.startsWith(to))

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/app" className="brand brand-with-logo brand-desktop">
          <img src="/logo-header.png" alt="Ludimila Eyeralde Nutrición" className="brand-logo" />
        </Link>
        <div className="app-header-mobile-center">
          <Link to="/app" className="brand brand-with-logo">
            <img src="/logo-header.png" alt="Ludimila Eyeralde Nutrición" className="brand-logo" />
          </Link>
        </div>
        <nav className="app-header-nav">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${isActive(to) ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="spacer" />
        <span className="user-info app-header-user">{profile?.name || user?.email}</span>
        <button onClick={signOut} className="btn-signout">
          Salir
        </button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <Link to="/app" className={`app-footer-item ${isActive('/app') ? 'active' : ''}`}>
          <NavIcon name="panel" active={isActive('/app')} />
          <span>Panel</span>
        </Link>
        <Link to="/app/seguimiento" className={`app-footer-item ${isActive('/app/seguimiento') ? 'active' : ''}`}>
          <NavIcon name="seguimiento" active={isActive('/app/seguimiento')} />
          <span>Seguimiento</span>
        </Link>
        <Link to="/app/seguimiento?add=1" className="app-footer-fab" aria-label="Añadir comida">
          <span className="app-footer-fab-icon">+</span>
        </Link>
        <Link to="/app/control" className={`app-footer-item ${isActive('/app/control') ? 'active' : ''}`}>
          <NavIcon name="control" active={isActive('/app/control')} />
          <span>Control</span>
        </Link>
        <Link to="/app/perfil" className={`app-footer-item ${isActive('/app/perfil') ? 'active' : ''}`}>
          <NavIcon name="perfil" active={isActive('/app/perfil')} />
          <span>Perfil</span>
        </Link>
      </footer>
    </div>
  )
}
