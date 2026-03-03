import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { professionalService } from '../../../services/professional'
import './FeedbackModal.css'

export function FeedbackModal({ userId, weekDate, feedback, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = !!feedback
  const [general_observation, setGeneralObservation] = useState('')
  const [adjustments, setAdjustments] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (feedback) {
      setGeneralObservation(feedback.general_observation || '')
      setAdjustments(feedback.adjustments || '')
      setRecommendations(feedback.recommendations || '')
    }
  }, [feedback])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit) {
        await professionalService.updateFeedback(user.id, feedback.id, {
          general_observation: general_observation || null,
          adjustments: adjustments || null,
          recommendations: recommendations || null
        })
      } else {
        await professionalService.createFeedback(user.id, userId, weekDate, {
          general_observation: general_observation || null,
          adjustments: adjustments || null,
          recommendations: recommendations || null
        })
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content feedback-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{isEdit ? 'Editar feedback' : 'Nuevo feedback'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </header>

        <form onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}

          <div className="form-group">
            <label>Observación general</label>
            <textarea
              value={general_observation}
              onChange={(e) => setGeneralObservation(e.target.value)}
              rows={3}
              placeholder="Estado general del paciente..."
            />
          </div>

          <div className="form-group">
            <label>Ajustes</label>
            <textarea
              value={adjustments}
              onChange={(e) => setAdjustments(e.target.value)}
              rows={2}
              placeholder="Ajustes al plan..."
            />
          </div>

          <div className="form-group">
            <label>Recomendaciones</label>
            <textarea
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              rows={3}
              placeholder="Recomendaciones para la próxima semana..."
            />
          </div>

          <footer className="modal-footer">
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Enviar feedback'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
