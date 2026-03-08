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
      const response = await fetch(
        `${RESY_API_BASE}/venue/${venueId}/availability?date=${date}&party_size=${partySize}`,
        {
          method: 'GET',
          headers: {
            'authorization': `Bearer ${this.apiKey}`,
            'x-resy-auth-token': this.authToken,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.status === 429) {
        throw new Error('RATE_LIMITED')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Resy API Error: ${error.message || response.statusText}`)
      }

      const data = await response.json()
      return data.results
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
