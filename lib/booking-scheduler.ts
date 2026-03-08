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
        
        for (const targetDate of targetDates) {
          const preferredTime = (pref.preferred_times as any)?.exact || '19:00'
          
          try {
            // Log attempt
            await supabase.from('activity_log').insert({
              restaurant_id: restaurant.id,
              booking_preference_id: pref.id,
              action: 'booking_attempted',
              target_date: targetDate,
              target_time: preferredTime,
              status: 'pending',
              details: { partySize: pref.party_size },
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
                details: { reason: 'No availability at preferred time' },
              })

              attempts.push({
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                date: targetDate,
                time: preferredTime,
                partySize: pref.party_size,
                success: false,
                message: 'No availability',
              })
              continue
            }

            // Find slot closest to preferred time
            const slot = availability.slots.find((s: any) => s.time === preferredTime)
            
            if (!slot) {
              attempts.push({
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                date: targetDate,
                time: preferredTime,
                partySize: pref.party_size,
                success: false,
                message: 'Preferred time not available',
              })
              continue
            }

            // Attempt booking
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
                booked_time: preferredTime,
                party_size: pref.party_size,
                resy_confirmation_url: `https://resy.com/reservations/${booking.id}`,
                status: 'confirmed',
              })

              await supabase.from('activity_log').insert({
                restaurant_id: restaurant.id,
                booking_preference_id: pref.id,
                action: 'success',
                target_date: targetDate,
                target_time: preferredTime,
                status: 'success',
                details: { bookingId: booking.id },
              })

              attempts.push({
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                date: targetDate,
                time: preferredTime,
                partySize: pref.party_size,
                success: true,
                message: `Booked! Confirmation: ${booking.id}`,
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
              target_time: preferredTime,
              status: 'failed',
              details: { error: error.message },
            })

            attempts.push({
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              date: targetDate,
              time: preferredTime,
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
