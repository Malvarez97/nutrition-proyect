import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useSnackbar } from '../../contexts/SnackbarContext'
import { professionalService } from '../../services/professional'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { format, parseISO, startOfWeek, addDays, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import { FeedbackModal } from './components/FeedbackModal'
import { BodyMeasuresVisual } from '../user/components/BodyMeasuresVisual'
import '../user/Dashboard.css'
import '../user/UserPanel.css'
import './AdminPatientDetail.css'

const MEAL_LABELS = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Merienda'
}

const MEASURE_KEYS = ['neck', 'shoulders', 'chest', 'waist', 'hip', 'left_thigh', 'right_thigh', 'left_biceps', 'right_biceps']

function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function AdminPatientDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showSuccess, showError } = useSnackbar()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedbackModal, setFeedbackModal] = useState(false)
  const [selectedWeekDate, setSelectedWeekDate] = useState(null)
  const [editingFeedback, setEditingFeedback] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [expandedDays, setExpandedDays] = useState(new Set())
  const [weekGridExpanded, setWeekGridExpanded] = useState(true)

  useEffect(() => {
    if (!user?.id || !id) return
    professionalService
      .getPatientDetail(user.id, id)
      .then(setData)
      .catch((e) => showError(e.message || 'Error al cargar paciente'))
      .finally(() => setLoading(false))
  }, [user?.id, id])

  const refreshData = () =>
    user?.id &&
    id &&
    professionalService.getPatientDetail(user.id, id).then(setData)

  if (loading || !data) {
    return <div className="admin-loading">Cargando...</div>
  }

  const { profile, goals, mealEntries, weeklyControls, bodyMetrics, feedbacks } = data

  const weightData = [
    ...(weeklyControls || []).map((r) => ({
      date: format(parseISO(r.date), 'd MMM', { locale: es }),
      weight: r.weight
    })),
    ...(bodyMetrics || [])
      .filter((b) => !weeklyControls?.some((w) => w.date === b.date))
      .map((r) => ({
        date: format(parseISO(r.date), 'd MMM', { locale: es }),
        weight: r.weight
      }))
  ].sort((a, b) => a.date.localeCompare(b.date))

  const allWeekDates = [
    ...new Set([
      ...(weeklyControls || []).map((r) => r.date),
      ...(bodyMetrics || []).map((r) => r.date),
      ...(feedbacks || []).map((f) => f.week_date),
      ...(mealEntries || []).map((e) =>
        format(startOfWeek(parseISO(e.date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      )
    ])
  ].sort((a, b) => b.localeCompare(a))

  const today = new Date()
  for (let i = 0; i < 12; i++) {
    const ws = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 })
    const d = format(ws, 'yyyy-MM-dd')
    if (!allWeekDates.includes(d)) allWeekDates.push(d)
  }
  const uniqueWeeks = [...new Set(allWeekDates)].sort((a, b) => b.localeCompare(a))

  const defaultWeekDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const activeWeekDate = selectedWeekDate || uniqueWeeks[0] || defaultWeekDate
  const activeWeekIndex = uniqueWeeks.indexOf(activeWeekDate)
  const canPrev = activeWeekIndex < uniqueWeeks.length - 1
  const canNext = activeWeekIndex > 0
  const weekStart = parseISO(activeWeekDate)
  const weekEnd = addDays(weekStart, 6)

  const wcForWeek = (weeklyControls || []).find((w) => w.date === activeWeekDate)
  const bmForWeek = (bodyMetrics || []).find((b) => b.date === activeWeekDate)
  const feedbackForWeek = (feedbacks || []).find((f) => f.week_date === activeWeekDate)
  const weightForWeek = wcForWeek?.weight ?? bmForWeek?.weight

  const goPrevWeek = () => {
    if (canPrev) setSelectedWeekDate(uniqueWeeks[activeWeekIndex + 1])
  }
  const goNextWeek = () => {
    if (canNext) setSelectedWeekDate(uniqueWeeks[activeWeekIndex - 1])
  }

  const weekMealEntries = (mealEntries || []).filter(
    (e) =>
      e.date >= activeWeekDate &&
      e.date <= format(addDays(parseISO(activeWeekDate), 6), 'yyyy-MM-dd')
  )

  const weekDates = getWeekDates(weekStart)
  const getEntriesForDay = (date) =>
    weekMealEntries.filter(
      (e) => format(parseISO(e.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )

  const toggleDay = (date) => {
    const key = format(date, 'yyyy-MM-dd')
    setExpandedDays((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const getMealCountByType = (date, type) =>
    getEntriesForDay(date).filter((e) => e.meal_type === type).length

  const weightDataWithFullDate = [
    ...(weeklyControls || []).map((r) => ({
      date: format(parseISO(r.date), 'd MMM', { locale: es }),
      fullDate: r.date,
      weight: r.weight
    })),
    ...(bodyMetrics || [])
      .filter((b) => !weeklyControls?.some((w) => w.date === b.date))
      .map((r) => ({
        date: format(parseISO(r.date), 'd MMM', { locale: es }),
        fullDate: r.date,
        weight: r.weight
      }))
  ].sort((a, b) => (a.fullDate || '').localeCompare(b.fullDate || ''))

  const lastWeekStart = format(subWeeks(parseISO(activeWeekDate), 1), 'yyyy-MM-dd')
  const thisWeekEntry = weightDataWithFullDate.find((d) => d.fullDate === activeWeekDate)
  const lastWeekEntry = weightDataWithFullDate.find((d) => d.fullDate === lastWeekStart)
  const avgThis = thisWeekEntry?.weight != null ? thisWeekEntry.weight.toFixed(1) : '–'
  const avgLast = lastWeekEntry?.weight != null ? lastWeekEntry.weight.toFixed(1) : '–'
  const diff =
    avgThis !== '–' && avgLast !== '–'
      ? (parseFloat(avgThis) - parseFloat(avgLast)).toFixed(1)
      : null

  const objective = profile?.objective || 'weight_loss'

  return (
    <div className="admin-patient-detail user-panel">
      <header className="panel-header detail-header">
        <div>
          <Link to="/admin/pacientes" className="back-link">← Pacientes</Link>
          <h1>{profile?.name || profile?.email || 'Paciente'}</h1>
          <div className="panel-objective">
            Objetivo:{' '}
            {objective === 'weight_loss'
              ? 'Pérdida de peso'
              : objective === 'muscle_gain'
                ? 'Ganancia muscular'
                : 'Mantener peso'}
          </div>
        </div>
      </header>

      <section className="panel-section panel-meals-section panel-meals-top">
        <button
          type="button"
          className="panel-section-toggle"
          onClick={() => setWeekGridExpanded((v) => !v)}
          aria-expanded={weekGridExpanded}
        >
          <h2>Calendario de comidas</h2>
          <span className="toggle-icon">{weekGridExpanded ? '▼' : '▶'}</span>
        </button>
        <div className="panel-week-selector">
          <div className="week-slider">
            <button
              type="button"
              className="week-slider-btn"
              onClick={goPrevWeek}
              disabled={!canPrev}
              aria-label="Semana anterior"
            >
              ←
            </button>
            <span className="week-slider-label">
              Semana del {format(weekStart, 'd MMM', { locale: es })} –{' '}
              {format(weekEnd, 'd MMM yyyy', { locale: es })}
            </span>
            <button
              type="button"
              className="week-slider-btn"
              onClick={goNextWeek}
              disabled={!canNext}
              aria-label="Semana siguiente"
            >
              →
            </button>
            <button
              type="button"
              className="btn-today"
              onClick={() =>
                setSelectedWeekDate(
                  format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
                )
              }
            >
              Hoy
            </button>
          </div>
          {uniqueWeeks.length > 1 && (
            <input
              type="range"
              className="admin-week-range"
              min={0}
              max={Math.max(0, uniqueWeeks.length - 1)}
              value={
                activeWeekIndex >= 0 ? uniqueWeeks.length - 1 - activeWeekIndex : 0
              }
              onChange={(e) =>
                setSelectedWeekDate(
                  uniqueWeeks[uniqueWeeks.length - 1 - parseInt(e.target.value, 10)]
                )
              }
              aria-label="Seleccionar semana"
            />
          )}
        </div>
        {weekGridExpanded && (
          <div className="panel-meals-cards-grid">
            {weekDates.map((date) => {
              const dateKey = format(date, 'yyyy-MM-dd')
              const isExpanded = expandedDays.has(dateKey)
              const dayEntries = getEntriesForDay(date)
              return (
                <div key={dateKey} className={`day-card ${isExpanded ? 'day-card-expanded' : ''}`}>
                  <button
                    type="button"
                    className="day-card-header"
                    onClick={() => toggleDay(date)}
                    aria-expanded={isExpanded}
                  >
                    <span className="day-card-title">
                      {format(date, 'EEE', { locale: es })} {format(date, 'd')}
                    </span>
                    <span className="day-card-badge">{dayEntries.length} comidas</span>
                    <span className="day-card-chevron">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  <div className="day-card-preview">
                    {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => {
                      const n = getMealCountByType(date, type)
                      if (n === 0) return null
                      const short = { breakfast: 'D', lunch: 'A', dinner: 'C', snack: 'M' }[type]
                      return <span key={type} className="day-card-chip">{short}: {n}</span>
                    })}
                    {dayEntries.length === 0 && (
                      <span className="day-card-empty">Sin registros</span>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="day-card-detail">
                      {Object.entries(MEAL_LABELS).map(([type, label]) => {
                        const typeEntries = dayEntries.filter((e) => e.meal_type === type)
                        return (
                          <div key={type} className="meal-block">
                            <div className="meal-block-header">
                              <span className="meal-block-label">{label}</span>
                            </div>
                            <ul className="meal-list">
                              {typeEntries.map((entry) => (
                                <li key={entry.id} className="meal-list-item meal-list-item-readonly">
                                  {entry.photo_url ? (
                                    <button
                                      type="button"
                                      className="meal-list-photo-thumb"
                                      onClick={() =>
                                        setPhotoPreview({ url: entry.photo_url, label: 'Foto comida' })
                                      }
                                      aria-label="Ver foto"
                                    >
                                      <img src={entry.photo_url} alt="Comida" />
                                      <span className="meal-list-photo-zoom">🔍</span>
                                    </button>
                                  ) : (
                                    <div className="meal-list-photo-thumb meal-list-photo-empty">Sin foto</div>
                                  )}
                                  <div className="meal-list-item-btn">
                                    <div className="meal-list-type">{MEAL_LABELS[entry.meal_type] || entry.meal_type}</div>
                                    {(entry.note || entry.emotion) && (
                                      <div className="meal-list-meta">
                                        {entry.note && <span className="meal-list-note">{entry.note}</span>}
                                        {entry.emotion && <span className="meal-list-emotion">{entry.emotion}</span>}
                                      </div>
                                    )}
                                  </div>
                                </li>
                              ))}
                              {typeEntries.length === 0 && (
                                <li className="meal-list-empty">
                                  <span className="meal-list-empty-text">Sin registros</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="panel-section charts-section">
        <h2>Peso</h2>
        {weightData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,148,136,0.15)" />
              <XAxis dataKey="date" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '12px'
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#0D9488"
                strokeWidth={2}
                dot={{ fill: '#0D9488' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="no-data">Sin datos de peso</p>
        )}
      </section>

      <section className="panel-section control-week-section">
        <h2>Control semanal</h2>
        <div className="panel-top-row">
          <div className="panel-photos">
            <h3>Fotos de la semana</h3>
            <div className="week-photos-box panel-photos-grid">
              <div className="photo-box">
                <label>Frente</label>
                <div className="photo-preview-wrap">
                  {wcForWeek?.front_photo_url ? (
                    <button
                      type="button"
                      className="photo-preview-btn"
                      onClick={() =>
                        setPhotoPreview({
                          url: wcForWeek.front_photo_url,
                          label: 'Frente'
                        })
                      }
                      aria-label="Ver foto frente ampliada"
                    >
                      <img src={wcForWeek.front_photo_url} alt="Frente" />
                      <span className="week-photo-zoom">🔍</span>
                    </button>
                  ) : (
                    <div className="photo-placeholder panel-photo-empty">Sin foto</div>
                  )}
                </div>
              </div>
              <div className="photo-box">
                <label>Perfil</label>
                <div className="photo-preview-wrap">
                  {wcForWeek?.side_photo_url ? (
                    <button
                      type="button"
                      className="photo-preview-btn"
                      onClick={() =>
                        setPhotoPreview({
                          url: wcForWeek.side_photo_url,
                          label: 'Perfil'
                        })
                      }
                      aria-label="Ver foto perfil ampliada"
                    >
                      <img src={wcForWeek.side_photo_url} alt="Perfil" />
                      <span className="week-photo-zoom">🔍</span>
                    </button>
                  ) : (
                    <div className="photo-placeholder panel-photo-empty">Sin foto</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="panel-measures">
            <h3>Medidas (cm)</h3>
            {bmForWeek ? (
              <BodyMeasuresVisual
                measures={Object.fromEntries(
                  MEASURE_KEYS.map((k) => [k, bmForWeek[k]?.toString() ?? ''])
                )}
                readOnly
              />
            ) : (
              <p className="no-data">Sin medidas para esta semana</p>
            )}
          </div>
        </div>
        {weightForWeek != null && (
          <div className="panel-weight-row admin-weight-only">
            <div className="control-section">
              <h3>Peso (kg)</h3>
              <span className="weight-value">{weightForWeek}</span>
            </div>
          </div>
        )}
        <div className="panel-feedback">
          <h3>Feedback de esta semana</h3>
          {feedbackForWeek ? (
            <>
              <div className="control-feedback-card">
                {feedbackForWeek.general_observation && (
                  <p>
                    <strong>Observación:</strong> {feedbackForWeek.general_observation}
                  </p>
                )}
                {feedbackForWeek.adjustments && (
                  <p>
                    <strong>Ajustes:</strong> {feedbackForWeek.adjustments}
                  </p>
                )}
                {feedbackForWeek.recommendations && (
                  <p>
                    <strong>Recomendaciones:</strong> {feedbackForWeek.recommendations}
                  </p>
                )}
                {feedbackForWeek.user_response && (
                  <p className="control-feedback-user-response">
                    <strong>Respuesta del paciente:</strong> {feedbackForWeek.user_response}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="btn-feedback btn-feedback-edit"
                onClick={() => {
                  setEditingFeedback(feedbackForWeek)
                  setFeedbackModal(true)
                }}
              >
                Editar feedback
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-feedback btn-feedback-inline"
              onClick={() => {
                setEditingFeedback(null)
                setFeedbackModal(true)
              }}
            >
              Crear feedback para esta semana
            </button>
          )}
        </div>
      </section>

      {weightDataWithFullDate.length >= 2 && (
        <section className="panel-section comparison-section">
          <h2>Comparación semana actual vs anterior</h2>
          <div className="comparison-grid">
            <div className="comparison-item">
              <span>Semana actual</span>
              <strong>{avgThis} kg</strong>
            </div>
            <div className="comparison-item">
              <span>Semana anterior</span>
              <strong>{avgLast} kg</strong>
            </div>
            {diff != null && (
              <div
                className={`comparison-item diff ${parseFloat(diff) < 0 ? 'down' : 'up'}`}
              >
                <span>Diferencia</span>
                <strong>
                  {parseFloat(diff) > 0 ? '+' : ''}
                  {diff} kg
                </strong>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="panel-section feedbacks-history">
        <h2>Historial de feedbacks</h2>
        <div className="feedbacks-list">
          {(feedbacks || []).slice(0, 5).map((f) => (
            <div key={f.id} className="feedback-card feedback-card-full">
              <div className="feedback-date">
                Semana {format(parseISO(f.week_date), 'd MMM yyyy', { locale: es })}
              </div>
              {f.general_observation && (
                <p>
                  <strong>Observación:</strong> {f.general_observation}
                </p>
              )}
              {f.adjustments && (
                <p>
                  <strong>Ajustes:</strong> {f.adjustments}
                </p>
              )}
              {f.recommendations && (
                <p>
                  <strong>Recomendaciones:</strong> {f.recommendations}
                </p>
              )}
              {f.user_response && (
                <p className="user-response">
                  <strong>Respuesta del paciente:</strong> {f.user_response}
                </p>
              )}
            </div>
          ))}
        </div>
        {(!feedbacks || feedbacks.length === 0) && (
          <p className="no-data">Sin feedbacks aún</p>
        )}
      </section>

      {feedbackModal && (
        <FeedbackModal
          userId={id}
          weekDate={activeWeekDate}
          feedback={editingFeedback}
          onClose={() => setFeedbackModal(false)}
          onSaved={() => {
            refreshData()
            setFeedbackModal(false)
          }}
        />
      )}

      {photoPreview && (
        <div
          className="photo-preview-modal-overlay"
          onClick={() => setPhotoPreview(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setPhotoPreview(null)}
          aria-label="Cerrar vista previa"
        >
          <div
            className="photo-preview-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Foto ${photoPreview.label} ampliada`}
          >
            <button
              type="button"
              className="photo-preview-close"
              onClick={() => setPhotoPreview(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <div className="photo-preview-label">{photoPreview.label}</div>
            <img
              src={photoPreview.url}
              alt={photoPreview.label}
              className="photo-preview-img"
            />
          </div>
        </div>
      )}
    </div>
  )
}
