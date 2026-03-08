import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Restaurant } from '@/lib/supabase'

// GET all restaurants
export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/restaurants error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    )
  }
}

// POST create restaurant
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<Restaurant>

    if (!body.name || !body.resy_venue_id) {
      return NextResponse.json(
        { error: 'name and resy_venue_id required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        name: body.name,
        resy_venue_id: body.resy_venue_id,
        location: body.location || null,
        release_pattern: body.release_pattern || 'unknown',
        release_day: body.release_day || null,
        release_time: body.release_time || null,
        default_party_size: body.default_party_size || 2,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/restaurants error:', error)
    return NextResponse.json(
      { error: 'Failed to create restaurant' },
      { status: 500 }
    )
  }
}
