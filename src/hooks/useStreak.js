import { useMemo } from 'react'
import { format, parseISO, subDays } from 'date-fns'

export function useStreak(datesWithEntries) {
  return useMemo(() => {
    if (!datesWithEntries?.length) return { current: 0, max: 0 }
    const set = new Set(
      datesWithEntries.map((d) =>
        typeof d === 'string' ? d : format(d, 'yyyy-MM-dd')
      )
    )
    const today = format(new Date(), 'yyyy-MM-dd')
    let current = 0
    let day = today
    while (set.has(day)) {
      current++
      day = format(subDays(parseISO(day), 1), 'yyyy-MM-dd')
    }
    let max = 0
    const sorted = [...set].sort()
    let run = 1
    for (let i = 1; i < sorted.length; i++) {
      const prev = parseISO(sorted[i - 1])
      const curr = parseISO(sorted[i])
      const diff = Math.round((prev - curr) / (1000 * 60 * 60 * 24))
      if (diff === 1) run++
      else run = 1
      max = Math.max(max, run)
    }
    max = Math.max(max, run, current)
    return { current, max }
  }, [datesWithEntries])
}
