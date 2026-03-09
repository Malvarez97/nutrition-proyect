import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useSnackbar } from '../../contexts/SnackbarContext'
import { mealsService } from '../../services/meals'
import { feedbacksService } from '../../services/feedbacks'
import { weeklyControlsService } from '../../services/weeklyControls'
import { useStreak } from '../../hooks/useStreak'
import { format, parseISO, startOfWeek, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import { MealEntryModal } from './components/MealEntryModal'
import './Dashboard.css'
import './UserPanel.css'

function inferMealTypeByHour() {
  const h = new Date().getHours()
  if (h >= 5 && h < 10) return 'breakfast'
  if (h >= 10 && h < 14) return 'lunch'
  if (h >= 14 && h < 19) return 'snack'
  return 'dinner'
}

export function DashboardPage() {
  const { user, profile, ensureProfileExists } = useAuth()
  const { showSuccess, showError } = useSnackbar()
  const [loading, setLoading] = useState(true)
  const [feedbacks, setFeedbacks] = useState([])
  const [streakDates, setStreakDates] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState(null)
  const [modalMealType, setModalMealType] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)
  const [lastEntry, setLastEntry] = useState(null)
  const [hasControlThisWeek, setHasControlThisWeek] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)

  const { current: streak } = useStreak(streakDates)
  const objective = profile?.objective || 'weight_loss'
  const defaultWeekDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const feedbackForWeek = (feedbacks || []).find((f) => f.week_date === defaultWeekDate)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setLoading(true)
      try {
        const [feedbacksData, dates, last, control] = await Promise.all([
          feedbacksService.getForUser(user.id),
          mealsService.getDatesWithEntries(
            user.id,
            format(subWeeks(new Date(), 2), 'yyyy-MM-dd'),
            format(new Date(), 'yyyy-MM-dd')
          ).catch(() => []),
          mealsService.getLastEntry(user.id).catch(() => null),
          weeklyControlsService.getByWeek(user.id, defaultWeekDate).catch(() => null)
        ])
        setFeedbacks(feedbacksData || [])
        setStreakDates(dates || [])
        setLastEntry(last || null)
        setHasControlThisWeek(!!control)
      } catch (e) {
        showError(e.message || 'Error al cargar panel')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id, defaultWeekDate])

  const openAddModal = (date, mealType) => {
    setEditingEntry(null)
    setModalDate(date)
    setModalMealType(mealType)
    setModalOpen(true)
  }

  const openQuickAdd = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    openAddModal(todayStr, inferMealTypeByHour())
  }

  const openEditModal = (entry) => {
    setEditingEntry(entry)
    setModalDate(entry.date)
    setModalMealType(entry.meal_type)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingEntry(null)
    setModalDate(null)
    setModalMealType(null)
  }

  const handleSaveMeal = async (payload) => {
    if (!user?.id) return
    try {
      await ensureProfileExists(user)
      if (editingEntry) {
        await mealsService.updateEntry(editingEntry.id, payload)
        showSuccess('Comida actualizada')
      } else {
        await mealsService.createEntry(user.id, payload)
        showSuccess('Comida guardada')
      }
      closeModal()
      const now = new Date()
      const [dates, last] = await Promise.all([
        mealsService.getDatesWithEntries(user.id, format(subWeeks(now, 2), 'yyyy-MM-dd'), format(now, 'yyyy-MM-dd')).catch(() => []),
        mealsService.getLastEntry(user.id).catch(() => null)
      ])
      setStreakDates(dates || [])
      setLastEntry(last || null)
    } catch (e) {
      showError(e.message || 'Error al guardar')
      throw e
    }
  }

  const refreshFeedbacks = () =>
    user?.id && feedbacksService.getForUser(user.id).then(setFeedbacks)

  useEffect(() => {
    if (window.location.hash === '#ultima-comida') {
      document.getElementById('ultima-comida')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  if (loading) return <div className="dashboard-loading">Cargando...</div>

  return (
    <div className="user-panel">
      <header className="panel-header">
        <h1>Panel</h1>
        <div className="panel-objective">
          Objetivo:{' '}
          {objective === 'weight_loss'
            ? 'Pérdida de peso'
            : objective === 'muscle_gain'
              ? 'Ganancia muscular'
              : 'Mantener peso'}
        </div>
      </header>

      {streak > 0 && (
        <div className="streak-badge">
          <span className="streak-value">{streak}</span>
          <span className="streak-label">
            día{streak !== 1 ? 's' : ''} seguido{streak !== 1 ? 's' : ''} registrando comidas
          </span>
        </div>
      )}

      <section id="ultima-comida" className="panel-section panel-ultima-comida">
        <h2>Última comida</h2>
        {lastEntry ? (
          <div className="ultima-comida-card">
            {lastEntry.photo_url ? (
              <button
                type="button"
                className="ultima-comida-photo"
                onClick={() => setPhotoPreview({ url: lastEntry.photo_url, label: 'Última comida' })}
                aria-label="Ver foto"
              >
                <img src={lastEntry.photo_url} alt="Comida" />
                <span className="meal-list-photo-zoom">🔍</span>
              </button>
            ) : (
              <div className="ultima-comida-photo ultima-comida-photo-empty">Sin foto</div>
            )}
            <div className="ultima-comida-details">
              <div className="ultima-comida-meta">
                <span className="ultima-comida-type">{MEAL_LABELS[lastEntry.meal_type] || lastEntry.meal_type}</span>
                <span className="ultima-comida-date">{format(parseISO(lastEntry.created_at || lastEntry.date), 'd MMM yyyy, HH:mm', { locale: es })}</span>
              </div>
              {lastEntry.note && <p className="ultima-comida-note">{lastEntry.note}</p>}
              {lastEntry.emotion && <p className="ultima-comida-emotion">Emoción: {lastEntry.emotion}</p>}
              <button type="button" className="btn-edit-meal" onClick={() => openEditModal(lastEntry)}>Editar</button>
            </div>
          </div>
        ) : (
          <p className="ultima-comida-empty">Aún no has registrado ninguna comida. Usa el botón de abajo para añadir la primera.</p>
        )}
      </section>

      {!hasControlThisWeek && (
        <section className="panel-section panel-control-cta">
          <h2>Control semanal</h2>
          <p className="control-cta-text">Esta semana no has cargado datos de control.</p>
          <Link to="/app/control" className="btn-cargar-control">Cargar control semanal</Link>
        </section>
      )}

      <section className="panel-section control-week-section">
        <h2>Feedback de esta semana</h2>
        {feedbackForWeek ? (
          <ControlFeedbackCard feedback={feedbackForWeek} onResponse={refreshFeedbacks} />
        ) : (
          <p className="control-feedback-empty">Sin feedback para esta semana</p>
        )}
      </section>

      {feedbacks.length > 0 && (
        <section className="panel-section feedbacks-history">
          <h2>Historial de feedbacks</h2>
          <div className="feedbacks-list">
            {feedbacks.slice(0, 5).map((f) => (
              <div key={f.id} className="feedback-card feedback-card-full">
                <div className="feedback-date">Semana {format(parseISO(f.week_date), 'd MMM yyyy', { locale: es })}</div>
                {f.general_observation && <p><strong>Observación:</strong> {f.general_observation}</p>}
                {f.adjustments && <p><strong>Ajustes:</strong> {f.adjustments}</p>}
                {f.recommendations && <p><strong>Recomendaciones:</strong> {f.recommendations}</p>}
                {f.user_response && <p className="user-response"><strong>Tu respuesta:</strong> {f.user_response}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <button type="button" className="diario-fab" onClick={openQuickAdd} aria-label="Añadir comida">
        <span className="diario-fab-icon">+</span>
        <span className="diario-fab-label">Añadir comida</span>
      </button>

      {modalOpen && (
        <MealEntryModal
          date={modalDate}
          mealType={modalMealType}
          entry={editingEntry}
          onSave={handleSaveMeal}
          onClose={closeModal}
        />
      )}

      {photoPreview && (
        <div className="photo-preview-modal-overlay" onClick={() => setPhotoPreview(null)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Escape' && setPhotoPreview(null)}>
          <div className="photo-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="photo-preview-close" onClick={() => setPhotoPreview(null)}>×</button>
            <div className="photo-preview-label">{photoPreview.label}</div>
            <img src={photoPreview.url} alt={photoPreview.label} className="photo-preview-img" />
          </div>
        </div>
      )}
    </div>
  )
}

function ControlFeedbackCard({ feedback, onResponse }) {
  const [response, setResponse] = useState('')
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const { showSuccess, showError } = useSnackbar()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!response.trim() || !user?.id) return
    setSaving(true)
    try {
      await feedbacksService.respond(feedback.id, user.id, response.trim())
      showSuccess('Respuesta enviada')
      onResponse()
    } catch (e) {
      showError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="control-feedback-card">
      {feedback.general_observation && <p><strong>Observación:</strong> {feedback.general_observation}</p>}
      {feedback.adjustments && <p><strong>Ajustes:</strong> {feedback.adjustments}</p>}
      {feedback.recommendations && <p><strong>Recomendaciones:</strong> {feedback.recommendations}</p>}
      {feedback.user_response ? (
        <p className="control-feedback-user-response"><strong>Tu respuesta:</strong> {feedback.user_response}</p>
      ) : (
        <form onSubmit={handleSubmit} className="control-feedback-respond">
          <textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Responder al feedback..." rows={2} />
          <button type="submit" disabled={saving || !response.trim()}>{saving ? 'Enviando...' : 'Enviar respuesta'}</button>
        </form>
      )}
    </div>
  )
}
