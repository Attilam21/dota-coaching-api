import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

/**
 * Create Supabase client for Server Actions
 * Accepts accessToken as parameter (passed from client)
 * 
 * CRITICO: Per far funzionare auth.uid() nelle RLS policies, dobbiamo:
 * 1. Passare accessToken nell'header Authorization
 * 2. Usare setSession() per impostare la sessione nel client
 * 
 * Problema precedente: Solo header Authorization non basta - Supabase ha bisogno
 * della sessione impostata nel client per auth.uid() nelle RLS policies
 * 
 * Note: Supabase stores session in localStorage (client-side), not in HTTP-only cookies
 * So we need to pass the access_token explicitly from the client
 */
export async function createServerActionSupabaseClient(accessToken?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  // Create client
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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

  // CRITICO: Se abbiamo accessToken, dobbiamo impostare la sessione
  // Questo permette a auth.uid() di funzionare nelle RLS policies
  if (accessToken) {
    try {
      // Decodifica JWT per ottenere user info (senza verificare la firma - Supabase lo farà)
      const parts = accessToken.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        
        // Crea una sessione minimale per il client
        // Supabase userà questa sessione per auth.uid() nelle RLS policies
        const session = {
          access_token: accessToken,
          refresh_token: '', // Non necessario per operazioni server-side
          expires_at: payload.exp || Math.floor(Date.now() / 1000) + 3600,
          expires_in: payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : 3600,
          token_type: 'bearer',
          user: {
            id: payload.sub,
            email: payload.email || '',
            aud: 'authenticated',
            role: 'authenticated',
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString(),
          },
        }
        
        // Imposta la sessione nel client - questo è CRITICO per auth.uid()
        const { error: sessionError } = await supabase.auth.setSession(session as any)
        
        if (sessionError) {
          console.warn('[createServerActionSupabaseClient] setSession error (continuing with header only):', sessionError.message)
        } else {
          console.log('[createServerActionSupabaseClient] Session set successfully for user:', payload.sub)
        }
      }
    } catch (error) {
      // Se setSession fallisce, logga ma continua (potrebbe funzionare comunque con header)
      console.warn('[createServerActionSupabaseClient] Failed to set session, using header only:', error)
    }
  }

  return supabase
}

