import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { mealsService } from '../../services/meals'
import { foodsService } from '../../services/foods'
import { MealEntryModal } from './components/MealEntryModal'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import './DiarioNutricional.css'

const MEAL_LABELS = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Merienda'
}

function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** Infiere el tipo de comida según la hora (para quick-add) */
function inferMealTypeByHour() {
  const h = new Date().getHours()
  if (h >= 5 && h < 10) return 'breakfast'
  if (h >= 10 && h < 14) return 'lunch'
  if (h >= 14 && h < 19) return 'snack'
  return 'dinner'
}

export function DiarioNutricionalPage() {
  const { user } = useAuth()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [entries, setEntries] = useState([])
  const [expandedDay, setExpandedDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState(null)
  const [modalMealType, setModalMealType] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)
  const [foods, setFoods] = useState([])

  const weekDates = getWeekDates(weekStart)
  const startStr = format(weekStart, 'yyyy-MM-dd')
  const endStr = format(addDays(weekStart, 6), 'yyyy-MM-dd')

  const today = new Date()

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setLoading(true)
      try {
        const [entriesData, foodsData] = await Promise.all([
          mealsService.getEntriesByDateRange(user.id, startStr, endStr),
          foodsService.getAvailableFoods().catch(() => [])
        ])
        setEntries(entriesData)
        setFoods(foodsData)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id, startStr, endStr])

  // Autoexpandir hoy al cargar o al cambiar de semana (si hoy está en la semana visible)
  useEffect(() => {
    const weekStartDate = parseISO(startStr)
    const weekEndDate = addDays(weekStartDate, 6)
    const todayStr = format(today, 'yyyy-MM-dd')
    if (todayStr >= startStr && todayStr <= format(weekEndDate, 'yyyy-MM-dd')) {
      setExpandedDay(parseISO(todayStr))
    }
  }, [startStr])

  const openAddModal = (date, mealType) => {
    setEditingEntry(null)
    setModalDate(date)
    setModalMealType(mealType)
    setModalOpen(true)
  }

  const openQuickAdd = () => {
    const todayStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const currentWeekStartStr = format(weekStart, 'yyyy-MM-dd')
    const currentWeekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd')
    if (todayStr < currentWeekStartStr || todayStr > currentWeekEndStr) {
      setWeekStart(todayStart)
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

  const handleSave = async (payload) => {
    if (!user?.id) return
    try {
      if (editingEntry) {
        await mealsService.updateEntry(editingEntry.id, payload, payload.foods)
      } else {
        await mealsService.createEntry(user.id, payload, payload.foods)
      }
      closeModal()
      const [entriesData] = await Promise.all([
        mealsService.getEntriesByDateRange(user.id, startStr, endStr)
      ])
      setEntries(entriesData)
    } catch (e) {
      throw e
    }
  }

  const handleDelete = async (entryId) => {
    if (!confirm('¿Eliminar este registro?')) return
    try {
      await mealsService.deleteEntry(entryId)
      const [entriesData] = await Promise.all([
        mealsService.getEntriesByDateRange(user.id, startStr, endStr)
      ])
      setEntries(entriesData)
    } catch (e) {
      console.error(e)
    }
  }

  const getEntriesForDay = (date) =>
    entries.filter((e) => isSameDay(parseISO(e.date), date))

  const prevWeek = () => setWeekStart((d) => addDays(d, -7))
  const nextWeek = () => setWeekStart((d) => addDays(d, 7))
  const goToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  if (loading) return <div className="diario-loading">Cargando...</div>

  return (
    <div className="diario-page">
      <header className="diario-header">
        <h1>Diario nutricional</h1>
        <div className="diario-week-nav">
          <button onClick={prevWeek}>←</button>
          <span>
            {format(weekStart, 'd MMM', { locale: es })} –{' '}
            {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: es })}
          </span>
          <button onClick={nextWeek}>→</button>
          <button onClick={goToday} className="btn-today">
            Hoy
          </button>
        </div>
      </header>

      <div className="diario-week">
        {weekDates.map((date) => (
          <DayColumn
            key={date.toISOString()}
            date={date}
            entries={getEntriesForDay(date)}
            expanded={expandedDay && isSameDay(expandedDay, date)}
            onToggle={() => setExpandedDay((d) => (d && isSameDay(d, date) ? null : date))}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <button
        type="button"
        className="diario-fab"
        onClick={openQuickAdd}
        aria-label="Añadir comida"
      >
        <span className="diario-fab-icon">+</span>
        <span className="diario-fab-label">Añadir comida</span>
      </button>

      {modalOpen && (
        <MealEntryModal
          date={modalDate}
          mealType={modalMealType}
          entry={editingEntry}
          foods={foods}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

function DayColumn({ date, entries, expanded, onToggle, onAdd, onEdit, onDelete }) {
  const dayEntries = entries || []
  const grouped = Object.entries(MEAL_LABELS).map(([type, label]) => ({
    type,
    label,
    items: dayEntries.filter((e) => e.meal_type === type)
  }))

  return (
    <div className={`day-column ${expanded ? 'expanded' : ''}`}>
      <button className="day-header" onClick={onToggle}>
        <span className="day-name">{format(date, 'EEE', { locale: es })}</span>
        <span className="day-num">{format(date, 'd')}</span>
        <span className="day-count">{dayEntries.length}</span>
      </button>
      {expanded && (
        <div className="day-content">
          {grouped.map(({ type, label, items }) => (
            <div key={type} className="meal-block">
              <div className="meal-block-header">
                <span>{label}</span>
                <button
                  className="btn-add-small"
                  onClick={() => onAdd(format(date, 'yyyy-MM-dd'), type)}
                  title={`Añadir ${label}`}
                >
                  +
                </button>
              </div>
              <ul>
                {items.map((entry) => (
                  <li key={entry.id} className="meal-item">
                    <button
                      className="meal-item-content"
                      onClick={() => onEdit(entry)}
                    >
                      {entry.meal_foods?.map((mf, i) => (
                        <span key={mf?.id || i}>
                          {mf?.foods?.name || mf?.custom_name} × {mf?.quantity}
                        </span>
                      ))}
                      {entry.emotion && (
                        <span className="meal-emotion">{entry.emotion}</span>
                      )}
                    </button>
                    <button
                      className="btn-delete-small"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(entry.id)
                      }}
                      title="Eliminar"
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
  )
}
