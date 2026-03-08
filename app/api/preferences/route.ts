import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { BookingPreference } from '@/lib/supabase'

// GET preferences for a restaurant
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const restaurantId = searchParams.get('restaurant_id')

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurant_id required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('booking_preferences')
      .select('*')
      .eq('restaurant_id', restaurantId)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// POST create/update preference
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<BookingPreference>

    if (!body.restaurant_id) {
      return NextResponse.json(
        { error: 'restaurant_id required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('booking_preferences')
      .insert({
        restaurant_id: body.restaurant_id,
        party_size: body.party_size || 2,
        target_dates: body.target_dates || [],
        target_date_range: body.target_date_range,
        preferred_times: body.preferred_times,
        priority: body.priority || 5,
        active: true,
        notes: body.notes,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to create preference' },
      { status: 500 }
    )
  }
}

// PATCH update preference
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Partial<BookingPreference> & { id: string }

    if (!body.id) {
      return NextResponse.json(
        { error: 'id required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('booking_preferences')
      .update({
        party_size: body.party_size,
        target_dates: body.target_dates,
        target_date_range: body.target_date_range,
        preferred_times: body.preferred_times,
        priority: body.priority,
        active: body.active,
        notes: body.notes,
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH /api/preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to update preference' },
      { status: 500 }
    )
  }
}
