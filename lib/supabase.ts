import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Database Types - Allineati con schema Supabase
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      match_analyses: {
        Row: {
          id: string
          user_id: string
          match_id: number
          analysis_data: any
          ai_insights: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: number
          analysis_data: any
          ai_insights?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: number
          analysis_data?: any
          ai_insights?: any | null
          created_at?: string
        }
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabase: SupabaseClient<Database>

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not configured. Authentication features will not work.')
  // Create a mock client that will fail gracefully
  supabase = createClient<Database>('https://placeholder.supabase.co', 'placeholder', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
} else {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export { supabase }