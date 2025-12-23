import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Database Types
 * 
 * Allineati con schema Supabase reale:
 * - public.users: gestione profili utente e Player ID
 * - public.match_analyses: analisi partite salvate
 * 
 * RLS Policies attive:
 * - SELECT: auth.uid() = id
 * - UPDATE: auth.uid() = id  
 * - INSERT: auth.uid() = id
 * 
 * Player ID salvato SOLO in database (dota_account_id) - NON più in localStorage
 */
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
      match_analyses: {
        Row: {
          id: string
          user_id: string | null
          match_id: number
          analysis_data: unknown
          ai_insights: unknown | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          match_id: number
          analysis_data: unknown
          ai_insights?: unknown | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          match_id?: number
          analysis_data?: unknown
          ai_insights?: unknown | null
          created_at?: string
        }
      }
    }
  }
}

/**
 * Crea il client Supabase per uso client-side (browser)
 * 
 * CONFIGURAZIONE CRITICA:
 * - apikey: SEMPRE presente nei global headers (identifica progetto Supabase)
 * - Authorization: NON impostare con anon key - Supabase gestisce automaticamente
 * 
 * PERCHÉ NON IMPOSTARE Authorization CON ANON KEY:
 * 1. Supabase aggiunge automaticamente Authorization con session.access_token (JWT utente) quando presente
 * 2. Se Authorization contiene anon key, SOVRASCRIVE il JWT utente
 * 3. RLS policies usano auth.uid() che estrae user_id dal JWT
 * 4. Anon key NON ha claim 'sub' (user_id) → auth.uid() = NULL
 * 5. RLS policy fallisce: NULL = "user-id" → FALSE → 403 Forbidden
 * 
 * COERENZA PROGETTO:
 * - lib/supabase-server.ts: NON ha Authorization con anon key ✅
 * - app/auth/callback/route.ts: NON ha Authorization con anon key ✅
 * - Questo file: ALLINEATO con best practices ✅
 * 
 * Documentazione: https://supabase.com/docs/guides/troubleshooting/auth-error-401-invalid-claim-missing-sub
 */
function createSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validazione environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase configuration missing!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
    console.error('Authentication features will not work. Please configure environment variables.')
    
    // Return mock client per evitare crash
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

  // Create client seguendo best practices Supabase
  // Il secondo parametro (supabaseAnonKey) viene automaticamente usato come apikey header
  // NON serve aggiungere Authorization nei global headers
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
  // Allineato con lib/auth-context.tsx per coerenza
  if (typeof window !== 'undefined') {
    client.auth.onAuthStateChange((event, session) => {
      // Cleanup quando sessione scade o logout
      // NOTA: NON toccare dati partita in localStorage (last_match_id_*, player_data_*)
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

/**
 * Singleton Supabase client per uso client-side
 * 
 * Garantisce un'unica istanza del client per sessione browser,
 * evitando conflitti di sessione e migliorando performance.
 */
const supabase = createSupabaseClient()

export { supabase }
