# Analisi Sistema Player ID e Profilazione

## 📊 Situazione Attuale

### 1. **Gestione Player ID**

**Storage:**
- **Priorità 1**: `localStorage` (chiave: `'fzth_player_id'`) - fonte primaria
- **Priorità 2**: `Supabase` (`public.users.dota_account_id`) - fallback quando localStorage è vuoto
- **Context**: `PlayerIdContext` gestisce lo stato React e sincronizzazione

**Flusso Attuale:**
1. Al mount: carica da localStorage
2. Se localStorage vuoto E utente autenticato → carica da Supabase
3. `setPlayerId()` aggiorna: state React + localStorage + (opzionalmente) Supabase)

**File Chiave:**
- `lib/playerIdContext.tsx` - Context provider
- `app/actions/update-player-id.ts` - Server action per salvare in Supabase
- `app/actions/get-player-id.ts` - Server action per leggere da Supabase

### 2. **Profilazione**

**Dati Profilazione:**
- Calcolati on-demand da API `/api/player/[id]/profile`
- **NON persistiti** nel database
- Includono: role, playstyle, strengths, weaknesses, trends, phaseAnalysis

**Problema:** Ogni volta che l'utente accede, la profilazione viene ricalcolata da zero.

### 3. **Database Schema Attuale**

```sql
public.users:
  - id (UUID)
  - email
  - dota_account_id (BIGINT UNIQUE) ✅
  - dota_account_verified_at (TIMESTAMPTZ) ✅
  - dota_verification_method (TEXT) ✅
  - created_at, updated_at
```

**Mancano:**
- ❌ Tracking dei cambi di Player ID
- ❌ Limite di 3 cambi
- ❌ Storico dei Player ID usati
- ❌ Cache/salvataggio della profilazione

---

## ❌ Problemi Identificati

### 1. **Nessun Limite di Cambi**
- Utente può cambiare Player ID infinite volte
- Nessun tracking dei cambi
- Nessuna protezione contro abusi

### 2. **Profilazione Non Persistita**
- Profilazione ricalcolata ogni volta
- Lento e costoso (chiamate API multiple)
- Nessuna cache dei risultati

### 3. **Coerenza tra Login**
- localStorage può essere cancellato → perdita dati
- Se localStorage vuoto, carica da Supabase (OK)
- Ma se Supabase ha ID diverso da localStorage → conflitto

### 4. **Nessun Tracking Storico**
- Non si sa quando è stato cambiato l'ID
- Non si sa quanti cambi sono stati fatti
- Impossibile implementare limite di 3 cambi

---

## ✅ Proposta Soluzione (Sistema Vendibile)

### 1. **Schema Database Esteso**

```sql
-- Aggiungi colonne a public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS 
  dota_account_id_change_count INTEGER DEFAULT 0,
  dota_account_id_last_changed_at TIMESTAMPTZ,
  dota_account_id_locked BOOLEAN DEFAULT FALSE;

-- Nuova tabella: player_id_history
CREATE TABLE IF NOT EXISTS public.player_id_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  dota_account_id BIGINT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_from BIGINT, -- ID precedente (NULL se primo)
  reason TEXT, -- 'initial', 'change', 'reset'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nuova tabella: player_profiles (cache profilazione)
CREATE TABLE IF NOT EXISTS public.player_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  dota_account_id BIGINT NOT NULL,
  profile_data JSONB NOT NULL, -- role, playstyle, strengths, weaknesses, ecc.
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Cache scade dopo 7 giorni
  UNIQUE(user_id, dota_account_id)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_player_id_history_user_id 
  ON public.player_id_history(user_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id 
  ON public.player_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_dota_account_id 
  ON public.player_profiles(dota_account_id);
```

### 2. **Logica Limite 3 Cambi**

**Trigger/Function PostgreSQL:**

