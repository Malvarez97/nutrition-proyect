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
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
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
      showError(err.message || 'No se pudo crear el paciente')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-nuevo-paciente">
      <header className="admin-page-header">
        <div>
          <Link to="/admin/pacientes" className="back-link">← Pacientes</Link>
          <h1>Nuevo paciente</h1>
          <p className="admin-nuevo-subtitle">
            Creá la cuenta del paciente (email y contraseña). Podrá iniciar sesión en la app con esos datos.
          </p>
        </div>
      </header>

      <div className="card admin-nuevo-card">
        <form onSubmit={handleSubmit} className="admin-nuevo-form">
          <fieldset>
            <legend>Acceso a la app</legend>
            <label>
              Email <span className="req">*</span>
              <input
                type="email"
                required
                autoComplete="off"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="paciente@email.com"
              />
            </label>
            <label>
              Contraseña inicial <span className="req">*</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </label>
            <p className="hint">Comunicale al paciente el email y esta contraseña; puede cambiarla después si activás recuperación en Supabase Auth.</p>
          </fieldset>

          <fieldset>
            <legend>Datos del perfil</legend>
            <label>
              Nombre
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Nombre completo"
              />
            </label>
            <label>
              Edad
              <input
                type="number"
                min={1}
                max={120}
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
              />
            </label>
            <label>
              Objetivo nutricional
              <select value={form.objective} onChange={(e) => set('objective', e.target.value)}>
                <option value="weight_loss">Pérdida de peso</option>
                <option value="muscle_gain">Ganancia muscular</option>
                <option value="maintenance">Mantener peso</option>
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>Objetivos (opcional)</legend>
            <label>
              Peso objetivo (kg)
              <input
                type="number"
                step="0.1"
                value={form.target_weight}
                onChange={(e) => set('target_weight', e.target.value)}
              />
            </label>
            <label>
              Calorías diarias
              <input
                type="number"
                value={form.daily_calories}
                onChange={(e) => set('daily_calories', e.target.value)}
              />
            </label>
          </fieldset>

          <div className="admin-nuevo-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creando…' : 'Crear paciente'}
            </button>
            <Link to="/admin/pacientes" className="btn-secondary-link">Cancelar</Link>
          </div>
        </form>

        <aside className="admin-nuevo-aside">
          <strong>Requisito técnico</strong>
          <p>
            El alta se hace con una <strong>Edge Function</strong> en Supabase. Si ves error de red o 404,
            desplegá la función y volvé a intentar:
          </p>
          <pre className="admin-nuevo-code">
            {`supabase functions deploy create-patient`}
          </pre>
          <p className="hint">En el dashboard: Edge Functions → create-patient → Deploy. El service role no se expone al navegador.</p>
        </aside>
      </div>
    </div>
  )
}
