import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useSnackbar } from '../../contexts/SnackbarContext'
import { profilesService } from '../../services/profiles'
import './PerfilPage.css'

export function PerfilPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { showSuccess, showError } = useSnackbar()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [age, setAge] = useState(profile?.age != null ? String(profile.age) : '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(profile?.name ?? '')
    setAge(profile?.age != null ? String(profile.age) : '')
  }, [profile?.name, profile?.age])

  const startEditing = () => {
    setName(profile?.name ?? '')
    setAge(profile?.age != null ? String(profile.age) : '')
    setEditing(true)
  }

  const cancelEditing = () => {
    setName(profile?.name ?? '')
    setAge(profile?.age != null ? String(profile.age) : '')
    setEditing(false)
  }

  const objectiveLabel =
    profile?.objective === 'weight_loss'
      ? 'Pérdida de peso'
      : profile?.objective === 'muscle_gain'
        ? 'Ganancia muscular'
        : profile?.objective === 'maintenance'
          ? 'Mantener peso'
          : profile?.objective || '–'

  const handleSave = async (e) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    try {
      await profilesService.update(user.id, {
        name: name.trim() || null,
        age: age.trim() ? parseInt(age, 10) : null
      })
      await refreshProfile()
      showSuccess('Perfil actualizado')
      setEditing(false)
    } catch (err) {
      showError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page perfil-page">
      <h1 className="page-title">Mi perfil</h1>
      <div className="perfil-card card">
        <form onSubmit={handleSave} className="perfil-form">
          <div className="perfil-grid">
            <div className="perfil-field">
              <span className="perfil-label">Email</span>
              <span className="perfil-value perfil-value-readonly">{user?.email}</span>
            </div>
            <div className="perfil-field">
              <span className="perfil-label">Nombre</span>
              {editing ? (
                <input
                  id="perfil-name"
                  type="text"
                  className="perfil-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                />
              ) : (
                <span className="perfil-value perfil-value-readonly">{profile?.name || '–'}</span>
              )}
            </div>
            <div className="perfil-field">
              <span className="perfil-label">Edad</span>
              {editing ? (
                <input
                  id="perfil-age"
                  type="number"
                  min="1"
                  max="120"
                  className="perfil-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value.slice(0, 3))}
                  placeholder="Años"
                />
              ) : (
                <span className="perfil-value perfil-value-readonly">{profile?.age ?? '–'}</span>
              )}
            </div>
            <div className="perfil-field">
              <span className="perfil-label">Objetivo</span>
              <span className="perfil-value perfil-value-readonly">{objectiveLabel}</span>
            </div>
          </div>
          <div className="perfil-actions">
            {editing ? (
              <>
                <button type="button" className="perfil-cancel" onClick={cancelEditing}>
                  Cancelar
                </button>
                <button type="submit" className="perfil-save" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            ) : (
              <button type="button" className="perfil-edit" onClick={startEditing}>
                Editar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
