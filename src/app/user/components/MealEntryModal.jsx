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

export function MealEntryModal({ date, mealType, entry, foods, onSave, onClose }) {
  const [foodItems, setFoodItems] = useState([])
  const [emotion, setEmotion] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [newFoodMode, setNewFoodMode] = useState('select') // 'select' | 'custom'
  const [selectedFoodId, setSelectedFoodId] = useState('')
  const [customName, setCustomName] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (entry) {
      setEmotion(entry.emotion || '')
      setNote(entry.note || '')
      const items = (entry.meal_foods || []).map((mf) => ({
        food_id: mf.food_id,
        custom_name: mf.custom_name,
        quantity: parseFloat(mf.quantity) || 1,
        name: mf.foods?.name || mf.custom_name
      }))
      setFoodItems(items)
    } else {
      setFoodItems([])
      setEmotion('')
      setNote('')
    }
  }, [entry])

  const addFood = () => {
    if (newFoodMode === 'custom' && customName.trim()) {
      setFoodItems((prev) => [
        ...prev,
        { custom_name: customName.trim(), quantity: Number(quantity) || 1 }
      ])
      setCustomName('')
      setQuantity(1)
    } else if (newFoodMode === 'select' && selectedFoodId) {
      const food = foods.find((f) => f.id === selectedFoodId)
      if (food && !foodItems.some((i) => i.food_id === food.id)) {
        setFoodItems((prev) => [
          ...prev,
          { food_id: food.id, custom_name: null, quantity: Number(quantity) || 1, name: food.name }
        ])
        setSelectedFoodId('')
        setQuantity(1)
      }
    }
  }

  const removeFood = (index) => {
    setFoodItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (foodItems.length === 0) {
      setError('Añadí al menos un alimento')
      return
    }
    setLoading(true)
    try {
      const payload = {
        date,
        meal_type: mealType,
        emotion: emotion || null,
        note: note || null,
        foods: foodItems.map((f) => ({
          food_id: f.food_id || null,
          custom_name: f.custom_name || null,
          quantity: f.quantity
        }))
      }
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>
            {entry ? 'Editar' : 'Nueva'} entrada — {MEAL_LABELS[mealType]}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}

          <div className="modal-section">
            <label>Alimentos</label>
            {foodItems.length > 0 && (
              <ul className="food-list">
                {foodItems.map((item, i) => (
                  <li key={i}>
                    {item.name || item.custom_name} × {item.quantity}
                    <button type="button" onClick={() => removeFood(i)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="add-food-row">
              {foods?.length > 0 ? (
                <>
                  <select
                    value={newFoodMode}
                    onChange={(e) => setNewFoodMode(e.target.value)}
                  >
                    <option value="select">Seleccionar alimento</option>
                    <option value="custom">Personalizado</option>
                  </select>
                  {newFoodMode === 'select' ? (
                    <>
                      <select
                        value={selectedFoodId}
                        onChange={(e) => setSelectedFoodId(e.target.value)}
                      >
                        <option value="">Elegir...</option>
                        {foods.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.calories} kcal)
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Cant."
                      />
                      <button type="button" onClick={addFood}>
                        Añadir
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Nombre del alimento"
                      />
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Cant."
                      />
                      <button type="button" onClick={addFood}>
                        Añadir
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Nombre del alimento"
                  />
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Cant."
                  />
                  <button type="button" onClick={addFood}>
                    Añadir
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="modal-section">
            <label>Emoción</label>
            <select
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {EMOTIONS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-section">
            <label>Nota</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Observaciones..."
              rows={2}
            />
          </div>

          <footer className="modal-footer">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
