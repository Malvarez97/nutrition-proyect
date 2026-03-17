import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import './AdminLayout.css'

export function AdminLayout() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()

  const navLinks = [
    { to: '/admin/pacientes', label: 'Pacientes', match: (p) => p === '/admin' || p.startsWith('/admin/pacientes') }
  ]

  const isActive = (link) => link.match(location.pathname)

  return (
    <div className="app-layout admin-layout">
      <header className="app-header admin-header">
        <Link to="/admin/pacientes" className="admin-brand">
          <img src="/logo-header.png" alt="LE Nutrición" className="admin-brand-logo" />
        </Link>
        <nav className="admin-nav">
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
        <Link to="/app" className="nav-link admin-nav-app">App</Link>
        <div className="admin-header-profile">
          <button type="button" onClick={signOut} className="btn btn-sm btn-signout">
            Salir
          </button>
        </div>
      </header>
      <main className="app-main admin-main">
        <Outlet />
      </main>
    </div>
  )
}
