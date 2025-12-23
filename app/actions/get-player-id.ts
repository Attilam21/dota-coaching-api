'use server'

import { createServerActionSupabaseClient } from '@/lib/supabase-server-action'

/**
 * Server Action per ottenere il Player ID
 * Riceve l'access_token come parametro dal client
 * Questo garantisce che la sessione sia passata correttamente per RLS
 */
export async function getPlayerId(accessToken?: string) {
  try {
    // Verifica che abbiamo l'accessToken
    if (!accessToken) {
      console.error('[getPlayerId] Nessun accessToken fornito')
      return { success: false, error: 'User not authenticated', playerId: null }
    }

    // Decodifica JWT per ottenere user ID direttamente (più affidabile di getUser())
    // Questo evita problemi con token scaduti o chiamate API fallite
    let userId: string | null = null
    try {
      const parts = accessToken.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        userId = payload.sub // user ID dal JWT
        console.log('[getPlayerId] User ID estratto da JWT:', userId)
      } else {
        console.error('[getPlayerId] JWT non valido (formato errato)')
        return { success: false, error: 'Token non valido', playerId: null }
      }
    } catch (jwtError) {
      console.error('[getPlayerId] Errore decodifica JWT:', jwtError)
      return { success: false, error: 'Token non valido', playerId: null }
    }

    if (!userId) {
      console.error('[getPlayerId] User ID non trovato nel JWT')
      return { success: false, error: 'User not authenticated', playerId: null }
    }

    // Crea client Supabase per Server Action con accessToken esplicito
    // L'accessToken viene passato dal client (SettingsPage)
    const supabase = await createServerActionSupabaseClient(accessToken)

    // Carica Player ID dal database usando userId estratto dal JWT
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('dota_account_id, dota_account_verified_at, dota_verification_method')
      .eq('id', userId)
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