```sql
CREATE OR REPLACE FUNCTION check_player_id_change_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  old_id BIGINT;
BEGIN
  -- Se dota_account_id non cambia, non fare nulla
  IF OLD.dota_account_id = NEW.dota_account_id THEN
    RETURN NEW;
  END IF;

  -- Se sta rimuovendo l'ID (NULL), permetti
  IF NEW.dota_account_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Se sta impostando per la prima volta (da NULL a valore), permetti
  IF OLD.dota_account_id IS NULL AND NEW.dota_account_id IS NOT NULL THEN
    -- Prima impostazione: non conta come cambio
    NEW.dota_account_id_change_count := 0;
    NEW.dota_account_id_last_changed_at := NOW();
    RETURN NEW;
  END IF;

  -- Controlla se è già bloccato
  IF OLD.dota_account_id_locked = TRUE THEN
    RAISE EXCEPTION 'Player ID è bloccato. Hai già cambiato 3 volte. Contatta il supporto.';
  END IF;

  -- Conta i cambi
  current_count := COALESCE(OLD.dota_account_id_change_count, 0);
  
  -- Se ha già fatto 3 cambi, blocca
  IF current_count >= 3 THEN
    NEW.dota_account_id_locked := TRUE;
    RAISE EXCEPTION 'Hai raggiunto il limite di 3 cambi Player ID. Contatta il supporto per sbloccare.';
  END IF;

  -- Incrementa contatore
  NEW.dota_account_id_change_count := current_count + 1;
  NEW.dota_account_id_last_changed_at := NOW();

  -- Salva nello storico
  INSERT INTO public.player_id_history (
    user_id, 
    dota_account_id, 
    changed_from, 
    reason
  ) VALUES (
    NEW.id,
    NEW.dota_account_id,
    OLD.dota_account_id,
    CASE 
      WHEN OLD.dota_account_id IS NULL THEN 'initial'
      ELSE 'change'
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS trigger_check_player_id_change_limit ON public.users;
CREATE TRIGGER trigger_check_player_id_change_limit
  BEFORE UPDATE OF dota_account_id ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION check_player_id_change_limit();
```

### 3. **Server Action Aggiornata**

```typescript
// app/actions/update-player-id.ts

export async function updatePlayerId(
  playerId: string | null, 
  accessToken: string, 
  refreshToken: string
) {
  // ... validazione token ...

  // Verifica se è bloccato
  const { data: userData } = await supabase
    .from('users')
    .select('dota_account_id, dota_account_id_locked, dota_account_id_change_count')
    .eq('id', user.id)
    .single();

  if (userData?.dota_account_id_locked) {
    return {
      success: false,
      error: 'Player ID bloccato. Hai già cambiato 3 volte. Contatta il supporto.',
    };
  }

  // Conta cambi rimanenti
  const changesRemaining = 3 - (userData?.dota_account_id_change_count || 0);
  
  if (playerId && changesRemaining <= 0 && userData?.dota_account_id) {
    return {
      success: false,
      error: `Hai raggiunto il limite di 3 cambi. Contatta il supporto.`,
      changesRemaining: 0,
    };
  }

  // Update (il trigger gestisce il limite)
  const { data, error } = await supabase
    .from('users')
    .update({
      dota_account_id: dotaAccountId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  // ... gestione errori ...

  return {
    success: true,
    message: dotaAccountId 
      ? `Player ID ${dotaAccountId} salvato! (${changesRemaining - 1} cambi rimanenti)`
      : 'Player ID rimosso.',
    changesRemaining: changesRemaining - 1,
    data,
  };
}
```

### 4. **Cache Profilazione**

**API Route Aggiornata:**

```typescript
// app/api/player/[id]/profile/route.ts

export async function GET(request: NextRequest, { params }) {
  const { id } = await params;
  const userId = request.headers.get('x-user-id'); // Da middleware auth

  // 1. Controlla cache nel database
  const { data: cachedProfile } = await supabase
    .from('player_profiles')
    .select('profile_data, expires_at')
    .eq('user_id', userId)
    .eq('dota_account_id', parseInt(id))
    .single();

  // 2. Se cache valida, ritorna cache
  if (cachedProfile && new Date(cachedProfile.expires_at) > new Date()) {
    return NextResponse.json({
      ...cachedProfile.profile_data,
      cached: true,
      cached_at: cachedProfile.calculated_at,
    });
  }

  // 3. Calcola profilazione (logica esistente)
  const profileData = await calculateProfile(id);

  // 4. Salva in cache (7 giorni)
  await supabase
    .from('player_profiles')
    .upsert({
      user_id: userId,
      dota_account_id: parseInt(id),
      profile_data: profileData,
      calculated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

  return NextResponse.json({
    ...profileData,
    cached: false,
  });
}
```

### 5. **Flusso Coerente tra Login**

**PlayerIdContext Aggiornato:**

