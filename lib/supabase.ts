import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Database Types - Allineati con uso reale
// public.users viene creato automaticamente dal trigger
// Player ID salvato SOLO in database (dota_account_id) - NON più in localStorage
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          dota_account_id: number | null
          dota_account_verified_at: string | null
          dota_verification_method: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          dota_account_id?: number | null
          dota_account_verified_at?: string | null
          dota_verification_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          dota_account_id?: number | null
          dota_account_verified_at?: string | null
          dota_verification_method?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Client-side Supabase client
// In Next.js 14 App Router, we need to ensure the client is created correctly
// for client-side usage (browser)

function createSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase configuration missing!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
    console.error('Authentication features will not work. Please configure environment variables.')
    
    // Return a mock client that will fail gracefully
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // Verify the keys are not placeholder values
  if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder') {
    console.error('❌ Supabase using placeholder values! Please configure real environment variables.')
  }

  // Verifica che l'apikey sia valida (non vuota e non placeholder)
  if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
    console.error('❌ Supabase ANON_KEY sembra non valida! Verifica le variabili d\'ambiente.')
  }

  // Create client with proper configuration for client-side usage
  // IMPORTANT: apikey è SEMPRE richiesto da Supabase per identificare il progetto
  // Il secondo parametro (supabaseAnonKey) viene automaticamente usato come apikey header
  // Tuttavia, dobbiamo assicurarci che sia sempre presente anche nei global headers
  // per garantire che tutte le richieste includano l'apikey
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey, // Assicura che apikey sia sempre presente
        // NOTA CRITICA: NON impostare Authorization con anon key!
        // Supabase aggiunge automaticamente Authorization con session.access_token quando presente
        // Se Authorization contiene anon key, sovrascrive il JWT utente causando 403 Forbidden
      },
    },
    db: {
      schema: 'public',
    },
  })

  // Gestione errori refresh token e sessioni
  if (typeof window !== 'undefined') {
    client.auth.onAuthStateChange((event, session) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Supabase Client] Auth state changed:', event, {
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          userId: session?.user?.id,
        })
      }

      // Gestione errori refresh token
      if (event === 'TOKEN_REFRESHED') {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Supabase] Token refreshed successfully')
        }
      } else if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !session)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Supabase] Session expired or user signed out')
        }
        // Pulire solo token auth quando sessione scade
        // NOTA: NON toccare dati partita in localStorage (last_match_id_*, player_data_*)
        try {
          localStorage.removeItem('sb-auth-token')
        } catch (err) {
          console.error('[Supabase] Failed to clear auth token:', err)
        }
      } else if (event === 'SIGNED_IN') {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Supabase] User signed in')
        }
      }
    })
  }

  return client
}

// Create singleton instance for client-side usage
// This ensures we only create one client instance per browser session
const supabase = createSupabaseClient()

export { supabase }