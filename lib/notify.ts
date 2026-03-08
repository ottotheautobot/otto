import { supabase } from './supabase'

export async function notifyBooking(
  restaurantName: string,
  date: string,
  time: string,
  partySize: number,
  resyUrl: string
) {
  try {
    // Format message
    const message = `
🎉 **Booking Confirmed!**

Restaurant: ${restaurantName}
Date: ${date}
Time: ${time}
Party Size: ${partySize}

[View on Resy](${resyUrl})
`.trim()

    // Send via OpenClaw message tool (will be called from cron)
    console.log('Notification (would send to Telegram):', message)

    return { success: true, message }
  } catch (error) {
    console.error('Notification error:', error)
    throw error
  }
}

export async function notifyFailure(
  restaurantName: string,
  date: string,
  time: string,
  reason: string
) {
  try {
    const message = `
⚠️ **Booking Failed**

Restaurant: ${restaurantName}
Date: ${date}
Time: ${time}
Reason: ${reason}

Retrying next release window...
`.trim()

    console.log('Notification (would send to Telegram):', message)

    return { success: true, message }
  } catch (error) {
    console.error('Notification error:', error)
    throw error
  }
}
