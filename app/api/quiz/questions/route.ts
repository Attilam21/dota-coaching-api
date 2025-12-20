import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface QuizQuestion {
  id: string
  question: string
  category: string
  difficulty: string
  correct_answer: string
  wrong_answers: string[]
  explanation?: string
  points: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') // 'heroes', 'items', 'mechanics', 'strategy', 'meta', null (tutte)
    const difficulty = searchParams.get('difficulty') // 'easy', 'medium', 'hard', null (tutte)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build query
    let query = supabase
      .from('quiz_questions')
      .select('*')
      .limit(limit)

    // Apply filters
    if (category && ['heroes', 'items', 'mechanics', 'strategy', 'meta'].includes(category)) {
      query = query.eq('category', category)
    }

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      query = query.eq('difficulty', difficulty)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching quiz questions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quiz questions' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No questions found' },
        { status: 404 }
      )
    }

    // Shuffle questions and answers
    const shuffledQuestions = data
      .sort(() => Math.random() - 0.5)
      .map((q: any) => {
        // Shuffle answers (correct + wrong)
        const allAnswers = [q.correct_answer, ...q.wrong_answers]
        const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5)

        return {
          id: q.id,
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          answers: shuffledAnswers,
          correct_answer: q.correct_answer, // Keep for validation
          explanation: q.explanation,
          points: q.points,
        }
      })

    return NextResponse.json({
      questions: shuffledQuestions,
      count: shuffledQuestions.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600', // Cache 1 hour
      },
    })
  } catch (error) {
    console.error('Error in quiz questions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

