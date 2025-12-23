'use server'

import { createServerActionSupabaseClient } from '@/lib/supabase-server-action'

/**
 * Server Action per aggiornare il Player ID
 * Riceve l'access_token dal client e lo usa per autenticare le richieste
 * Questo bypassa i problemi di JWT non passato correttamente dal client
 * 
 * Vantaggi:
 * - ✅ JWT passato esplicitamente dal client
 * - ✅ RLS policies funzionano correttamente perché auth.uid() è disponibile
 */
export async function updatePlayerId(playerId: string | null, accessToken?: string) {
  try {
    // Crea client server-side con JWT esplicito
    const supabase = createServerActionSupabaseClient(accessToken)

    // Verifica sessione
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Non autenticato. Effettua il login per salvare il Player ID.',
      }
    }

    // Converti playerId a number o null
    const dotaAccountId = playerId && playerId.trim() 
      ? parseInt(playerId.trim(), 10) 
      : null

    // Valida che sia un numero valido
    if (playerId && playerId.trim() && isNaN(dotaAccountId!)) {
      return {
        success: false,
        error: 'L\'ID Dota deve essere un numero valido',
      }
    }

    // Update user record
    const { data, error: updateError } = await supabase
      .from('users')
      .update({
        dota_account_id: dotaAccountId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('[updatePlayerId] Error:', updateError)
      return {
        success: false,
        error: updateError.message || 'Errore nel salvataggio del Player ID.',
      }
    }

    return {
      success: true,
      message: dotaAccountId 
        ? `Player ID ${dotaAccountId} salvato con successo!`
        : 'Player ID rimosso con successo.',
      data,
    }
  } catch (error) {
    console.error('[updatePlayerId] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto nel salvataggio.',
    }
  }
}

