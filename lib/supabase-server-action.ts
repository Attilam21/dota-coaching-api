import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './supabase'

/**
 * Create Supabase client for Server Actions
 * Uses cookies() from Next.js to read session cookies
 * This ensures JWT is always passed correctly to Supabase
 */
export function createServerActionSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const cookieStore = cookies()
  
  // Create client with cookie handling for Server Actions
  // Supabase will automatically read session from cookies and add Authorization header
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey, // Always required
        // Supabase automatically reads session from cookies and adds Authorization header
        // when cookies are available via the cookie store
      },
    },
    cookies: {
      get(name: string) {
        const cookie = cookieStore.get(name)
        return cookie?.value ?? ''
      },
      set(name: string, value: string, options?: any) {
        try {
          cookieStore.set(name, value, options)
        } catch {
          // Ignore cookie errors in server actions
        }
      },
      remove(name: string, options?: any) {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        } catch {
          // Ignore cookie errors
        }
      },
    },
  })
}

