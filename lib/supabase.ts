import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Database Types - Allineati con uso reale
// SOLO autenticazione: usiamo solo auth.users (automatico)
// public.users viene creato automaticamente dal trigger ma NON lo usiamo nel codice
// Player ID salvato in localStorage, non in Supabase
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
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

  // Create client with proper configuration for client-side usage
  // IMPORTANT: apikey è SEMPRE richiesto da Supabase per identificare il progetto
  // Authorization header (JWT) viene usato per l'autenticazione quando presente
  // Entrambi DEVONO essere presenti simultaneamente - Supabase gestisce correttamente:
  // - apikey identifica il progetto (sempre richiesto)
  // - Authorization identifica l'utente (quando presente)
  // Il problema 403 NON è causato dal conflitto tra i due header
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
    },
    // No custom fetch - Supabase JS gestisce automaticamente apikey e JWT correttamente
    // Il problema 403 è probabilmente dovuto a:
    // 1. JWT role non corretto (deve essere "authenticated" non "anon")
    // 2. RLS policies che usano roles: {authenticated} ma JWT ha role: "anon"
    // 3. Configurazione Supabase Auth che non genera JWT con role corretto
  })

  // Debug: Log session state in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    client.auth.onAuthStateChange((event, session) => {
      console.log('[Supabase Client] Auth state changed:', event, {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id,
      })
    })
  }

  return client
}

// Create singleton instance for client-side usage
// This ensures we only create one client instance per browser session
const supabase = createSupabaseClient()

export { supabase }