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

    // Fetch all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

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
      .eq('user_id', userId)

    if (userAchievementsError) {
      console.error('Error fetching user achievements:', userAchievementsError)
      return NextResponse.json(
        { error: 'Failed to fetch user achievements' },
        { status: 500 }
      )
    }

    // Create a set of unlocked achievement IDs for quick lookup
    const unlockedIds = new Set((userAchievements || []).map((ua: any) => ua.achievement_id))
    const unlockedMap = new Map(
      (userAchievements || []).map((ua: any) => [ua.achievement_id, ua.unlocked_at])
    )

    // Merge achievements with unlock status
    const achievementsWithStatus = (achievements || []).map((achievement: any) => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      xpReward: achievement.xp_reward,
      category: achievement.category,
      unlocked: unlockedIds.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id) || null,
    })) || []

    // Group by category
    const grouped = achievementsWithStatus.reduce((acc: Record<string, typeof achievementsWithStatus>, achievement: typeof achievementsWithStatus[number]) => {
      const category = achievement.category || 'other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(achievement)
      return acc
    }, {} as Record<string, typeof achievementsWithStatus>)

    return NextResponse.json({
      achievements: achievementsWithStatus,
      grouped,
    })
  } catch (error) {
    console.error('Error in achievements API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      .select('*')
      .eq('id', achievementId)
      .single()

    if (achievementError || !achievement) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      )
    }

    const achievementData = achievement as any

    // Check if already unlocked
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single()

    if (existing) {
      // Already unlocked, return existing
      const { data: userAchievement } = await supabase
        .from('user_achievements')
        .select('unlocked_at')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single()

      return NextResponse.json({
        achievement: {
          id: achievementData.id,
          name: achievementData.name,
          description: achievementData.description,
          icon: achievementData.icon,
          xpReward: achievementData.xp_reward,
          category: achievementData.category,
          unlocked: true,
          unlockedAt: (userAchievement as any)?.unlocked_at || new Date().toISOString(),
        },
        message: 'Achievement already unlocked',
      })
    }

    // Unlock achievement
    const { data: userAchievement, error: unlockError } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
      } as any)
      .select('unlocked_at')
      .single()

    if (unlockError) {
      console.error('Error unlocking achievement:', unlockError)
      return NextResponse.json(
        { error: 'Failed to unlock achievement' },
        { status: 500 }
      )
    }

    // Add XP reward
    if (achievementData.xp_reward > 0) {
      const { error: xpError } = await supabase.rpc('add_user_xp', {
        p_user_id: userId,
        p_xp: achievementData.xp_reward,
      } as any)

      if (xpError) {
        console.error('Error adding XP:', xpError)
        // Don't fail the request if XP addition fails
      }
    }

    return NextResponse.json({
      achievement: {
        id: achievementData.id,
        name: achievementData.name,
        description: achievementData.description,
        icon: achievementData.icon,
        xpReward: achievementData.xp_reward,
        category: achievementData.category,
        unlocked: true,
        unlockedAt: (userAchievement as any).unlocked_at,
      },
    })
  } catch (error) {
    console.error('Error in unlock achievement API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

