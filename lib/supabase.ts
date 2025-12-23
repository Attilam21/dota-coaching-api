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
 * CONFIGURAZIONE CRITICA:
 * - Il secondo parametro (supabaseAnonKey) viene automaticamente usato come apikey header
 * - Aggiungiamo anche apikey nei global headers per garantire che sia sempre presente
 * - NON impostare Authorization con anon key - Supabase gestisce automaticamente con session.access_token
 * 
 * PERCHÉ NON IMPOSTARE Authorization CON ANON KEY:
 * Se Authorization contiene anon key, SOVRASCRIVE il JWT utente causando:
 * - auth.uid() = NULL (anon key non ha claim 'sub')
 * - RLS policies falliscono → 403 Forbidden
 */
function createSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase configuration missing!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
    console.error('Authentication features will not work. Please configure environment variables.')
    
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // Validazione valori non placeholder
  if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder') {
    console.error('❌ Supabase using placeholder values! Please configure real environment variables.')
  }

  // Validazione formato anon key
  if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
    console.error('❌ Supabase ANON_KEY sembra non valida! Verifica le variabili d\'ambiente.')
  }

  // Create client - CONFIGURAZIONE CORRETTA
  // Il secondo parametro (supabaseAnonKey) viene automaticamente usato come apikey header
  // Aggiungiamo anche nei global headers per garantire che sia sempre presente
  // NON impostare Authorization - Supabase lo gestisce automaticamente con session.access_token
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
        // apikey SEMPRE presente - garantisce che tutte le richieste includano l'apikey
        'apikey': supabaseAnonKey,
        // NOTA CRITICA: NON impostare Authorization qui!
        // Supabase aggiunge automaticamente Authorization con session.access_token quando presente
        // Se Authorization contiene anon key, sovrascrive il JWT utente causando 403 Forbidden
      },
    },
    db: {
      schema: 'public',
    },
  })

  // Gestione eventi auth e logging per debug
  if (typeof window !== 'undefined') {
    client.auth.onAuthStateChange((event, session) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Supabase] Auth state changed:', event, {
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          userId: session?.user?.id,
          email: session?.user?.email,
        })
      }

      // Cleanup quando sessione scade o logout
      if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !session)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Supabase] Session expired or user signed out - clearing auth token')
        }
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
const supabase = createSupabaseClient()

export { supabase }
