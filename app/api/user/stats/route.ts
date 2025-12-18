import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/user/stats
 * Returns user stats (XP, level, matches analyzed, etc.) for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request)
    
    // Get user from session (cookie-based)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user_stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching user stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch user stats' },
        { status: 500 }
      )
    }

    // If no stats exist, create default
    if (!userStats) {
      const { data: newStats, error: insertError } = await supabase
        .from('user_stats')
        .insert({
          user_id: user.id,
          total_xp: 0,
          level: 1,
          matches_analyzed: 0,
          modules_completed: 0,
          total_matches_played: 0,
          login_streak: 0
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating user stats:', insertError)
        return NextResponse.json(
          { error: 'Failed to create user stats' },
          { status: 500 }
        )
      }

      return NextResponse.json(newStats, {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      })
    }

    // Calculate progress to next level
    const xpForCurrentLevel = (userStats.level - 1) * 1000
    const xpForNextLevel = userStats.level * 1000
    const xpProgress = userStats.total_xp - xpForCurrentLevel
    const xpNeeded = xpForNextLevel - xpForCurrentLevel
    const progressToNextLevel = (xpProgress / xpNeeded) * 100

    return NextResponse.json({
      ...userStats,
      xpProgress,
      xpNeeded,
      progressToNextLevel: Math.min(100, Math.max(0, progressToNextLevel)),
      nextLevel: userStats.level + 1
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error in /api/user/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

