import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/user/achievements
 * Returns all achievements with user's unlock status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .order('xp_reward', { ascending: false })

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError)
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      )
    }

    // Fetch user's unlocked achievements
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', user.id)

    if (userAchievementsError) {
      console.error('Error fetching user achievements:', userAchievementsError)
      return NextResponse.json(
        { error: 'Failed to fetch user achievements' },
        { status: 500 }
      )
    }

    // Create a map of unlocked achievement IDs
    const unlockedMap = new Map(
      (userAchievements || []).map(ua => [ua.achievement_id, ua.unlocked_at])
    )

    // Combine achievements with unlock status
    const achievementsWithStatus = (achievements || []).map(achievement => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      xpReward: achievement.xp_reward,
      category: achievement.category,
      unlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id) || null
    }))

    // Group by category
    const groupedByCategory = achievementsWithStatus.reduce((acc, achievement) => {
      const category = achievement.category || 'other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(achievement)
      return acc
    }, {} as Record<string, typeof achievementsWithStatus>)

    return NextResponse.json({
      achievements: achievementsWithStatus,
      grouped: groupedByCategory,
      totalUnlocked: achievementsWithStatus.filter(a => a.unlocked).length,
      totalAchievements: achievementsWithStatus.length
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    console.error('Error in /api/user/achievements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/achievements
 * Unlock an achievement for the user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { achievementId } = body

    if (!achievementId) {
      return NextResponse.json(
        { error: 'achievementId is required' },
        { status: 400 }
      )
    }

    // Check if achievement exists
    const { data: achievement, error: achievementError } = await supabase
      .from('achievements')
      .select('id, xp_reward')
      .eq('id', achievementId)
      .single()

    if (achievementError || !achievement) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      )
    }

    // Insert user achievement (ON CONFLICT will prevent duplicates)
    const { data: userAchievement, error: insertError } = await supabase
      .from('user_achievements')
      .insert({
        user_id: user.id,
        achievement_id: achievementId
      })
      .select()
      .single()

    // If already exists, fetch existing
    if (insertError?.code === '23505') {
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId)
        .single()

      if (existing) {
        return NextResponse.json({
          success: true,
          alreadyUnlocked: true,
          achievement: existing
        })
      }
    }

    if (insertError && insertError.code !== '23505') {
      console.error('Error unlocking achievement:', insertError)
      return NextResponse.json(
        { error: 'Failed to unlock achievement' },
        { status: 500 }
      )
    }

    // Award XP
    if (achievement.xp_reward > 0) {
      const { error: xpError } = await supabase.rpc('add_user_xp', {
        p_user_id: user.id,
        p_xp: achievement.xp_reward
      })

      if (xpError) {
        console.error('Error adding XP:', xpError)
        // Don't fail the request, just log it
      }
    }

    // Fetch full achievement details
    const { data: fullAchievement } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievementId)
      .single()

    return NextResponse.json({
      success: true,
      achievement: {
        ...fullAchievement,
        xpReward: fullAchievement.xp_reward,
        unlocked: true,
        unlockedAt: userAchievement?.unlocked_at || new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in POST /api/user/achievements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

