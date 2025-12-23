'use server'

import { createServerActionSupabaseClient } from '@/lib/supabase-server-action'

/**
 * Server Action per aggiornare il Player ID
 * 
 * CORRETTO: Usa cookies() per leggere la sessione dai cookie HTTP
 * auth.getUser() funziona perché Supabase può leggere la sessione dai cookie
 */
export async function updatePlayerId(playerId: string | null) {
  try {
    // Crea client Supabase per Server Action
    // Legge automaticamente la sessione dai cookie HTTP
    const supabase = createServerActionSupabaseClient()

    // Verifica sessione tramite Supabase Auth
    // Funziona perché il client legge la sessione dai cookie
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Log temporaneo per debug
    if (process.env.NODE_ENV === 'development') {
      console.log('[updatePlayerId] getUser() result:', user ? `User found: ${user.id}` : 'User null', authError ? `Error: ${authError.message}` : 'No error')
    }

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
    console.log('[updatePlayerId] Aggiornamento database per user:', user.id, 'dota_account_id:', dotaAccountId)
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
      console.error('[updatePlayerId] Errore aggiornamento database:', {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        userId: user.id
      })
      return {
        success: false,
        error: updateError.message || 'Errore nel salvataggio del Player ID.',
      }
    }

    console.log('[updatePlayerId] Salvataggio riuscito:', {
      userId: user.id,
      dotaAccountId: dotaAccountId,
      updatedData: data
    })

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

