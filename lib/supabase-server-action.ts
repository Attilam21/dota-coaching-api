import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './supabase'

/**
 * Create Supabase client for Server Actions
 * Accepts accessToken as parameter (passed from client)
 * This ensures JWT is always passed correctly to Supabase
 * 
 * Note: Supabase stores session in localStorage (client-side), not in HTTP-only cookies
 * So we need to pass the access_token explicitly from the client
 */
export function createServerActionSupabaseClient(accessToken?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  // Create client with JWT in Authorization header if provided
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey, // Always required
        // Add Authorization header with JWT if provided
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
    },
  })
}

