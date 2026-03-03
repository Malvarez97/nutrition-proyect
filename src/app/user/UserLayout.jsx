import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function UserLayout() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()

  const navLinks = [
    { to: '/app', label: 'Panel' },
    { to: '/app/perfil', label: 'Perfil' }
  ]

  const isActive = (to) =>
    location.pathname === to || (to !== '/app' && location.pathname.startsWith(to))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/app" style={{ fontWeight: 600, color: '#007A8A' }}>Luu</Link>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} style={{ color: isActive(to) ? '#007A8A' : '#666' }}>{label}</Link>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{profile?.name || user?.email}</span>
          <button onClick={signOut} style={{ padding: '0.4rem 0.8rem' }}>Salir</button>
        </div>
      </header>
      <main style={{ flex: 1, padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
