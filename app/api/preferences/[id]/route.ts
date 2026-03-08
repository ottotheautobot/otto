import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('booking_preferences')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE preference error:', error)
    return NextResponse.json(
      { error: 'Failed to delete preference' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const { data, error } = await supabase
      .from('booking_preferences')
      .update({
        party_size: body.party_size,
        target_dates: body.target_dates,
        preferred_times: body.preferred_times,
        priority: body.priority,
        active: body.active !== undefined ? body.active : true,
        notes: body.notes,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH preference error:', error)
    return NextResponse.json(
      { error: 'Failed to update preference' },
      { status: 500 }
    )
  }
}
