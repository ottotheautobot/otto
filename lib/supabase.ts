import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

export type Tables<T extends keyof any> = T extends 'restaurants' ? Restaurant
  : T extends 'booking_preferences' ? BookingPreference
  : T extends 'activity_log' ? ActivityLog
  : T extends 'booked_confirmations' ? BookedConfirmation
  : T extends 'resy_credentials' ? ResyCredentials
  : never

export interface Restaurant {
  id: string
  name: string
  resy_venue_id: string
  location?: string
  enabled: boolean
  release_pattern: 'daily' | 'weekly' | 'manual' | 'unknown'
  release_day?: string
  release_time?: string
  release_frequency_days?: number
  default_party_size: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface BookingPreference {
  id: string
  restaurant_id: string
  party_size: number
  target_dates: string[]
  target_date_range?: { start: string; end: string }
  preferred_times?: { start: string; end: string } | { exact: string }
  priority: number
  active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  restaurant_id: string
  booking_preference_id?: string
  action: string
  target_date?: string
  target_time?: string
  status: 'pending' | 'success' | 'failed' | 'skipped'
  details: Record<string, any>
  created_at: string
}

export interface BookedConfirmation {
  id: string
  restaurant_id: string
  booking_preference_id?: string
  resy_booking_id?: string
  booked_date: string
  booked_time: string
  party_size: number
  resy_confirmation_url?: string
  status: 'confirmed' | 'cancelled' | 'no-show'
  notes?: string
  created_at: string
  cancelled_at?: string
}

export interface ResyCredentials {
  id: string
  api_key: string
  auth_token: string
  created_at: string
  last_used_at?: string
  expires_at?: string
}
