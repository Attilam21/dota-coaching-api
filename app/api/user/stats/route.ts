import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request)
    
    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch user stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsError) {
      // If stats don't exist, create them
      if (statsError.code === 'PGRST116') {
        const { data: newStats, error: createError } = await supabase
          .from('user_stats')
          .insert({
            user_id: userId,
            total_xp: 0,
            level: 1,
            matches_analyzed: 0,
            modules_completed: 0,
          } as any)
          .select()
          .single()

        if (createError) {
          console.error('Error creating user stats:', createError)
          return NextResponse.json(
            { error: 'Failed to create user stats' },
            { status: 500 }
          )
        }

        const statsData = newStats as any
        return NextResponse.json({
          totalXp: statsData.total_xp,
          level: statsData.level,
          matchesAnalyzed: statsData.matches_analyzed,
          modulesCompleted: statsData.modules_completed,
          updatedAt: statsData.updated_at,
        })
      }

      console.error('Error fetching user stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch user stats' },
        { status: 500 }
      )
    }

    const statsData = stats as any
    return NextResponse.json({
      totalXp: statsData.total_xp,
      level: statsData.level,
      matchesAnalyzed: statsData.matches_analyzed,
      modulesCompleted: statsData.modules_completed,
      updatedAt: statsData.updated_at,
    })
  } catch (error) {
    console.error('Error in user stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

