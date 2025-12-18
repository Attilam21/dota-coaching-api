import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Achievement criteria definitions (in code, not DB - easier to maintain)
const ACHIEVEMENT_CRITERIA = {
  'first_analysis': {
    name: 'First Analysis',
    description: 'Salva la tua prima analisi',
    xp_reward: 100,
    category: 'milestone',
    check: async (userId: string, supabase: any) => {
      const { count } = await supabase
        .from('match_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      return count === 1
    }
  },
  'match_saved': {
    name: 'Analyst',
    description: 'Salva 5 analisi',
    xp_reward: 200,
    category: 'milestone',
    check: async (userId: string, supabase: any) => {
      const { count } = await supabase
        .from('match_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      return count >= 5
    }
  },
  'level_5': {
    name: 'Rising Star',
    description: 'Raggiungi livello 5',
    xp_reward: 300,
    category: 'progression',
    check: async (userId: string, supabase: any) => {
      const { data } = await supabase
        .from('user_stats')
        .select('level')
        .eq('user_id', userId)
        .single()
      return data?.level >= 5
    }
  },
  'level_10': {
    name: 'Veteran',
    description: 'Raggiungi livello 10',
    xp_reward: 500,
    category: 'progression',
    check: async (userId: string, supabase: any) => {
      const { data } = await supabase
        .from('user_stats')
        .select('level')
        .eq('user_id', userId)
        .single()
      return data?.level >= 10
    }
  },
  'analyzer': {
    name: 'Master Analyst',
    description: 'Analizza 20 match',
    xp_reward: 400,
    category: 'milestone',
    check: async (userId: string, supabase: any) => {
      const { count } = await supabase
        .from('match_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      return count >= 20
    }
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
    const { actionType } = body

    // Get all achievements from DB
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError)
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      )
    }

    // Get user's unlocked achievements
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)

    if (userAchievementsError) {
      console.error('Error fetching user achievements:', userAchievementsError)
      return NextResponse.json(
        { error: 'Failed to fetch user achievements' },
        { status: 500 }
      )
    }

    const unlockedIds = new Set((userAchievements || []).map((ua: any) => ua.achievement_id))

    // Check achievements based on action type
    const achievementsToCheck = Object.entries(ACHIEVEMENT_CRITERIA)
      .filter(([key]) => {
        // Filter by action type if specified
        if (actionType === 'match_saved') {
          return ['first_analysis', 'match_saved', 'analyzer'].includes(key)
        }
        if (actionType === 'level_up') {
          return ['level_5', 'level_10'].includes(key)
        }
        // If no action type, check all
        return true
      })

    const newlyUnlocked: any[] = []

    for (const [key, criteria] of achievementsToCheck) {
      // Find achievement in DB by name
      const achievement = (achievements || []).find((a: any) => a.name === criteria.name) as any
      
      if (!achievement || !achievement.id) {
        console.warn(`Achievement "${criteria.name}" not found in database`)
        continue
      }

      const achievementId = achievement.id as string

      // Skip if already unlocked
      if (unlockedIds.has(achievementId)) {
        continue
      }

      // Check if criteria is met
      try {
        const isUnlocked = await criteria.check(userId, supabase)
        
        if (isUnlocked) {
          // Unlock achievement
          const { error: unlockError } = await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievementId,
            } as any)

          if (unlockError) {
            console.error(`Error unlocking achievement ${achievement.name}:`, unlockError)
            continue
          }

          // Add XP reward
          if (criteria.xp_reward > 0) {
            await supabase.rpc('add_user_xp', {
              p_user_id: userId,
              p_xp: criteria.xp_reward,
            } as any)
          }

          newlyUnlocked.push({
            id: achievementId,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            xpReward: criteria.xp_reward,
            category: criteria.category,
          })
        }
      } catch (checkError) {
        console.error(`Error checking achievement ${key}:`, checkError)
        continue
      }
    }

    return NextResponse.json({
      unlocked: newlyUnlocked,
      count: newlyUnlocked.length,
    })
  } catch (error) {
    console.error('Error in check achievements API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

