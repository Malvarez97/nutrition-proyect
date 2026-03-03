import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useSnackbar } from '../../contexts/SnackbarContext'
import { mealsService } from '../../services/meals'
import { bodyMetricsService } from '../../services/bodyMetrics'
import { weeklyControlsService } from '../../services/weeklyControls'
import { goalsService } from '../../services/goals'
import { feedbacksService } from '../../services/feedbacks'
import { foodsService } from '../../services/foods'
import { storageService } from '../../services/storage'
import { useStreak } from '../../hooks/useStreak'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  format,
  parseISO,
  startOfWeek,
  addDays,
  subWeeks
} from 'date-fns'
import { es } from 'date-fns/locale'
import { BodyMeasuresVisual, MEASURE_KEYS } from './components/BodyMeasuresVisual'
import { MealEntryModal } from './components/MealEntryModal'
import './Dashboard.css'
import './UserPanel.css'

const MEAL_LABELS = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Merienda'
}

function inferMealTypeByHour() {
  const h = new Date().getHours()
  if (h >= 5 && h < 10) return 'breakfast'
  if (h >= 10 && h < 14) return 'lunch'
  if (h >= 14 && h < 19) return 'snack'
  return 'dinner'
}

function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function DashboardPage() {
  const { user, profile, ensureProfileExists } = useAuth()
  const { showSuccess, showError } = useSnackbar()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [weightData, setWeightData] = useState([])
  const [weeklyControls, setWeeklyControls] = useState([])
  const [bodyMetrics, setBodyMetrics] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [selectedWeekDate, setSelectedWeekDate] = useState(null)
  const [allWeekDates, setAllWeekDates] = useState([])

  const [weight, setWeight] = useState('')
  const [measures, setMeasures] = useState(
    Object.fromEntries(MEASURE_KEYS.map((k) => [k, '']))
  )
  const [frontPhoto, setFrontPhoto] = useState(null)
  const [sidePhoto, setSidePhoto] = useState(null)
  const [frontPreview, setFrontPreview] = useState('')
  const [sidePreview, setSidePreview] = useState('')

  const [entries, setEntries] = useState([])
  const [foods, setFoods] = useState([])
  const [expandedDay, setExpandedDay] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState(null)
  const [modalMealType, setModalMealType] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [streakDates, setStreakDates] = useState([])

  const { current: streak } = useStreak(streakDates)
  const objective = profile?.objective || 'weight_loss'

  const defaultWeekDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const activeWeekDate = selectedWeekDate || allWeekDates[0] || defaultWeekDate
  const activeWeekIndex = allWeekDates.indexOf(activeWeekDate)
  const canPrev = activeWeekIndex < allWeekDates.length - 1
  const canNext = activeWeekIndex > 0
  const weekStart = parseISO(activeWeekDate)
  const weekEnd = addDays(weekStart, 6)
  const weekStartStr = activeWeekDate
  const endStr = format(weekEnd, 'yyyy-MM-dd')
  const weekDates = getWeekDates(weekStart)

  const wcForWeek = (weeklyControls || []).find((w) => w.date === activeWeekDate)
  const bmForWeek = (bodyMetrics || []).find((b) => b.date === activeWeekDate)
  const feedbackForWeek = (feedbacks || []).find((f) => f.week_date === activeWeekDate)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setLoading(true)
      try {
        const [wc, bm, feedbacksData] = await Promise.all([
          weeklyControlsService.getAll(user.id),
          bodyMetricsService.getAll(user.id),
          feedbacksService.getForUser(user.id)
        ])
        setWeeklyControls(wc || [])
        setBodyMetrics(bm || [])
        setFeedbacks(feedbacksData || [])

        const allWeights = [
          ...(wc || []).map((r) => ({ date: r.date, weight: r.weight })),
          ...(bm || [])
            .filter((r) => !wc?.some((w) => w.date === r.date))
            .map((r) => ({ date: r.date, weight: r.weight }))
        ]
        allWeights.sort((a, b) => a.date.localeCompare(b.date))
        setWeightData(
          allWeights.map((r) => ({
            date: format(parseISO(r.date), 'd MMM', { locale: es }),
            fullDate: r.date,
            weight: r.weight
          }))
        )

        const weeks = [
          ...new Set([
            ...(wc || []).map((r) => r.date),
            ...(bm || []).map((r) => r.date),
            ...(feedbacksData || []).map((f) => f.week_date)
          ])
        ].sort((a, b) => b.localeCompare(a))

        const today = new Date()
        for (let i = 0; i < 12; i++) {
          const ws = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 })
          const d = format(ws, 'yyyy-MM-dd')
          if (!weeks.includes(d)) weeks.push(d)
        }
        const unique = [...new Set(weeks)].sort((a, b) => b.localeCompare(a))
        setAllWeekDates(unique)
        if (!selectedWeekDate) setSelectedWeekDate(unique[0] || defaultWeekDate)

        const now = new Date()
        const twoWeeksAgo = format(subWeeks(now, 2), 'yyyy-MM-dd')
        const dates = await mealsService
          .getDatesWithEntries(user.id, twoWeeksAgo, format(now, 'yyyy-MM-dd'))
          .catch(() => [])
        setStreakDates(dates || [])
      } catch (e) {
        showError(e.message || 'Error al cargar panel')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || !activeWeekDate) return
    const load = async () => {
      try {
        const [wc, bm, entriesData, foodsData] = await Promise.all([
          weeklyControlsService.getByWeek(user.id, activeWeekDate),
          bodyMetricsService.getByWeek(user.id, activeWeekDate),
          mealsService.getEntriesByDateRange(user.id, weekStartStr, endStr),
          foodsService.getAvailableFoods().catch(() => [])
        ])
        setWeight(wc?.weight?.toString() ?? bm?.weight?.toString() ?? '')
        setMeasures(
          bm
            ? Object.fromEntries(
                MEASURE_KEYS.map((k) => [k, bm[k]?.toString() ?? ''])
              )
            : Object.fromEntries(MEASURE_KEYS.map((k) => [k, '']))
        )
        setFrontPreview(wc?.front_photo_url ?? '')
        setSidePreview(wc?.side_photo_url ?? '')
        setFrontPhoto(null)
        setSidePhoto(null)
        setEntries(entriesData || [])
        setFoods(foodsData || [])
      } catch (e) {
        showError(e.message || 'Error al cargar semana')
      }
    }
    load()
  }, [user?.id, activeWeekDate, weekStartStr, endStr])

  useEffect(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    if (todayStr >= activeWeekDate && todayStr <= endStr) {
      setExpandedDay(parseISO(todayStr))
    }
  }, [activeWeekDate])

  const handlePhotoChange = (type, file) => {
    if (!file) return
    const setState = type === 'front' ? setFrontPhoto : setSidePhoto
    const setPrev = type === 'front' ? setFrontPreview : setSidePreview
    setState(file)
    setPrev(URL.createObjectURL(file))
  }

  const handleSaveControl = async (e) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    setError('')
    try {
      let frontUrl = frontPreview
      let sideUrl = sidePreview
      if (frontPhoto) {
        frontUrl = await storageService.uploadWeeklyPhoto(
          user.id,
          weekStartStr,
          'front',
          frontPhoto
        )
      }
      if (sidePhoto) {
        sideUrl = await storageService.uploadWeeklyPhoto(
          user.id,
          weekStartStr,
          'side',
          sidePhoto
        )
      }
      const weightNum = parseFloat(weight) || null
      const measuresNum = Object.fromEntries(
        MEASURE_KEYS.map((k) => [k, parseFloat(measures[k]) || null])
      )
      await Promise.all([
        weeklyControlsService.upsert(user.id, weekStartStr, {
          weight: weightNum,
          front_photo_url: frontUrl || null,
          side_photo_url: sideUrl || null
        }),
        bodyMetricsService.upsert(user.id, weekStartStr, {
          weight: weightNum,
          ...measuresNum
        })
      ])
      showSuccess('Control semanal guardado')
      setFrontPhoto(null)
      setSidePhoto(null)
      weeklyControlsService.getAll(user.id).then(setWeeklyControls)
      bodyMetricsService.getAll(user.id).then(setBodyMetrics)
    } catch (err) {
      setError(err.message || 'Error al guardar')
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openAddModal = (date, mealType) => {
    setEditingEntry(null)
    setModalDate(date)
    setModalMealType(mealType)
    setModalOpen(true)
  }

  const openQuickAdd = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const currentEnd = format(addDays(weekStart, 6), 'yyyy-MM-dd')
    if (todayStr < activeWeekDate || todayStr > currentEnd) {
      setSelectedWeekDate(defaultWeekDate)
    }
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
        await mealsService.updateEntry(editingEntry.id, payload, payload.foods)
        showSuccess('Comida actualizada')
      } else {
        await mealsService.createEntry(user.id, payload, payload.foods)
        showSuccess('Comida guardada')
      }
      closeModal()
      const entriesData = await mealsService.getEntriesByDateRange(
        user.id,
        weekStartStr,
        endStr
      )
      setEntries(entriesData)
    } catch (e) {
      showError(e.message || 'Error al guardar')
      throw e
    }
  }

  const handleDeleteMeal = async (entryId) => {
    if (!confirm('¿Eliminar este registro?')) return
    try {
      await mealsService.deleteEntry(entryId)
      showSuccess('Registro eliminado')
      const entriesData = await mealsService.getEntriesByDateRange(
        user.id,
        weekStartStr,
        endStr
      )
      setEntries(entriesData)
    } catch (e) {
      showError(e.message)
    }
  }

  const getEntriesForDay = (date) =>
    entries.filter((e) => format(parseISO(e.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))

  const refreshFeedbacks = () =>
    user?.id && feedbacksService.getForUser(user.id).then(setFeedbacks)

  const goPrevWeek = () => {
    if (canPrev) setSelectedWeekDate(allWeekDates[activeWeekIndex + 1])
  }
  const goNextWeek = () => {
    if (canNext) setSelectedWeekDate(allWeekDates[activeWeekIndex - 1])
  }
  const goToday = () => setSelectedWeekDate(defaultWeekDate)

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

      <section className="panel-section panel-meals-section panel-meals-top">
        <h2>Calendario de comidas</h2>
        <div className="panel-week-selector">
          <div className="week-slider">
            <button type="button" className="week-slider-btn" onClick={goPrevWeek} disabled={!canPrev}>←</button>
            <span className="week-slider-label">
              Semana del {format(weekStart, 'd MMM', { locale: es })} – {format(weekEnd, 'd MMM yyyy', { locale: es })}
            </span>
            <button type="button" className="week-slider-btn" onClick={goNextWeek} disabled={!canNext}>→</button>
            <button type="button" className="btn-today" onClick={goToday}>Hoy</button>
          </div>
        </div>
        <div className="panel-meals-grid">
          {weekDates.map((date) => (
            <div key={date.toISOString()} className={`day-column ${expandedDay && format(expandedDay, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') ? 'expanded' : ''}`}>
              <button
                type="button"
                className="day-header"
                onClick={() => setExpandedDay((d) => (d && format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') ? null : date))}
              >
                <span>{format(date, 'EEE', { locale: es })}</span>
                <span className="day-num">{format(date, 'd')}</span>
                <span className="day-count">{getEntriesForDay(date).length}</span>
              </button>
              {expandedDay && format(expandedDay, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && (
                <div className="day-content">
                  {Object.entries(MEAL_LABELS).map(([type, label]) => (
                    <div key={type} className="meal-block">
                      <div className="meal-block-header">
                        <span>{label}</span>
                        <button type="button" className="btn-add-small" onClick={() => openAddModal(format(date, 'yyyy-MM-dd'), type)}>+</button>
                      </div>
                      <ul>
                        {getEntriesForDay(date)
                          .filter((e) => e.meal_type === type)
                          .map((entry) => (
                            <li key={entry.id} className="meal-item">
                              <button className="meal-item-content" onClick={() => openEditModal(entry)}>
                                {entry.meal_foods?.map((mf, i) => (
                                  <span key={mf?.id || i}>
                                    {mf?.foods?.name || mf?.custom_name} × {mf?.quantity}
                                  </span>
                                ))}
                                {entry.emotion && <span className="meal-emotion">{entry.emotion}</span>}
                              </button>
                              <button
                                type="button"
                                className="btn-delete-small"
                                onClick={(e) => { e.stopPropagation(); handleDeleteMeal(entry.id) }}
                              >
                                ×
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="diario-fab" onClick={openQuickAdd} aria-label="Añadir comida">
          <span className="diario-fab-icon">+</span>
          <span className="diario-fab-label">Añadir comida</span>
        </button>
      </section>

      <section className="panel-section charts-section">
        <h2>Peso</h2>
        {weightData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,148,136,0.15)" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} />
              <Line type="monotone" dataKey="weight" stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="no-data">Sin datos de peso aún</p>
        )}
      </section>

      <section className="panel-section control-week-section">
        <h2>Control semanal</h2>
        <form onSubmit={handleSaveControl} className="panel-control-form">
          {error && <div className="control-error">{error}</div>}
          <div className="panel-top-row">
            <div className="panel-photos">
              <h3>Fotos de la semana</h3>
              <div className="week-photos-box panel-photos-grid">
                <div className="photo-box">
                  <label>Frente</label>
                  <div className="photo-preview-wrap">
                    {frontPreview ? (
                      <button type="button" className="photo-preview-btn" onClick={() => setPhotoPreview({ url: frontPreview, label: 'Frente' })}>
                        <img src={frontPreview} alt="Frente" />
                        <span className="week-photo-zoom">🔍</span>
                      </button>
                    ) : (
                      <label className="photo-preview photo-preview-empty">
                        <span>Sin foto</span>
                        <input type="file" accept="image/*" onChange={(e) => handlePhotoChange('front', e.target.files?.[0])} className="photo-input-hidden" />
                      </label>
                    )}
                    {frontPreview && <input type="file" accept="image/*" onChange={(e) => handlePhotoChange('front', e.target.files?.[0])} />}
                  </div>
                </div>
                <div className="photo-box">
                  <label>Perfil</label>
                  <div className="photo-preview-wrap">
                    {sidePreview ? (
                      <button type="button" className="photo-preview-btn" onClick={() => setPhotoPreview({ url: sidePreview, label: 'Perfil' })}>
                        <img src={sidePreview} alt="Perfil" />
                        <span className="week-photo-zoom">🔍</span>
                      </button>
                    ) : (
                      <label className="photo-preview photo-preview-empty">
                        <span>Sin foto</span>
                        <input type="file" accept="image/*" onChange={(e) => handlePhotoChange('side', e.target.files?.[0])} className="photo-input-hidden" />
                      </label>
                    )}
                    {sidePreview && <input type="file" accept="image/*" onChange={(e) => handlePhotoChange('side', e.target.files?.[0])} />}
                  </div>
                </div>
              </div>
            </div>
            <div className="panel-measures">
              <h3>Medidas (cm)</h3>
              <BodyMeasuresVisual measures={measures} onChange={setMeasures} />
            </div>
          </div>
          <div className="panel-weight-row">
            <div className="control-section">
              <h3>Peso (kg)</h3>
              <input type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ej: 75.5" />
            </div>
            <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
        <div className="panel-feedback">
          <h3>Feedback de esta semana</h3>
          {feedbackForWeek ? (
            <ControlFeedbackCard feedback={feedbackForWeek} onResponse={refreshFeedbacks} />
          ) : (
            <p className="control-feedback-empty">Sin feedback para esta semana</p>
          )}
        </div>
      </section>

      {weightData.length >= 2 && (
        <section className="panel-section comparison-section">
          <h2>Comparación semana actual vs anterior</h2>
          <WeekComparison weightData={weightData} defaultWeekDate={defaultWeekDate} />
        </section>
      )}

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

      {modalOpen && (
        <MealEntryModal
          date={modalDate}
          mealType={modalMealType}
          entry={editingEntry}
          foods={foods}
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

function WeekComparison({ weightData, defaultWeekDate }) {
  const lastWeekStart = format(subWeeks(parseISO(defaultWeekDate), 1), 'yyyy-MM-dd')
  const thisWeekEntry = weightData.find((d) => d.fullDate === defaultWeekDate)
  const lastWeekEntry = weightData.find((d) => d.fullDate === lastWeekStart)
  const avgThis = thisWeekEntry?.weight != null ? thisWeekEntry.weight.toFixed(1) : '–'
  const avgLast = lastWeekEntry?.weight != null ? lastWeekEntry.weight.toFixed(1) : '–'
  const diff = avgThis !== '–' && avgLast !== '–' ? (parseFloat(avgThis) - parseFloat(avgLast)).toFixed(1) : null

  return (
    <div className="comparison-grid">
      <div className="comparison-item"><span>Semana actual</span><strong>{avgThis} kg</strong></div>
      <div className="comparison-item"><span>Semana anterior</span><strong>{avgLast} kg</strong></div>
      {diff != null && (
        <div className={`comparison-item diff ${parseFloat(diff) < 0 ? 'down' : 'up'}`}>
          <span>Diferencia</span>
          <strong>{parseFloat(diff) > 0 ? '+' : ''}{diff} kg</strong>
        </div>
      )}
    </div>
  )
}
