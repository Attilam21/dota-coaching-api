'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

function createServerSupabaseClient(accessToken?: string) {
  const cookieStore = cookies()
  
  const clientOptions: any = {
    cookies: {
      get(name: string): string {
        const cookie = cookieStore.get(name)
        return cookie?.value ?? ''
      },
      set(name: string, value: string, options?: { path?: string; maxAge?: number; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'lax' | 'strict' | 'none' }) {
        try {
          cookieStore.set(name, value, options as any)
        } catch {
          // Ignore cookie errors in server actions
        }
      },
      remove(name: string, options?: { path?: string; domain?: string }) {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 } as any)
        } catch {
          // Ignore cookie errors
        }
      },
    },
  }
  
  // Add Authorization header if access token is provided
  if (accessToken) {
    clientOptions.global = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  }
  
  return createClient<Database>(supabaseUrl!, supabaseAnonKey!, clientOptions as any)
}

export async function savePlayerId(playerId: string | null, accessToken?: string) {
  try {
    const supabase = createServerSupabaseClient(accessToken)

    // Get current user - if accessToken is provided, it will be used via Authorization header
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Non autenticato. Effettua il login per salvare il Player ID.',
      }
    }

    // Convert playerId to number or null
    const dotaAccountId = playerId && playerId.trim() 
      ? parseInt(playerId.trim(), 10) 
      : null

    // Validate it's a valid number
    if (playerId && playerId.trim() && isNaN(dotaAccountId!)) {
      return {
        success: false,
        error: 'L\'ID Dota deve essere un numero valido',
      }
    }

    // Update user record - SOVRASCRIVE sempre l'ID precedente
    // Se dotaAccountId è null, rimuove l'ID dal database
    // Se dotaAccountId è un numero, sostituisce quello vecchio
    const { error: updateError } = await supabase
      .from('users')
      .update({
        dota_account_id: dotaAccountId, // null o nuovo ID - sempre sovrascrive
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id) // Aggiorna SOLO il record dell'utente corrente

    if (updateError) {
      console.error('Error updating player ID:', updateError)
      return {
        success: false,
        error: updateError.message || 'Errore nel salvataggio del Player ID.',
      }
    }

    // Log per debug (solo in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[savePlayerId] Player ID aggiornato: ${dotaAccountId ? dotaAccountId : 'rimosso (null)'}`)
    }

    return {
      success: true,
      message: dotaAccountId 
        ? `Player ID ${dotaAccountId} salvato e sovrascritto nel database!`
        : 'Player ID rimosso dal database.',
    }
  } catch (error) {
    console.error('Error in savePlayerId:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto nel salvataggio.',
    }
  }
}

export async function getPlayerId(accessToken?: string) {
  try {
    const supabase = createServerSupabaseClient(accessToken)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        playerId: null,
        error: 'Non autenticato.',
      }
    }

    // Get user record
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('dota_account_id')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching player ID:', fetchError)
      return {
        success: false,
        playerId: null,
        error: fetchError.message || 'Errore nel recupero del Player ID.',
      }
    }

    return {
      success: true,
      playerId: userData?.dota_account_id ? String(userData.dota_account_id) : null,
    }
  } catch (error) {
    console.error('Error in getPlayerId:', error)
    return {
      success: false,
      playerId: null,
      error: error instanceof Error ? error.message : 'Errore sconosciuto.',
    }
  }
}

