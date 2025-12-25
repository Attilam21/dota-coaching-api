'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'

/**
 * Server Action per aggiornare il Player ID
 * 
 * Usa access_token passato esplicitamente dal client (localStorage)
 * NON usa cookie o SSR helpers - compatibile con client @supabase/supabase-js
 */
export async function updatePlayerId(playerId: string | null, accessToken: string, refreshToken: string) {
  try {
    // Valida access_token
    if (!accessToken || !accessToken.trim()) {
      return {
        success: false,
        error: 'Token di autenticazione mancante. Effettua il login per salvare il Player ID.',
      }
    }

    // Valida refresh_token (obbligatorio per setSession e RLS)
    if (!refreshToken || !refreshToken.trim()) {
      return {
        success: false,
        error: 'Refresh token mancante, rifai login.',
      }
    }

    // Crea client Supabase standard (NON SSR, compatibile con client localStorage)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        error: 'Configurazione Supabase mancante.',
      }
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
        },
      },
    })

    // Imposta sessione SEMPRE per permettere a RLS di funzionare
    // RLS richiede che la sessione sia impostata nel client per auth.uid()
    // setSession() permette a Supabase di usare il token per le query database
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) {
      console.error('[updatePlayerId] Errore impostazione sessione:', sessionError.message)
      return {
        success: false,
        error: 'Errore nell\'autenticazione. Rifai login.',
      }
    }

    // Verifica utente usando access_token esplicito
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
      console.error('[updatePlayerId] Errore autenticazione:', authError?.message)
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

    // Verifica stato attuale utente (lock e contatore cambi)
    const { data: userData, error: fetchError } = await (supabase as any)
      .from('users')
      .select('dota_account_id, dota_account_id_locked, dota_account_id_change_count')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('[updatePlayerId] Errore fetch user data:', fetchError)
      return {
        success: false,
        error: 'Errore nel recupero dati utente.',
      }
    }

    // Se sta cercando di cambiare ID e l'utente è bloccato
    if (userData?.dota_account_id_locked && dotaAccountId && dotaAccountId !== userData.dota_account_id) {
      return {
        success: false,
        error: 'Player ID bloccato. Hai già cambiato 3 volte. Contatta il supporto per sbloccare.',
        isLocked: true,
        changesRemaining: 0,
      }
    }

    // Calcola cambi rimanenti (solo se sta cambiando, non se rimuove)
    const currentCount = userData?.dota_account_id_change_count || 0
    const changesRemaining = dotaAccountId && dotaAccountId !== userData?.dota_account_id
      ? Math.max(0, 3 - currentCount)
      : null

    // Se sta cambiando e ha raggiunto il limite, blocca
    if (dotaAccountId && dotaAccountId !== userData?.dota_account_id && changesRemaining !== null && changesRemaining <= 0) {
      return {
        success: false,
        error: 'Hai raggiunto il limite di 3 cambi Player ID. Contatta il supporto.',
        isLocked: true,
        changesRemaining: 0,
      }
    }

    // Update user record (il trigger gestisce il limite e lo storico)
    console.log('[updatePlayerId] Aggiornamento database per user:', user.id, 'dota_account_id:', dotaAccountId)
    // Cast esplicito necessario per type inference
    const { data, error: updateError } = await (supabase as any)
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
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        userId: user.id
      })
      
      // Gestione specifica per errore limite raggiunto (dal trigger)
      if (updateError.message?.includes('limite') || updateError.message?.includes('bloccato')) {
        return {
          success: false,
          error: updateError.message,
          isLocked: true,
          changesRemaining: 0,
        }
      }
      
      return {
        success: false,
        error: updateError.message || 'Errore nel salvataggio del Player ID.',
      }
    }

    // Se l'ID è cambiato, invalida cache profilo vecchio
    if (dotaAccountId && userData?.dota_account_id && dotaAccountId !== userData.dota_account_id) {
      try {
        // Rimuovi cache profilo vecchio
        await (supabase as any)
          .from('player_profiles')
          .delete()
          .eq('user_id', user.id)
          .eq('dota_account_id', userData.dota_account_id)
      } catch (cacheError) {
        // Non bloccare se la cache fallisce
        console.warn('[updatePlayerId] Errore invalidazione cache profilo:', cacheError)
      }
    }

    // Calcola nuovi cambi rimanenti dopo l'update
    const newCount = data?.dota_account_id_change_count || 0
    const newChangesRemaining = dotaAccountId ? Math.max(0, 3 - newCount) : null

    console.log('[updatePlayerId] Salvataggio riuscito:', {
      userId: user.id,
      dotaAccountId: dotaAccountId,
      changeCount: newCount,
      changesRemaining: newChangesRemaining,
      isLocked: data?.dota_account_id_locked || false,
      updatedData: data
    })

    return {
      success: true,
      message: dotaAccountId 
        ? `Player ID ${dotaAccountId} salvato con successo!${newChangesRemaining !== null && newChangesRemaining < 3 ? ` (${newChangesRemaining} cambi rimanenti)` : ''}`
        : 'Player ID rimosso con successo.',
      data,
      changesRemaining: newChangesRemaining,
      isLocked: data?.dota_account_id_locked || false,
    }
  } catch (error) {
    console.error('[updatePlayerId] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto nel salvataggio.',
    }
  }
}

