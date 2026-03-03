import { useAuth } from '../../hooks/useAuth'

export function PerfilPage() {
  const { user, profile } = useAuth()

  return (
    <div style={{ maxWidth: 600 }}>
      <h1>Mi perfil</h1>
      <p><strong>Email:</strong> {user?.email}</p>
      <p><strong>Nombre:</strong> {profile?.name || '–'}</p>
      <p><strong>Edad:</strong> {profile?.age ?? '–'}</p>
      <p><strong>Objetivo:</strong> {profile?.objective || '–'}</p>
    </div>
  )
}
