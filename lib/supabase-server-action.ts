import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Create Supabase client for Server Actions
 * 
 * CORRETTO: Usa createServerClient da @supabase/ssr (pattern ufficiale)
 * Questo permette a auth.getUser() di funzionare correttamente perché Supabase
 * può leggere la sessione dai cookie HTTP usando il pattern ufficiale Next.js/Supabase.
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
  
  // Usa createServerClient da @supabase/ssr (pattern ufficiale)
  // Gestisce automaticamente l'autenticazione dai cookie HTTP
  // Usa CookieMethodsServerDeprecated (get/set/remove) per Server Actions
  const client = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value ?? undefined
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Ignore cookie errors in server actions (read-only in some contexts)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          // CRITICO: maxAge: 0 deve essere DOPO lo spread per avere la precedenza
          // Se options contiene maxAge, questo lo sovrascriverà garantendo l'eliminazione del cookie
          cookieStore.set({ name, value: '', ...options, maxAge: 0 })
        } catch {
          // Ignore cookie errors
        }
      },
    },
  })
  
  // Cast esplicito per garantire che il tipo Database sia corretto
  // createServerClient non inferisce correttamente il tipo Database, quindi facciamo un cast più forte
  return client as unknown as SupabaseClient<Database>
}