```typescript
// lib/playerIdContext.tsx

const loadPlayerId = useCallback(async () => {
  // 1. Carica da localStorage (se presente)
  const localId = localStorage.getItem(PLAYER_ID_KEY);
  
  // 2. Carica da Supabase (sempre, per sincronizzazione)
  const { playerId: dbId, isLocked } = await getPlayerId();
  
  // 3. Risolvi conflitti:
  if (localId && dbId && localId !== dbId) {
    // Conflitto: localStorage diverso da DB
    // Priorità: DB (fonte di verità)
    console.warn('[PlayerIdContext] Conflitto ID: localStorage vs DB. Usando DB.');
    setPlayerIdState(dbId);
    localStorage.setItem(PLAYER_ID_KEY, dbId);
    return;
  }
  
  // 4. Se bloccato, mostra warning
  if (isLocked) {
    console.warn('[PlayerIdContext] Player ID bloccato. Contatta supporto.');
  }
  
  // 5. Usa priorità: localStorage > DB
  const finalId = localId || dbId;
  setPlayerIdState(finalId);
}, []);
```

---

## 🔄 Flusso Completo (Dopo Fix)

### **Primo Login:**
1. Utente si registra → `public.users` creato automaticamente
2. Utente inserisce Player ID → salva in Supabase + localStorage
3. `dota_account_id_change_count = 0` (prima impostazione)
4. Profilazione calcolata e salvata in cache

### **Login Successivi:**
1. Carica Player ID da localStorage
2. Se localStorage vuoto → carica da Supabase
3. Se conflitto → usa DB (fonte di verità)
4. Carica profilazione da cache (se valida)
5. Se cache scaduta → ricalcola e aggiorna cache

### **Cambio Player ID:**
1. Utente cambia ID in Settings
2. Trigger PostgreSQL verifica limite (max 3)
3. Se OK → incrementa contatore, salva storico
4. Se limite raggiunto → blocca e mostra errore
5. Invalida cache profilazione vecchia
6. Calcola nuova profilazione e salva in cache

### **Dopo 3 Cambi:**
1. `dota_account_id_locked = TRUE`
2. UI mostra messaggio: "Player ID bloccato. Contatta supporto."
3. Campo input disabilitato
4. Solo admin può sbloccare (funzione separata)

---

## 📋 Checklist Implementazione

### Fase 1: Database
- [ ] Aggiungere colonne a `public.users`
- [ ] Creare tabella `player_id_history`
- [ ] Creare tabella `player_profiles`
- [ ] Creare trigger `check_player_id_change_limit()`
- [ ] Testare trigger con vari scenari

### Fase 2: Server Actions
- [ ] Aggiornare `update-player-id.ts` con controllo limite
- [ ] Aggiungere funzione `getPlayerIdHistory()`
- [ ] Aggiungere funzione `unlockPlayerId()` (admin only)

### Fase 3: API Routes
- [ ] Aggiornare `/api/player/[id]/profile` con cache
- [ ] Aggiungere invalidazione cache quando ID cambia

### Fase 4: Frontend
- [ ] Aggiornare `PlayerIdContext` per gestire conflitti
- [ ] Mostrare contatore cambi rimanenti in Settings
- [ ] Mostrare storico cambi (opzionale)
- [ ] Disabilitare input se bloccato

### Fase 5: Testing
- [ ] Test primo login
- [ ] Test cambio ID (1, 2, 3 volte)
- [ ] Test blocco dopo 3 cambi
- [ ] Test cache profilazione
- [ ] Test coerenza tra login

---

## 🎯 Vantaggi Soluzione

1. **Vendibile**: Limite chiaro, tracking completo
2. **Performante**: Cache profilazione (7 giorni)
3. **Coerente**: DB come fonte di verità
4. **Sicuro**: Trigger PostgreSQL previene bypass
5. **Scalabile**: Storico per analytics futuri
6. **User-Friendly**: Messaggi chiari, contatore visibile

---

## ❓ Domande da Risolvere

1. **Reset Limite**: Permettere reset dopo X giorni? (es. 1 cambio ogni 30 giorni)
2. **Admin Unlock**: Come gestire sblocco? Dashboard admin separata?
3. **Cache TTL**: 7 giorni OK o preferisci diverso?
4. **Storico UI**: Mostrare storico cambi all'utente o solo backend?

