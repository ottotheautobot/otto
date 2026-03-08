const RESY_API_BASE = 'https://api.resy.com/3'

interface ResyAvailability {
  date: string
  slots: ResySlot[]
}

interface ResySlot {
  id: string
  time: string
  partySize: number
  available: boolean
}

interface ResyBookingRequest {
  bookToken: string
  sourceId: string
  partySize: number
}

export class ResyClient {
  private apiKey: string
  private authToken: string

  constructor(apiKey: string, authToken: string) {
    this.apiKey = apiKey
    this.authToken = authToken
  }

  async findAvailability(venueId: string, date: string, partySize: number) {
    try {
      const url = `${RESY_API_BASE}/find`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `ResyAPI api_key="${this.apiKey}"`,
          'x-resy-auth-token': this.authToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: 0,
          long: 0,
          day: date,
          party_size: partySize,
          venue_id: venueId,
        }),
      })

      if (response.status === 429) {
        throw new Error('RATE_LIMITED')
      }

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Resy API Error (${response.status}): ${text.substring(0, 100)}`)
      }

      const data = await response.json()
      
      // Extract available times from notify_options
      if (data.results?.venues?.[0]?.venue?.notify_options) {
        const options = data.results.venues[0].venue.notify_options
        return options.map((opt: any) => ({
          min_time: opt.min_request_datetime,
          max_time: opt.max_request_datetime,
          step_minutes: opt.step_minutes,
        }))
      }
      
      return []
    } catch (error) {
      console.error('ResyClient.findAvailability error:', error)
      throw error
    }
  }

  async bookReservation(
    bookToken: string,
    sourceId: string,
    partySize: number,
    guestEmail: string,
    guestFirstName: string,
    guestLastName: string
  ) {
    try {
      const response = await fetch(`${RESY_API_BASE}/booking`, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${this.apiKey}`,
          'x-resy-auth-token': this.authToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          book_token: bookToken,
          source_id: sourceId,
          party_size: partySize,
          guest_email: guestEmail,
          guest_first_name: guestFirstName,
          guest_last_name: guestLastName,
        }),
      })

      if (response.status === 429) {
        throw new Error('RATE_LIMITED')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Resy API Error: ${error.message || response.statusText}`)
      }

      const data = await response.json()
      return data.booking
    } catch (error) {
      console.error('ResyClient.bookReservation error:', error)
      throw error
    }
  }
}
