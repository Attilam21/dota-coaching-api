import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import type { Database } from './supabase'

/**
 * Create Supabase client for server-side API routes
 * Uses cookie headers from request for authentication
 */
export function createServerSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Get cookie header from request
  const cookieHeader = request.headers.get('cookie') || ''
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,
        // NOTA: NON impostare Authorization con anon key
        // Supabase gestisce automaticamente l'Authorization header con il token dell'utente
        // quando presente nei cookies (cookieHeader)
        ...(cookieHeader && { cookie: cookieHeader }),
      },
    },
  })
}
