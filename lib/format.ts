const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** "2025-08-01" -> "Aug 2025" */
export function monthYear(d?: string | null): string {
  if (!d) return ''
  const [y, m] = d.split('-').map(Number)
  if (!y) return ''
  return `${MONTHS[(m ?? 1) - 1]} ${y}`
}

/**
 * A drafting-style date range.
 *  - start + end (same month)  -> a single date (a point-in-time item, e.g. a project)
 *  - start + end (different)   -> a range
 *  - start, no end             -> "Present" (an ongoing role)
 *  - end only                  -> that date (e.g. a completion / graduation)
 */
export function dateRange(start?: string | null, end?: string | null): string {
  if (start && end) {
    return monthYear(start) === monthYear(end)
      ? monthYear(start)
      : `${monthYear(start)} — ${monthYear(end)}`
  }
  if (start && !end) return `${monthYear(start)} — Present`
  if (!start && end) return monthYear(end)
  return ''
}

/** ISO date for <time dateTime> and the title block. */
export function isoDate(d?: string | null): string {
  return (d ?? new Date().toISOString()).slice(0, 10)
}
