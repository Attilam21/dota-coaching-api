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
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const email = requestUrl.searchParams.get('email')

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

  // Handle email confirmation (token_hash + type)
  // Supabase email confirmation links use token_hash, which is self-contained
  // token_hash contains all necessary info (email, user ID, timestamp) and does NOT require email parameter
  if (token_hash && type) {
    try {
      // Use only token_hash + type (email is NOT needed, token_hash is self-contained)
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token_hash,
        type: type as 'signup' | 'email' | 'recovery' | 'email_change',
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
  
  // Handle OTP verification with token (not token_hash) - for manual OTP entry
  if (token && type && email) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: type as 'signup' | 'email' | 'recovery' | 'email_change',
      })
      
      if (error) {
        console.error('Error verifying OTP:', error)
        return NextResponse.redirect(new URL('/auth/login?error=verification', requestUrl.origin))
      }
    } catch (err) {
      console.error('Exception verifying OTP:', err)
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

