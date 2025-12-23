import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './supabase'

/**
 * Create Supabase client for Server Actions
 * Uses cookies() from Next.js to read session cookies and extract JWT
 * This ensures JWT is always passed correctly to Supabase
 */
export function createServerActionSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const cookieStore = cookies()
  
  // Read session from cookies
  // Supabase stores session in cookies with pattern: sb-<project-ref>-auth-token
  // We need to find the access_token from the session cookie
  let accessToken: string | undefined = undefined
  
  // Try to get access token from cookies
  // Supabase stores it in a cookie that contains JSON with access_token
  try {
    // Look for Supabase auth cookies (pattern: sb-*-auth-token)
    const allCookies = cookieStore.getAll()
    for (const cookie of allCookies) {
      if (cookie.name.includes('auth-token') || cookie.name.includes('sb-')) {
        try {
          // Try to parse as JSON (Supabase stores session as JSON)
          const sessionData = JSON.parse(cookie.value)
          if (sessionData?.access_token) {
            accessToken = sessionData.access_token
            break
          }
        } catch {
          // Cookie might not be JSON, continue searching
          continue
        }
      }
    }
  } catch (error) {
    // If we can't read cookies, continue without access token
    // This will result in unauthenticated requests, which is expected if user is not logged in
  }
  
  // Create client with JWT in Authorization header if available
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey, // Always required
        // Add Authorization header with JWT if we found it in cookies
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
    },
  })
}

