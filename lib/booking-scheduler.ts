import { supabase, Restaurant, BookingPreference } from './supabase'
import { ResyClient } from './resy-client'

const RESY_API_KEY = process.env.RESY_API_KEY!
const RESY_AUTH_TOKEN = process.env.RESY_AUTH_TOKEN!

export interface BookingAttempt {
  restaurantId: string
  restaurantName: string
  date: string
  time: string
  partySize: number
  success: boolean
  message: string
}

export async function runBookingScheduler(): Promise<BookingAttempt[]> {
  const attempts: BookingAttempt[] = []

  try {
    // Get all enabled restaurants
    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('enabled', true)

    if (restError) throw restError

    if (!restaurants || restaurants.length === 0) {
      console.log('No restaurants to process')
      return attempts
    }

    const resy = new ResyClient(RESY_API_KEY, RESY_AUTH_TOKEN)

    // For each restaurant
    for (const restaurant of restaurants as Restaurant[]) {
      // Get booking preferences
      const { data: prefs, error: prefError } = await supabase
        .from('booking_preferences')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('active', true)

      if (prefError) {
        console.error(`Error loading preferences for ${restaurant.name}:`, prefError)
        continue
      }

      if (!prefs || prefs.length === 0) {
        console.log(`No active preferences for ${restaurant.name}`)
        continue
      }

      // For each preference
      for (const pref of prefs as BookingPreference[]) {
        // Check if target dates include today or within next 30 days
        const targetDates = pref.target_dates || []
        const timeRange = pref.preferred_times as any
        const startTime = timeRange?.start || '17:00' // Default 5pm
        const endTime = timeRange?.end || '22:00' // Default 10pm
        
        for (const targetDate of targetDates) {
          
          try {
            // Log attempt
            await supabase.from('activity_log').insert({
              restaurant_id: restaurant.id,
              booking_preference_id: pref.id,
              action: 'booking_attempted',
              target_date: targetDate,
              target_time: `${startTime}-${endTime}`,
              status: 'pending',
              details: { partySize: pref.party_size, timeRange: { start: startTime, end: endTime } },
            })

            // Try to find availability
            const availability = await resy.findAvailability(
              restaurant.resy_venue_id,
              targetDate,
              pref.party_size
            )

            if (!availability || !availability.slots || availability.slots.length === 0) {
              // No availability
              await supabase.from('activity_log').insert({
                restaurant_id: restaurant.id,
                booking_preference_id: pref.id,
                action: 'release_detected',
                target_date: targetDate,
                status: 'failed',
                details: { reason: 'No availability in time range' },
              })

              attempts.push({
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                date: targetDate,
                time: `${startTime}-${endTime}`,
                partySize: pref.party_size,
                success: false,
                message: 'No availability in range',
              })
              continue
            }

            // Find earliest slot within preferred time range
            const slotsInRange = availability.slots
              .filter((s: any) => {
                const slotTime = s.time // Format: HH:MM
                return slotTime >= startTime && slotTime <= endTime
              })
              .sort((a: any, b: any) => a.time.localeCompare(b.time))

            const slot = slotsInRange[0]
            
            if (!slot) {
              attempts.push({
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                date: targetDate,
                time: `${startTime}-${endTime}`,
                partySize: pref.party_size,
                success: false,
                message: 'No availability in preferred time range',
              })
              continue
            }

            // Attempt booking
            const bookedTime = slot.time
            const booking = await resy.bookReservation(
              slot.id,
              restaurant.resy_venue_id,
              pref.party_size,
              'guest@example.com', // Placeholder - should come from user prefs
              'Guest',
              'User'
            )

            if (booking && booking.id) {
              // Success!
              await supabase.from('booked_confirmations').insert({
                restaurant_id: restaurant.id,
                booking_preference_id: pref.id,
                resy_booking_id: booking.id,
                booked_date: targetDate,
                booked_time: bookedTime,
                party_size: pref.party_size,
                resy_confirmation_url: `https://resy.com/reservations/${booking.id}`,
                status: 'confirmed',
              })

              await supabase.from('activity_log').insert({
                restaurant_id: restaurant.id,
                booking_preference_id: pref.id,
                action: 'success',
                target_date: targetDate,
                target_time: bookedTime,
                status: 'success',
                details: { bookingId: booking.id, preferredRange: { start: startTime, end: endTime } },
              })

              attempts.push({
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                date: targetDate,
                time: bookedTime,
                partySize: pref.party_size,
                success: true,
                message: `Booked at ${bookedTime}! Range was ${startTime}-${endTime}`,
              })
            }
          } catch (error: any) {
            console.error(
              `Error booking ${restaurant.name} on ${targetDate}:`,
              error.message
            )

            const status = error.message === 'RATE_LIMITED' ? 'rate_limited' : 'failed'
            await supabase.from('activity_log').insert({
              restaurant_id: restaurant.id,
              booking_preference_id: pref.id,
              action: status,
              target_date: targetDate,
              target_time: `${startTime}-${endTime}`,
              status: 'failed',
              details: { error: error.message },
            })

            attempts.push({
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              date: targetDate,
              time: `${startTime}-${endTime}`,
              partySize: pref.party_size,
              success: false,
              message: error.message,
            })
          }
        }
      }
    }
  } catch (error) {
    console.error('Booking scheduler error:', error)
  }

  return attempts
}
