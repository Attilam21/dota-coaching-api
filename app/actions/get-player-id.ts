'use server'

import { createServerActionSupabaseClient } from '@/lib/supabase-server-action'

/**
 * Server Action per ottenere il Player ID
 * Riceve l'access_token come parametro dal client
 * Questo garantisce che la sessione sia passata correttamente per RLS
 */
export async function getPlayerId(accessToken?: string) {
  try {
    // Crea client Supabase per Server Action con accessToken esplicito
    // L'accessToken viene passato dal client (PlayerIdContext)
    const supabase = await createServerActionSupabaseClient(accessToken)

    // Ottieni l'utente corrente
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[getPlayerId] Errore getUser:', userError?.message)
      return { success: false, error: 'User not authenticated', playerId: null }
    }

    // Carica Player ID dal database
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('dota_account_id, dota_account_verified_at, dota_verification_method')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('[getPlayerId] Errore fetch:', fetchError.message, fetchError.code)
      return { 
        success: false, 
        error: fetchError.message,
        code: fetchError.code,
        playerId: null 
      }
    }

    if (userData?.dota_account_id) {
      return {
        success: true,
        playerId: String(userData.dota_account_id),
        verified: !!userData.dota_account_verified_at,
        verifiedAt: userData.dota_account_verified_at,
        verificationMethod: userData.dota_verification_method
      }
    }

    return {
      success: true,
      playerId: null,
      verified: false,
      verifiedAt: null,
      verificationMethod: null
    }
  } catch (error) {
    console.error('[getPlayerId] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      playerId: null
    }
  }
}

