import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function UserLayout() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()

  const navLinks = [
    { to: '/app', label: 'Panel' },
    { to: '/app/seguimiento', label: 'Seguimiento' },
    { to: '/app/control', label: 'Control' },
    { to: '/app/perfil', label: 'Perfil' }
  ]

  const isActive = (to) =>
    location.pathname === to || (to !== '/app' && location.pathname.startsWith(to))

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/app" className="brand">Luu</Link>
        <nav>
          {navLinks.map(({ to, label }) => (
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
        <span className="user-info">{profile?.name || user?.email}</span>
        <button onClick={signOut} className="btn-signout">
          Salir
        </button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
