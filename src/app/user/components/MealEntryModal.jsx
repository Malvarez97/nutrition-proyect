import { useState, useEffect } from 'react'
import './MealEntryModal.css'

const MEAL_LABELS = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Merienda'
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
  const [step, setStep] = useState('photo') // 'photo' | 'form'
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

        <form onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}

          {/* Paso 1: Foto (obligatoria) */}
          <div className="modal-section">
            <label>Foto (obligatoria)</label>
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
          </div>

          {/* Paso 2: Tipo de comida (obligatorio), Notas, Emoción */}
          <div className="modal-section">
            <label>Tipo de comida (obligatorio)</label>
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
          </div>

          <div className="modal-section">
            <label>Notas</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Observaciones opcionales..."
              rows={2}
              className="form-input"
            />
          </div>

          <div className="modal-section">
            <label>Emoción</label>
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
