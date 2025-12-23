'use server'

import { createServerActionSupabaseClient } from '@/lib/supabase-server-action'

export async function savePlayerId(playerId: string | null) {
  try {
    const supabase = createServerActionSupabaseClient()

    // Get current user - if accessToken is provided, it will be used via Authorization header
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('[savePlayerId] Auth error:', authError)
      return {
        success: false,
        error: `Errore autenticazione: ${authError.message}. Effettua il login per salvare il Player ID.`,
      }
    }

    if (!user) {
      console.error('[savePlayerId] User non trovato')
      return {
        success: false,
        error: 'Non autenticato. Effettua il login per salvare il Player ID.',
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[savePlayerId] User autenticato:', user.id, user.email)
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
    // Cast esplicito necessario perché createServerClient non inferisce correttamente il tipo Database
    const { error: updateError } = await (supabase as any)
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
    const supabase = createServerActionSupabaseClient()

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
    // Cast esplicito necessario perché createServerClient non inferisce correttamente il tipo Database
    const { data: userData, error: fetchError } = await (supabase as any)
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
      playerId: (userData as any)?.dota_account_id ? String((userData as any).dota_account_id) : null,
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

