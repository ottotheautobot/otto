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

  // Sort dates
  const sorted = [...dates].sort()

  // Group consecutive dates
  const ranges: Array<{ start: Date; end: Date }> = []
  let currentStart = new Date(sorted[0])
  let currentEnd = new Date(sorted[0])

  for (let i = 1; i < sorted.length; i++) {
    const nextDate = new Date(sorted[i])
    const nextDay = new Date(currentEnd)
    nextDay.setDate(nextDay.getDate() + 1)

    if (nextDate.getTime() === nextDay.getTime()) {
      // Consecutive, extend range
      currentEnd = nextDate
    } else {
      // Gap, save range and start new one
      ranges.push({ start: currentStart, end: currentEnd })
      currentStart = nextDate
      currentEnd = nextDate
    }
  }
  ranges.push({ start: currentStart, end: currentEnd })

  // Format ranges
  const formatted = ranges.map((range) => {
    const startMonth = range.start.toLocaleDateString('en-US', { month: 'short' })
    const startDay = range.start.getDate()
    const endDay = range.end.getDate()

    if (range.start.getTime() === range.end.getTime()) {
      // Single day
      return `${startMonth} ${startDay}`
    } else if (range.start.getMonth() === range.end.getMonth()) {
      // Same month
      return `${startMonth} ${startDay}-${endDay}`
    } else {
      // Different months
      const endMonth = range.end.toLocaleDateString('en-US', { month: 'short' })
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
    }
  })

  return formatted.join(', ')
}
