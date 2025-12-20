import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface SubmitRequest {
  score: number
  total_questions: number
  correct_answers: number
  time_taken: number // secondi totali
  category?: string
  difficulty?: string
  questions_answered: Array<{
    question_id: string
    answer: string
    correct: boolean
    time_taken: number
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequest & { user_id?: string } = await request.json()

    // Get user ID from request body (client sends it after verifying auth)
    const userId = body.user_id

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID required' },
        { status: 401 }
      )
    }

    // Validate request
    if (!body.score || !body.total_questions || !body.correct_answers || !body.time_taken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create service client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Insert quiz session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('quiz_sessions')
      .insert({
        user_id: userId,
        score: body.score,
        total_questions: body.total_questions,
        correct_answers: body.correct_answers,
        time_taken: body.time_taken,
        category: body.category || null,
        difficulty: body.difficulty || null,
        questions_answered: body.questions_answered,
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error inserting quiz session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to save quiz session' },
        { status: 500 }
      )
    }

    // Check and unlock achievements
    if (session) {
      const { error: achievementError } = await supabaseAdmin.rpc('check_quiz_achievements', {
        p_user_id: userId,
        p_session_id: session.id,
      })

      if (achievementError) {
        console.error('Error checking achievements:', achievementError)
        // Non bloccare la risposta se gli achievement falliscono
      }
    }

    // Get updated leaderboard stats
    const { data: leaderboard, error: leaderboardError } = await supabaseAdmin
      .from('quiz_leaderboard')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get unlocked achievements for this session
    const { data: achievements } = await supabaseAdmin
      .from('quiz_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      session_id: session?.id,
      leaderboard: leaderboard || null,
      new_achievements: achievements?.filter((a: { unlocked_at: string }) => {
        // Return only achievements unlocked in the last minute (likely from this session)
        const unlockedAt = new Date(a.unlocked_at)
        const now = new Date()
        return (now.getTime() - unlockedAt.getTime()) < 60000
      }) || [],
    })
  } catch (error) {
    console.error('Error in quiz submit API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

