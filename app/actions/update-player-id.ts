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

    // Update user record
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

