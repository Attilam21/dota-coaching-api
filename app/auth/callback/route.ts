import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase configuration missing in callback route')
    return NextResponse.redirect(new URL('/auth/login?error=config', requestUrl.origin))
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    },
  })

  // Handle email confirmation (token + type)
  if (token && type) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any,
      })
      
      if (error) {
        console.error('Error verifying email:', error)
        return NextResponse.redirect(new URL('/auth/login?error=verification', requestUrl.origin))
      }
    } catch (err) {
      console.error('Exception verifying email:', err)
      return NextResponse.redirect(new URL('/auth/login?error=verification', requestUrl.origin))
    }
  }
  
  // Handle OAuth callback (code)
  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code:', error)
        return NextResponse.redirect(new URL('/auth/login?error=exchange', requestUrl.origin))
      }
    } catch (err) {
      console.error('Exception exchanging code:', err)
      return NextResponse.redirect(new URL('/auth/login?error=exchange', requestUrl.origin))
    }
  }

  // Redirect to home page after successful authentication
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}

