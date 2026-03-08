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
