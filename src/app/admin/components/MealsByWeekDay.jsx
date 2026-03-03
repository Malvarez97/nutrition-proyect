import { format, parseISO, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import './MealsByWeekDay.css'

const MEAL_LABELS = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Merienda'
}

function getEffectiveTime(entry) {
  return entry.meal_time || '12:00'
}

function getMealDisplayLabel(entry) {
  if (entry.meal_type === 'snack' && entry.meal_time && entry.meal_time !== '17:00') {
    return `Snack (${entry.meal_time})`
  }
  return MEAL_LABELS[entry.meal_type]
}

function groupEntriesByWeekAndDay(entries) {
  if (!entries?.length) return []
  const byWeek = {}
  for (const e of entries) {
    const weekStart = startOfWeek(parseISO(e.date), { weekStartsOn: 1 })
    const weekKey = format(weekStart, 'yyyy-MM-dd')
    if (!byWeek[weekKey]) byWeek[weekKey] = {}
    const dayKey = e.date
    if (!byWeek[weekKey][dayKey]) byWeek[weekKey][dayKey] = []
    byWeek[weekKey][dayKey].push(e)
  }
  return Object.entries(byWeek)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([weekKey, daysObj]) => {
      const weekStart = parseISO(weekKey)
      const weekEnd = addDays(weekStart, 6)
      const days = []
      for (let i = 0; i < 7; i++) {
        const d = addDays(weekStart, i)
        const dateStr = format(d, 'yyyy-MM-dd')
        const dayEntries = (daysObj[dateStr] || []).sort(
          (a, b) => getEffectiveTime(a).localeCompare(getEffectiveTime(b))
        )
        days.push({ date: d, dateStr, label: format(d, 'EEE d', { locale: es }), entries: dayEntries })
      }
      return { weekKey, weekStart, weekEnd, days }
    })
}

function MealEntryCard({ entry }) {
  return (
    <div className="meal-entry-card">
      <div className="meal-entry-header">
        <span className="meal-type">{getMealDisplayLabel(entry)}</span>
        {entry.emotion && <span className="meal-emotion">{entry.emotion}</span>}
      </div>
      <div className="meal-foods-list">
        {(entry.meal_foods || []).map((mf) => (
          <div key={mf.id} className="meal-food-item">
            <span className="food-name">
              {mf.foods?.name || mf.custom_name || 'Alimento'}
            </span>
            <span className="food-qty">
              {mf.quantity} {mf.unit || 'g'}
            </span>
          </div>
        ))}
      </div>
      {entry.note && <p className="meal-note"><em>{entry.note}</em></p>}
    </div>
  )
}

export function MealsByWeekDay({ mealEntries, hideWeekTitle }) {
  const weeksWithDays = groupEntriesByWeekAndDay(mealEntries || [])

  if (weeksWithDays.length === 0) {
    return <p className="no-data">Sin registros de comidas</p>
  }

  return (
    <div className="meals-by-week-day">
      {weeksWithDays.map(({ weekKey, weekStart, weekEnd, days }) => (
        <section key={weekKey} className="week-block">
          {!hideWeekTitle && (
            <h3 className="week-title">
              Semana {format(weekStart, 'd MMM', { locale: es })} –{' '}
              {format(weekEnd, 'd MMM yyyy', { locale: es })}
            </h3>
          )}
          <div className="week-days-grid">
            {days.map((day) => (
              <div
                key={day.dateStr}
                className={`day-column ${day.entries.length === 0 ? 'day-empty' : ''}`}
              >
                <div className="day-header">
                  {format(day.date, 'EEE', { locale: es })}
                  <span className="day-date">{format(day.date, 'd')}</span>
                </div>
                <div className="day-entries">
                  {day.entries.map((entry) => (
                    <MealEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
