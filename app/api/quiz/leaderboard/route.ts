import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || 'total' // 'total', 'streak', 'best_score'

    let orderBy = 'total_score'
    if (type === 'streak') orderBy = 'streak_days'
    if (type === 'best') orderBy = 'best_score'

    const { data, error } = await supabase
      .from('quiz_leaderboard')
      .select(`
        *,
        users:user_id (
          email
        )
      `)
      .order(orderBy, { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      )
    }

    // Format response (hide sensitive data)
    const leaderboard = data?.map((entry: any) => ({
      user_id: entry.user_id,
      email: entry.users?.email ? entry.users.email.split('@')[0] + '@***' : 'Anonymous',
      total_score: entry.total_score,
      games_played: entry.games_played,
      best_score: entry.best_score,
      average_score: parseFloat(entry.average_score || 0),
      perfect_games: entry.perfect_games,
      streak_days: entry.streak_days,
      last_played_at: entry.last_played_at,
    })) || []

    return NextResponse.json({
      leaderboard,
      type,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300', // Cache 5 minutes
      },
    })
  } catch (error) {
    console.error('Error in leaderboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

