export function todayKey() {
  return formatDateKey(new Date())
}

export function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }

  const text = String(value).trim()
  if (!text) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function formatDisplayDate(value, options = { month: 'short', day: 'numeric' }) {
  const date = parseDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', options).format(date)
}

export function daysUntil(value) {
  const date = parseDate(value)
  if (!date) return null
  const today = parseDate(todayKey())
  return Math.round((date.getTime() - today.getTime()) / 86400000)
}

export function shiftDate(value, offsetDays) {
  const date = parseDate(value) ?? parseDate(todayKey())
  date.setDate(date.getDate() + offsetDays)
  return formatDateKey(date)
}

export function startOfMonth(value) {
  const date = parseDate(value) ?? parseDate(todayKey())
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function buildMonthGrid(value) {
  const month = startOfMonth(value)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const startDay = month.getDay()
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - startDay + 1
    if (day < 1 || day > daysInMonth) return null
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    return {
      dateKey: formatDateKey(date),
      day,
      isToday: formatDateKey(date) === todayKey(),
    }
  })
}

export function monthLabel(value) {
  const date = startOfMonth(value)
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}
