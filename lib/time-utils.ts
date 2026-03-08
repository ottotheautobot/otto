/**
 * Convert 24-hour time (HH:MM) to 12-hour AM/PM format
 * @param time24 - Time in 24-hour format (HH:MM)
 * @returns Time in 12-hour AM/PM format (h:mm AM/PM)
 */
export function format12Hour(time24: string): string {
  if (!time24) return ''
  
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours, 10)
  const minute = minutes

  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12

  return `${hour12}:${minute} ${ampm}`
}

/**
 * Convert 12-hour AM/PM to 24-hour format for storage
 * @param time12 - Time in 12-hour format (h:mm AM/PM)
 * @returns Time in 24-hour format (HH:MM)
 */
export function format24Hour(time12: string): string {
  if (!time12) return ''
  
  const [time, period] = time12.split(' ')
  const [hours, minutes] = time.split(':')
  let hour = parseInt(hours, 10)

  if (period === 'PM' && hour !== 12) {
    hour += 12
  } else if (period === 'AM' && hour === 12) {
    hour = 0
  }

  return `${String(hour).padStart(2, '0')}:${minutes}`
}

/**
 * Convert array of dates into compact range format
 * @param dates - Array of dates (YYYY-MM-DD format)
 * @returns Compact range string like "Apr 7-10, 14-15"
 */
export function formatDateRanges(dates: string[]): string {
  if (!dates || dates.length === 0) return ''

  // Sort and parse dates
  const sortedDates = [...dates].sort()
  const parsedDates = sortedDates.map((dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return { year, month, day, dateStr }
  })

  // Group consecutive dates
  const ranges: Array<Array<{ year: number; month: number; day: number; dateStr: string }>> = []
  let currentRange = [parsedDates[0]]

  for (let i = 1; i < parsedDates.length; i++) {
    const prev = currentRange[currentRange.length - 1]
    const curr = parsedDates[i]

    // Check if consecutive
    const prevDate = new Date(prev.year, prev.month - 1, prev.day)
    const currDate = new Date(curr.year, curr.month - 1, curr.day)
    const nextDay = new Date(prevDate)
    nextDay.setDate(nextDay.getDate() + 1)

    if (currDate.getTime() === nextDay.getTime()) {
      currentRange.push(curr)
    } else {
      ranges.push(currentRange)
      currentRange = [curr]
    }
  }
  ranges.push(currentRange)

  // Format ranges
  const formatted = ranges.map((range) => {
    const start = range[0]
    const end = range[range.length - 1]

    const startDate = new Date(start.year, start.month - 1, start.day)
    const endDate = new Date(end.year, end.month - 1, end.day)

    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' })

    if (range.length === 1) {
      return `${startMonth} ${start.day}`
    } else if (start.month === end.month) {
      return `${startMonth} ${start.day}-${end.day}`
    } else {
      return `${startMonth} ${start.day} - ${endMonth} ${end.day}`
    }
  })

  return formatted.join(', ')
}
