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
        release_pattern: body.release_pattern,
        release_day: body.release_day || null,
        release_time: body.release_time || null,
        location: body.location,
        notes: body.notes,
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
