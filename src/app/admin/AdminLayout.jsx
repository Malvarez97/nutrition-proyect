import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function AdminLayout() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()

  const navLinks = [
    { to: '/admin/pacientes', label: 'Pacientes', match: (p) => p === '/admin' || p.startsWith('/admin/pacientes') }
  ]

  const isActive = (link) => link.match(location.pathname)

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/admin/pacientes" className="brand">Admin</Link>
        <nav>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${isActive(link) ? 'active' : ''}`}
            >
              {link.label}
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
