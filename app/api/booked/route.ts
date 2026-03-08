import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('booked_confirmations')
      .select('*, restaurants(name)')
      .order('booked_date', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/booked error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booked confirmations' },
      { status: 500 }
    )
  }
}
