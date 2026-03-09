import { supabase, Restaurant, BookingPreference } from './supabase'
import { ResyClient } from './resy-client'

const BOOKING_SERVER_URL = process.env.BOOKING_SERVER_URL || 'http://localhost:3000'
const BOOKING_SERVER_TOKEN = process.env.BOOKING_SERVER_TOKEN || 'test-token'

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

            if (!availability.available || !availability.slots || availability.slots.length === 0) {
              // No availability
              await supabase.from('activity_log').insert({
                restaurant_id: restaurant.id,
                booking_preference_id: pref.id,
                action: 'checked',
                target_date: targetDate,
                status: 'no_availability',
                details: { reason: 'No availability found' },
              })

              attempts.push({
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                date: targetDate,
                time: `${startTime}-${endTime}`,
                partySize: pref.party_size,
                success: false,
                message: 'No availability',
              })
              continue
            }

            // Found availability! Call booking service
            const notifyOpt = availability.slots[0]
            const minTime = notifyOpt.min_time // Format: "2026-03-17 16:30:00"
            const timeMatch = minTime.match(/(\d{2}):(\d{2}):00/)
            const timeSlot = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : '19:00'

            console.log(`Calling booking service at ${BOOKING_SERVER_URL}`)

            const bookingResponse = await fetch(`${BOOKING_SERVER_URL}/book`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: BOOKING_SERVER_TOKEN,
                venue_id: restaurant.resy_venue_id,
                date: targetDate,
                party_size: pref.party_size,
                time_slot: timeSlot,
                first_name: 'Guest',
                last_name: 'User',
                email: 'guest@example.com',
              }),
            })

            const bookingData = await bookingResponse.json()

            if (bookingData.success && bookingData.reservation_id) {
              // Success!
              await supabase.from('booked_confirmations').insert({
                restaurant_id: restaurant.id,
                booking_preference_id: pref.id,
                resy_booking_id: bookingData.reservation_id,
                booked_date: targetDate,
                booked_time: timeSlot,
                party_size: pref.party_size,
                status: 'confirmed',
              })

              await supabase.from('activity_log').insert({
                restaurant_id: restaurant.id,
                booking_preference_id: pref.id,
                action: 'success',
                target_date: targetDate,
                target_time: timeSlot,
                status: 'success',
                details: { bookingId: bookingData.reservation_id },
              })

              attempts.push({
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                date: targetDate,
                time: timeSlot,
                partySize: pref.party_size,
                success: true,
                message: `Booked! Confirmation #${bookingData.reservation_id}`,
              })
            } else {
              attempts.push({
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                date: targetDate,
                time: timeSlot,
                partySize: pref.party_size,
                success: false,
                message: bookingData.error || 'Booking failed',
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
