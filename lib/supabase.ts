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

/**
 * Crea il client Supabase per uso client-side (browser)
 * 
 * IMPORTANTE:
 * - NON impostare Authorization header con anon key nei global headers
 * - Supabase gestisce automaticamente Authorization con session.access_token (JWT utente)
 * - Se Authorization contiene anon key, sovrascrive il JWT utente causando:
 *   - auth.uid() = NULL (anon key non ha claim 'sub')
 *   - RLS policies falliscono → 403 Forbidden
 * 
 * Documentazione: https://supabase.com/docs/guides/troubleshooting/auth-error-401-invalid-claim-missing-sub
 */
function createSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase configuration missing!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
    
    // Return a mock client that will fail gracefully
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // Create client seguendo best practices Supabase
  // Il secondo parametro (supabaseAnonKey) viene automaticamente usato come apikey header
  // NON serve aggiungere Authorization nei global headers - Supabase lo gestisce automaticamente
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
        // Solo apikey - NON Authorization!
        // Supabase aggiunge automaticamente Authorization con session.access_token quando presente
        'apikey': supabaseAnonKey,
      },
    },
    db: {
      schema: 'public',
    },
  })

  // Gestione eventi auth per cleanup sessioni scadute
  if (typeof window !== 'undefined') {
    client.auth.onAuthStateChange((event, session) => {
      // Cleanup quando sessione scade o logout
      if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !session)) {
        try {
          localStorage.removeItem('sb-auth-token')
        } catch (err) {
          console.error('[Supabase] Failed to clear auth token:', err)
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
