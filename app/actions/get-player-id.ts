'use server'

import { createServerActionSupabaseClient } from '@/lib/supabase-server-action'

/**
 * Server Action per ottenere il Player ID
 * 
 * CORRETTO: Usa cookies() per leggere la sessione dai cookie HTTP
 * auth.getUser() funziona perché Supabase può leggere la sessione dai cookie
 */
export async function getPlayerId() {
  try {
    // Crea client Supabase per Server Action
    // Legge automaticamente la sessione dai cookie HTTP
    const supabase = createServerActionSupabaseClient()

    // Ottieni l'utente corrente tramite Supabase Auth
    // Funziona perché il client legge la sessione dai cookie
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Log temporaneo per debug
    if (process.env.NODE_ENV === 'development') {
      console.log('[getPlayerId] getUser() result:', user ? `User found: ${user.id}` : 'User null', userError ? `Error: ${userError.message}` : 'No error')
    }

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

    // Type assertion necessario perché createServerClient non inferisce correttamente il tipo Database
    type UserData = {
      dota_account_id: number | null
      dota_account_verified_at: string | null
      dota_verification_method: string | null
    }

    const typedUserData = userData as UserData | null

    if (typedUserData?.dota_account_id) {
      return {
        success: true,
        playerId: String(typedUserData.dota_account_id),
        verified: !!typedUserData.dota_account_verified_at,
        verifiedAt: typedUserData.dota_account_verified_at,
        verificationMethod: typedUserData.dota_verification_method
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

