import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function AdminLayout() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()

  const navLinks = [
    { to: '/admin', label: 'Pacientes' },
    { to: '/admin/planes', label: 'Planes' }
  ]

  const isActive = (to) =>
    location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to))

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/admin" className="brand">Admin</Link>
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
        <Link to="/app" className="nav-link">App</Link>
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
