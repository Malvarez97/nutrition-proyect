import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSnackbar } from '../../contexts/SnackbarContext'
import { createPatientViaEdgeFunction } from '../../services/adminCreatePatient'
import './AdminNuevoPaciente.css'

const emptyForm = {
  email: '',
  password: '',
  name: '',
  age: '',
  objective: 'weight_loss',
  target_weight: '',
  daily_calories: ''
}

export function AdminNuevoPacientePage() {
  const { showSuccess, showError } = useSnackbar()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const passwordMismatch = confirmPassword && form.password !== confirmPassword

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== confirmPassword) {
      showError('Las contraseñas no coinciden')
      return
    }
    setSaving(true)
    try {
      const result = await createPatientViaEdgeFunction({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        age: form.age,
        objective: form.objective,
        target_weight: form.target_weight,
        daily_calories: form.daily_calories
      })
      showSuccess(result.message || 'Paciente creado')
      setForm(emptyForm)
      if (result.id) navigate(`/admin/pacientes/${result.id}`)
    } catch (err) {
      const status = err.status ? ` [${err.status}]` : ''
      showError(`${err.message || 'No se pudo crear el paciente'}${status}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-nuevo-paciente">
      <header className="admin-page-header">
        <div>
          <Link to="/admin/pacientes" className="btn btn-secondary btn-back">← Volver a Pacientes</Link>
          <h1>Nuevo paciente</h1>
          <p className="admin-nuevo-subtitle">
            Creá la cuenta del paciente. Podrá iniciar sesión en la app con el email y la contraseña que definas.
          </p>
        </div>
      </header>

      <div className="card admin-nuevo-card">
        <form onSubmit={handleSubmit} className="admin-nuevo-form">
          <section className="admin-nuevo-section">
            <h2 className="admin-nuevo-section-title">Acceso a la app</h2>
            <div className="form-group">
              <label htmlFor="nuevo-email">Email <span className="req">*</span></label>
              <input
                id="nuevo-email"
                type="email"
                required
                autoComplete="off"
                className="form-input"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="paciente@ejemplo.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="nuevo-password">Contraseña inicial <span className="req">*</span></label>
              <div className="password-input-wrap">
                <input
                  id="nuevo-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="form-input"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="nuevo-confirm-password">Repetir contraseña <span className="req">*</span></label>
              <div className="password-input-wrap">
                <input
                  id="nuevo-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className={`form-input${passwordMismatch ? ' input-error' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la contraseña"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {passwordMismatch && (
                <span className="input-error-msg">Las contraseñas no coinciden</span>
              )}
            </div>
            <p className="admin-nuevo-hint">Comunicá al paciente el email y esta contraseña para que pueda entrar.</p>
          </section>

          <section className="admin-nuevo-section">
            <h2 className="admin-nuevo-section-title">Datos del perfil</h2>
            <div className="admin-nuevo-grid">
              <div className="form-group">
                <label htmlFor="nuevo-name">Nombre</label>
                <input
                  id="nuevo-name"
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="form-group">
                <label htmlFor="nuevo-age">Edad</label>
                <input
                  id="nuevo-age"
                  type="number"
                  min={1}
                  max={120}
                  className="form-input"
                  value={form.age}
                  onChange={(e) => set('age', e.target.value)}
                  placeholder="Ej: 35"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="nuevo-objective">Objetivo nutricional</label>
              <select
                id="nuevo-objective"
                className="form-input form-select"
                value={form.objective}
                onChange={(e) => set('objective', e.target.value)}
              >
                <option value="weight_loss">Pérdida de peso</option>
                <option value="muscle_gain">Ganancia muscular</option>
                <option value="maintenance">Mantener peso</option>
              </select>
            </div>
          </section>

          <section className="admin-nuevo-section">
            <h2 className="admin-nuevo-section-title">Objetivos (opcional)</h2>
            <div className="admin-nuevo-grid">
              <div className="form-group">
                <label htmlFor="nuevo-target-weight">Peso objetivo (kg)</label>
                <input
                  id="nuevo-target-weight"
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={form.target_weight}
                  onChange={(e) => set('target_weight', e.target.value)}
                  placeholder="Ej: 70"
                />
              </div>
              <div className="form-group">
                <label htmlFor="nuevo-daily-calories">Calorías diarias</label>
                <input
                  id="nuevo-daily-calories"
                  type="number"
                  className="form-input"
                  value={form.daily_calories}
                  onChange={(e) => set('daily_calories', e.target.value)}
                  placeholder="Ej: 2000"
                />
              </div>
            </div>
          </section>

          <div className="admin-nuevo-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creando…' : 'Crear paciente'}
            </button>
            <Link to="/admin/pacientes" className="btn btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
