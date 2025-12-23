import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './supabase'

/**
 * Create Supabase client for Server Actions
 * 
 * CORRETTO: Usa cookies() da next/headers per leggere la sessione dai cookie HTTP
 * Questo permette a auth.getUser() di funzionare correttamente perché Supabase
 * può leggere la sessione dai cookie della request.
 * 
 * Non usa più decodifica manuale JWT o setSession() hack - tutto gestito da Supabase Auth.
 */
export function createServerActionSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  const cookieStore = cookies()
  
  // Crea client con cookies() per leggere sessione dai cookie HTTP
  // Supabase gestisce automaticamente l'autenticazione dai cookie
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey, // Always required
      },
    },
    cookies: {
      get(name: string): string {
        const cookie = cookieStore.get(name)
        return cookie?.value ?? ''
      },
      set(name: string, value: string, options?: { path?: string; maxAge?: number; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'lax' | 'strict' | 'none' }) {
        try {
          cookieStore.set(name, value, options as any)
        } catch {
          // Ignore cookie errors in server actions (read-only in some contexts)
        }
      },
      remove(name: string, options?: { path?: string; domain?: string }) {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 } as any)
        } catch {
          // Ignore cookie errors
        }
      },
    },
  })
}

