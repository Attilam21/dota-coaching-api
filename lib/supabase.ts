import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not configured. Some features may not work.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types (to be expanded)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          dota_account_id: number | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          dota_account_id?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          dota_account_id?: number | null
          created_at?: string
        }
      }
      match_analyses: {
        Row: {
          id: string
          user_id: string
          match_id: number
          analysis_data: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: number
          analysis_data: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: number
          analysis_data?: any
          created_at?: string
        }
      }
      learning_progress: {
        Row: {
          id: string
          user_id: string
          module_id: string
          progress: number
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          progress?: number
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          progress?: number
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}