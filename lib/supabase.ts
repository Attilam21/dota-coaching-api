import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Database Types - Allineati con schema Supabase
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          dota_account_id: number | null
          dota_account_verified_at: string | null
          dota_verification_method: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          dota_account_id?: number | null
          dota_account_verified_at?: string | null
          dota_verification_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
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

  // Create client with proper configuration for client-side usage
  // Use custom fetch to ensure API key is always included in requests
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,
      },
      // Custom fetch to ensure API key is always included
      // IMPORTANT: Preserve Authorization header if Supabase JS already added it (JWT token)
      fetch: (url, options = {}) => {
        // Preserve existing headers correctly
        let headers: Headers
        if (options.headers instanceof Headers) {
          // If it's already a Headers object, clone it
          headers = new Headers(options.headers)
        } else if (options.headers) {
          // If it's a plain object or array, convert to Headers
          headers = new Headers(options.headers)
        } else {
          // If no headers, create new Headers
          headers = new Headers()
        }
        
        // Always include apikey header (required by Supabase)
        if (!headers.has('apikey')) {
          headers.set('apikey', supabaseAnonKey)
        }
        
        // CRITICAL: DO NOT set Authorization header here
        // Supabase JS automatically adds "Authorization: Bearer <jwt_token>" when user is authenticated
        // If we override it, RLS won't recognize the authenticated user
        // The Authorization header should already be in options.headers if session exists
        
        // Debug logging (only in development)
        if (process.env.NODE_ENV === 'development' && typeof url === 'string' && url.includes('/rest/v1/users')) {
          const authHeader = headers.get('Authorization')
          const hasJWT = authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 20
          console.log('[Supabase Client] Request to users table:', {
            url: url.toString().substring(0, 100),
            hasApikey: headers.has('apikey'),
            hasAuthorization: !!authHeader,
            hasJWT: hasJWT,
            authHeaderPreview: authHeader ? `${authHeader.substring(0, 20)}...` : 'none',
            originalHeadersType: options.headers ? options.headers.constructor.name : 'none'
          })
        }
        
        return fetch(url, {
          ...options,
          headers,
        })
      },
    },
  })
}

// Create singleton instance for client-side usage
// This ensures we only create one client instance per browser session
const supabase = createSupabaseClient()

export { supabase }