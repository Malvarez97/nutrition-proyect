import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useSnackbar } from '../../contexts/SnackbarContext'
import { mealsService } from '../../services/meals'
import { bodyMetricsService } from '../../services/bodyMetrics'
import { weeklyControlsService } from '../../services/weeklyControls'
import { storageService } from '../../services/storage'
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
import { BodyMeasuresVisual, MEASURE_KEYS } from './components/BodyMeasuresVisual'
import './Dashboard.css'
import './UserPanel.css'

const MEAL_LABELS = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Merienda'
}

function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function SeguimientoPage() {
  const { user, profile } = useAuth()
  const { showSuccess, showError } = useSnackbar()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [weightData, setWeightData] = useState([])
  const [weeklyControls, setWeeklyControls] = useState([])
  const [bodyMetrics, setBodyMetrics] = useState([])
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
  const [expandedDays, setExpandedDays] = useState(new Set())
  const [weekGridExpanded, setWeekGridExpanded] = useState(true)
  const [photoPreview, setPhotoPreview] = useState(null)

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

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setLoading(true)
      try {
        const [wc, bm] = await Promise.all([
          weeklyControlsService.getAll(user.id),
          bodyMetricsService.getAll(user.id)
        ])
        setWeeklyControls(wc || [])
        setBodyMetrics(bm || [])

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
            ...(bm || []).map((r) => r.date)
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
      } catch (e) {
        showError(e.message || 'Error al cargar')
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
        const [wc, bm, entriesData] = await Promise.all([
          weeklyControlsService.getByWeek(user.id, activeWeekDate),
          bodyMetricsService.getByWeek(user.id, activeWeekDate),
          mealsService.getEntriesByDateRange(user.id, weekStartStr, endStr)
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
      } catch (e) {
        showError(e.message || 'Error al cargar semana')
      }
    }
    load()
  }, [user?.id, activeWeekDate, weekStartStr, endStr])

  useEffect(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    if (todayStr >= activeWeekDate && todayStr <= endStr) {
      setExpandedDays((prev) => new Set([...prev, todayStr]))
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

  const getEntriesForDay = (date) =>
    entries.filter((e) => format(parseISO(e.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))

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
        <h1>Seguimiento</h1>
        <div className="panel-objective">
          Objetivo:{' '}
          {objective === 'weight_loss'
            ? 'Pérdida de peso'
            : objective === 'muscle_gain'
              ? 'Ganancia muscular'
              : 'Mantener peso'}
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
            <button type="button" className="week-slider-btn" onClick={goPrevWeek} disabled={!canPrev}>←</button>
            <span className="week-slider-label">
              Semana del {format(weekStart, 'd MMM', { locale: es })} – {format(weekEnd, 'd MMM yyyy', { locale: es })}
            </span>
            <button type="button" className="week-slider-btn" onClick={goNextWeek} disabled={!canNext}>→</button>
            <button type="button" className="btn-today" onClick={goToday}>Hoy</button>
          </div>
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
                    <div className="day-card-detail seguimiento-readonly">
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
                                      onClick={() => setPhotoPreview({ url: entry.photo_url, label: 'Foto comida' })}
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
      </section>

      {weightData.length >= 2 && (
        <section className="panel-section comparison-section">
          <h2>Comparación semana actual vs anterior</h2>
          <WeekComparison weightData={weightData} defaultWeekDate={defaultWeekDate} />
        </section>
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
