import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useSnackbar } from '../../contexts/SnackbarContext'
import { bodyMetricsService } from '../../services/bodyMetrics'
import { weeklyControlsService } from '../../services/weeklyControls'
import { storageService } from '../../services/storage'
import { format, parseISO, startOfWeek, addDays, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import { BodyMeasuresVisual, MEASURE_KEYS } from './components/BodyMeasuresVisual'
import './Dashboard.css'
import './UserPanel.css'

export function ControlPage() {
  const { user, profile } = useAuth()
  const { showSuccess, showError } = useSnackbar()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setLoading(true)
      try {
        const [wc, bm] = await Promise.all([
          weeklyControlsService.getAll(user.id),
          bodyMetricsService.getAll(user.id)
        ])
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
        const [wc, bm] = await Promise.all([
          weeklyControlsService.getByWeek(user.id, activeWeekDate),
          bodyMetricsService.getByWeek(user.id, activeWeekDate)
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
      } catch (e) {
        showError(e.message || 'Error al cargar semana')
      }
    }
    load()
  }, [user?.id, activeWeekDate])

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
    } catch (err) {
      setError(err.message || 'Error al guardar')
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

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
        <h1>Control</h1>
        <div className="panel-objective">
          Objetivo:{' '}
          {objective === 'weight_loss'
            ? 'Pérdida de peso'
            : objective === 'muscle_gain'
              ? 'Ganancia muscular'
              : 'Mantener peso'}
        </div>
      </header>

      <section className="panel-section control-week-section">
        <h2>Control semanal</h2>
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
