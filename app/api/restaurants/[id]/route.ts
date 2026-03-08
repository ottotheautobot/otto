import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const { data, error } = await supabase
      .from('restaurants')
      .update({
        name: body.name,
        resy_venue_id: body.resy_venue_id,
        location: body.location || null,
        release_pattern: body.release_pattern,
        release_day: body.release_day || null,
        release_time: body.release_time || null,
        notes: body.notes || null,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH restaurant error:', error)
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    )
  }
}
