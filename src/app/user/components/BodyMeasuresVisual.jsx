import { useMemo } from 'react'
import './BodyMeasuresVisual.css'

export const MEASURE_KEYS = [
  'neck',
  'shoulders',
  'chest',
  'waist',
  'hip',
  'left_thigh',
  'right_thigh',
  'left_biceps',
  'right_biceps'
]

const MEASURE_LABELS = {
  neck: 'Cuello',
  shoulders: 'Hombros',
  chest: 'Pecho',
  waist: 'Cintura',
  hip: 'Cadera',
  left_thigh: 'Muslo izquierdo',
  right_thigh: 'Muslo derecho',
  left_biceps: 'Bíceps izquierdo',
  right_biceps: 'Bíceps derecho'
}

export function BodyMeasuresVisual({ measures = {}, onChange, readOnly = false }) {
  const values = useMemo(
    () =>
      Object.fromEntries(
        MEASURE_KEYS.map((k) => [k, measures[k] ?? ''])
      ),
    [measures]
  )

  return (
    <div className="body-measures-visual">
      <div className="measures-grid">
        {MEASURE_KEYS.map((key) => (
          <div key={key} className="measure-field">
            <label>{MEASURE_LABELS[key]}</label>
            {readOnly ? (
              <span className="measure-value">{values[key] || '–'}</span>
            ) : (
              <input
                type="number"
                min="0"
                step="0.1"
                value={values[key]}
                onChange={(e) =>
                  onChange &&
                  onChange({
                    ...measures,
                    [key]: e.target.value
                  })
                }
                placeholder="0"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
