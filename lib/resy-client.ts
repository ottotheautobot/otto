const RESY_API_BASE = 'https://api.resy.com/3'

export interface ResyVenue {
  id: string
  name: string
  location: string
  releasePattern?: string
}

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

  async searchVenues(query: string, location = 'New York'): Promise<ResyVenue[]> {
    try {
      const response = await fetch(
        `${RESY_API_BASE}/find?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`,
        {
          method: 'GET',
          headers: {
            'authorization': `Bearer ${this.apiKey}`,
            'x-resy-auth-token': this.authToken,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Resy search failed: ${response.statusText}`)
      }

      const data = await response.json()
      const venues = (data.results?.venues || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        location: v.location?.name || location,
      }))

      return venues
    } catch (error) {
      console.error('ResyClient.searchVenues error:', error)
      throw error
    }
  }

  async getVenueDetails(venueId: string): Promise<any> {
    try {
      const response = await fetch(
        `${RESY_API_BASE}/venue/${venueId}`,
        {
          method: 'GET',
          headers: {
            'authorization': `Bearer ${this.apiKey}`,
            'x-resy-auth-token': this.authToken,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch venue details: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('ResyClient.getVenueDetails error:', error)
      throw error
    }
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
