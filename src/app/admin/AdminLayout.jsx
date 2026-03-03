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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/admin" style={{ fontWeight: 600, color: '#007A8A' }}>Admin</Link>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} style={{ color: isActive(to) ? '#007A8A' : '#666' }}>{label}</Link>
          ))}
        </nav>
        <Link to="/app" style={{ marginRight: '1rem' }}>App</Link>
        <span>{profile?.name || user?.email}</span>
        <button onClick={signOut} style={{ padding: '0.4rem 0.8rem' }}>Salir</button>
      </header>
      <main style={{ flex: 1, padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
