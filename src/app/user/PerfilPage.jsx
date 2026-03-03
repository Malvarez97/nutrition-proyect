import { useAuth } from '../../hooks/useAuth'
import './PerfilPage.css'

export function PerfilPage() {
  const { user, profile } = useAuth()

  const objectiveLabel =
    profile?.objective === 'weight_loss'
      ? 'Pérdida de peso'
      : profile?.objective === 'muscle_gain'
        ? 'Ganancia muscular'
        : profile?.objective === 'maintenance'
          ? 'Mantener peso'
          : profile?.objective || '–'

  return (
    <div className="page perfil-page">
      <h1 className="page-title">Mi perfil</h1>
      <div className="perfil-card card">
        <div className="perfil-grid">
          <div className="perfil-field">
            <span className="perfil-label">Email</span>
            <span className="perfil-value">{user?.email}</span>
          </div>
          <div className="perfil-field">
            <span className="perfil-label">Nombre</span>
            <span className="perfil-value">{profile?.name || '–'}</span>
          </div>
          <div className="perfil-field">
            <span className="perfil-label">Edad</span>
            <span className="perfil-value">{profile?.age ?? '–'}</span>
          </div>
          <div className="perfil-field">
            <span className="perfil-label">Objetivo</span>
            <span className="perfil-value">{objectiveLabel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
