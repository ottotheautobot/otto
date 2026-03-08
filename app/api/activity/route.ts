import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const restaurantId = searchParams.get('restaurant_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('activity_log')
      .select('*, restaurants(name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity log' },
      { status: 500 }
    )
  }
}
