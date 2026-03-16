import { useState, useEffect } from 'react'
import './MealEntryModal.css'

/* Orden: Desayuno, Almuerzo, Merienda, Cena */
const MEAL_LABELS = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  snack: 'Merienda',
  dinner: 'Cena'
}

const EMOTIONS = [
  'Feliz',
  'Tranquilo',
  'Ansioso',
  'Estresado',
  'Cansado',
  'Energético',
  'Neutral',
  'Otro'
]

export function MealEntryModal({ date, mealType: initialMealType, entry, onSave, onClose }) {
  const [, setStep] = useState('photo') // 'photo' | 'form'
  const [mealType, setMealType] = useState(initialMealType || 'breakfast')
  const [note, setNote] = useState('')
  const [emotion, setEmotion] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (entry) {
      setMealType(entry.meal_type || initialMealType || 'breakfast')
      setNote(entry.note || '')
      setEmotion(entry.emotion || '')
      setPhotoPreview(entry.photo_url || '')
      setPhotoFile(null)
      setStep(entry.photo_url ? 'form' : 'photo')
    } else {
      setMealType(initialMealType || 'breakfast')
      setNote('')
      setEmotion('')
      setPhotoPreview('')
      setPhotoFile(null)
      setStep('photo')
    }
  }, [entry, initialMealType])

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setStep('form')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const hasPhoto = !!photoFile || !!photoPreview
    if (!hasPhoto) {
      setError('Sacá o elegí una foto primero')
      return
    }
    setLoading(true)
    try {
      const payload = {
        date,
        meal_type: mealType,
        emotion: emotion || null,
        note: note || null,
        photo: photoFile || undefined
      }
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const canSave = (photoFile || photoPreview) && mealType

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content meal-entry-modal-new" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{entry ? 'Editar comida' : 'Nueva comida'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="meal-entry-form">
          <div className="modal-body">
            {error && <div className="modal-error">{error}</div>}

            {/* 1. Foto (obligatoria) */}
            <section className="modal-section" aria-labelledby="meal-step-photo">
              <h3 id="meal-step-photo" className="modal-section-title"><span className="modal-step-num">1</span> Foto (obligatoria)</h3>
              <div className="meal-photo-upload">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                id="meal-photo-camera"
                className="meal-photo-input"
                aria-label="Abrir cámara"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                id="meal-photo-gallery"
                className="meal-photo-input"
                aria-label="Elegir de galería"
              />
              {photoPreview ? (
                <div className="meal-photo-preview-wrap">
                  <img src={photoPreview} alt="Comida" className="meal-photo-preview" />
                  <button
                    type="button"
                    className="meal-photo-remove"
                    onClick={() => {
                      setPhotoFile(null)
                      setPhotoPreview('')
                      setStep('photo')
                    }}
                    aria-label="Quitar foto"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="meal-photo-actions">
                  <label htmlFor="meal-photo-camera" className="meal-photo-btn meal-photo-btn-camera">
                    📷 Sacar foto
                  </label>
                  <label htmlFor="meal-photo-gallery" className="meal-photo-btn meal-photo-btn-gallery">
                    🖼️ Elegir de galería
                  </label>
                </div>
              )}
            </div>
            </section>

            {/* 2. Tipo de comida */}
            <section className="modal-section" aria-labelledby="meal-step-type">
              <h3 id="meal-step-type" className="modal-section-title"><span className="modal-step-num">2</span> Tipo de comida</h3>
              <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="form-input"
              required
            >
              {Object.entries(MEAL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            </section>

            {/* 3. Notas */}
            <section className="modal-section" aria-labelledby="meal-step-notes">
              <h3 id="meal-step-notes" className="modal-section-title"><span className="modal-step-num">3</span> Notas</h3>
              <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="form-input"
              placeholder="Observaciones opcionales..."
            />
            </section>

            {/* 4. Emoción */}
            <section className="modal-section" aria-labelledby="meal-step-emotion">
              <h3 id="meal-step-emotion" className="modal-section-title"><span className="modal-step-num">4</span> Emoción</h3>
              <select
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className="form-input"
            >
              <option value="">Seleccionar...</option>
              {EMOTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            </section>
          </div>

          <footer className="modal-footer">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || !canSave}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
