import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { professionalService } from '../../services/professional'
import './AdminPatients.css'

function isAuthError(err) {
  const msg = (err?.message || '').toLowerCase()
  return (
    msg.includes('refresh token') ||
    (msg.includes('invalid') && msg.includes('token')) ||
    err?.name === 'AuthApiError'
  )
}

export function AdminPatientsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    setError(null)
    professionalService
      .getAllPatients(user.id)
      .then((data) => {
        setPatients(data || [])
        setError(null)
      })
      .catch((err) => {
        console.error(err)
        if (isAuthError(err)) {
          signOut()
          navigate('/auth/login', { replace: true, state: { from: { pathname: '/admin/pacientes' } } })
          return
        }
        setError(err.message || 'Error al cargar pacientes')
      })
      .finally(() => setLoading(false))
  }, [user?.id, signOut, navigate])

  const filtered = patients.filter((p) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    const name = (p.name || '').toLowerCase()
    const email = (p.email || '').toLowerCase()
    return name.includes(q) || email.includes(q)
  })

  const sorted = [...filtered].sort((a, b) =>
    (a.name || a.email || '').localeCompare(b.name || b.email || '', 'es')
  )

  if (loading) return <div className="admin-loading">Cargando pacientes...</div>

  if (error) {
    return (
      <div className="admin-empty">
        <h2>Error</h2>
        <p>{error}</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    )
  }

  if (patients.length === 0) {
    return (
      <div className="admin-empty">
        <h2>Sin pacientes</h2>
        <p>
          No hay usuarios con rol &quot;user&quot; en el sistema. Podés dar de alta el primero desde Nuevo paciente.
        </p>
        <div className="admin-empty-actions">
          <Link to="/admin/pacientes/nuevo" className="btn btn-primary btn-nuevo-paciente">
            <span className="btn-nuevo-paciente-icon" aria-hidden>+</span>
            Nuevo paciente
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-patients">
      <header className="admin-page-header admin-patients-header">
        <div>
          <h1>Pacientes</h1>
          <Link to="/admin/pacientes/nuevo" className="btn btn-primary btn-nuevo-paciente">
            <span className="btn-nuevo-paciente-icon" aria-hidden>+</span>
            Nuevo paciente
          </Link>
        </div>
      </header>

      <div className="patients-search-wrap">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="patients-search-input"
          aria-label="Buscar pacientes por nombre o email"
        />
      </div>

      <div className="patients-cards">
        {sorted.map((p) => (
          <Link to={`/admin/pacientes/${p.id}`} key={p.id} className="patient-card">
            <span className="patient-card-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </span>
            <div className="patient-card-body">
              <div className="patient-card-main">
                <span className="patient-card-name">{p.name || p.email || 'Sin nombre'}</span>
                <span className={`patient-card-compliance compliance-${p.status}`}>{p.compliance}%</span>
              </div>
              <div className="patient-card-meta">
                {p.age != null && <span>{p.age} años</span>}
                {p.weight != null && <span>{p.weight} kg</span>}
                <span>{p.objective === 'weight_loss' ? 'Pérdida peso' : p.objective === 'muscle_gain' ? 'Ganancia muscular' : p.objective || '–'}</span>
              </div>
              {p.notes && (
                <p className="patient-card-notes">{(p.notes || '').slice(0, 50)}{(p.notes || '').length > 50 ? '…' : ''}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="patients-no-results">
          {searchQuery.trim() ? 'Ningún paciente coincide con la búsqueda.' : 'No hay pacientes.'}
        </p>
      )}
    </div>
  )
}
