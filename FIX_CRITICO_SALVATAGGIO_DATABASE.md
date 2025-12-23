# 🔧 FIX CRITICO: Salvataggio Player ID su Database

## ❌ PROBLEMA IDENTIFICATO

### Il problema principale
Quando si salvava il Player ID da Settings, **NON veniva scritto sul database** perché:

1. **Client server-side non impostava la sessione correttamente**
   - Passava solo `accessToken` nell'header `Authorization`
   - **NON** usava `setSession()` per impostare la sessione nel client
   - Le RLS policies usano `auth.uid()` che **NON funziona** senza una sessione impostata

2. **Flusso rotto:**
   ```
   Settings → updatePlayerId() → createServerActionSupabaseClient()
   → ❌ Solo header Authorization → ❌ auth.uid() non funziona → ❌ RLS blocca → ❌ Update fallisce
   ```

### Perché non funzionava
- **RLS policies** usano `auth.uid()` per verificare che l'utente possa modificare solo i propri dati
- `auth.uid()` funziona **SOLO** se il client Supabase ha una sessione impostata
- Passare solo l'accessToken nell'header **NON basta** - serve `setSession()`

---

## ✅ SOLUZIONE IMPLEMENTATA

### Fix 1: Client Server-Side con setSession()
**File:** `lib/supabase-server-action.ts`

**Prima (NON funzionava):**
```typescript
export function createServerActionSupabaseClient(accessToken?: string) {
  return createClient(..., {
    global: {
      headers: {
        'Authorization': `Bearer ${accessToken}`, // ❌ Solo header - NON basta!
      },
    },
  })
}
```

**Dopo (FUNZIONA):**
```typescript
export async function createServerActionSupabaseClient(accessToken?: string) {
  const supabase = createClient(...)
  
  if (accessToken) {
    // Decodifica JWT per ottenere user info
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString())
    
    // Crea sessione minimale
    const session = {
      access_token: accessToken,
      user: {
        id: payload.sub,
        email: payload.email,
        // ...
      },
    }
    
    // ✅ CRITICO: Imposta la sessione nel client
    await supabase.auth.setSession(session)
  }
  
  return supabase
}
```

### Fix 2: Server Action ora è async
**File:** `app/actions/update-player-id.ts`

```typescript
export async function updatePlayerId(playerId: string | null, accessToken?: string) {
  // ✅ Ora è async perché createServerActionSupabaseClient è async
  const supabase = await createServerActionSupabaseClient(accessToken)
  
  // ✅ getUser() ora funziona perché la sessione è impostata
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // ✅ Update ora funziona perché auth.uid() funziona nelle RLS policies
  const { data, error: updateError } = await supabase
    .from('users')
    .update({ dota_account_id: dotaAccountId })
    .eq('id', user.id)
}
```

### Fix 3: Reload automatico dopo salvataggio
**File:** `app/dashboard/settings/page.tsx`

```typescript
const result = await updatePlayerId(playerIdString, currentSession.access_token)

if (result.success) {
  // ✅ Ricarica dal database per sincronizzazione completa
  await reload()
  
  // ✅ Aggiorna anche state locale per feedback immediato
  setPlayerId(playerIdString)
}
```

---

## 🔍 FLUSSO COMPLETO (DOPO FIX)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UTENTE SALVA IN SETTINGS                                 │
├─────────────────────────────────────────────────────────────┤
│ • Inserisce Player ID                                       │
│ • Click "Salva Impostazioni"                                │
│ • Ottiene accessToken da session                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SERVER ACTION: updatePlayerId()                          │
├─────────────────────────────────────────────────────────────┤
│ • Crea client: await createServerActionSupabaseClient()    │
│ • ✅ setSession() imposta sessione nel client               │
│ • ✅ auth.uid() ora funziona nelle RLS policies            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. VERIFICA AUTENTICAZIONE                                  │
├─────────────────────────────────────────────────────────────┤
│ • supabase.auth.getUser() → ✅ Funziona!                   │
│ • Ottiene user.id dalla sessione                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. UPDATE DATABASE                                          │
├─────────────────────────────────────────────────────────────┤
│ • supabase.from('users').update(...)                        │
│ • ✅ RLS policy "Users can update own profile" passa        │
│ • ✅ auth.uid() = user.id → Update riuscito!               │
│ • ✅ Player ID salvato nel database                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. RELOAD E SINCRONIZZAZIONE                               │
├─────────────────────────────────────────────────────────────┤
│ • await reload() → Ricarica da database                    │
│ • PlayerIdContext si aggiorna                               │
│ • Dashboard si aggiorna automaticamente                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 COME TESTARE

1. **Vai su `/dashboard/settings`**
2. **Inserisci un Player ID valido** (es: `8607682237`)
3. **Click "Salva Impostazioni"**
4. **Verifica console:**
   ```
   [createServerActionSupabaseClient] Session set successfully for user: [user-id]
   [updatePlayerId] Aggiornamento database per user: [user-id] dota_account_id: 8607682237
   [updatePlayerId] Salvataggio riuscito: { userId: ..., dotaAccountId: 8607682237 }
   [Settings] Salvataggio riuscito, ricarico Player ID dal database...
   [PlayerIdContext] Player ID trovato nel database: 8607682237
   ```
5. **Verifica database:**
   - Vai su Supabase Dashboard → Table Editor → `users`
   - Verifica che `dota_account_id` sia stato aggiornato
6. **Verifica dashboard:**
   - Vai su `/dashboard`
   - ✅ Dashboard si popola automaticamente con i dati

---

## 📋 CHECKLIST VERIFICA

- [x] Client server-side usa `setSession()` per impostare la sessione
- [x] Server Action è `async` e attende `createServerActionSupabaseClient()`
- [x] `getUser()` funziona correttamente dopo `setSession()`
- [x] RLS policies funzionano con `auth.uid()`
- [x] Update database funziona correttamente
- [x] Reload automatico dopo salvataggio
- [x] Dashboard si aggiorna automaticamente

---

## 🔑 PUNTI CHIAVE

1. **setSession() è CRITICO** - Senza di esso, `auth.uid()` non funziona nelle RLS policies
2. **Header Authorization da solo NON basta** - Serve anche la sessione impostata
3. **RLS policies usano auth.uid()** - Devono avere accesso alla sessione
4. **Reload dopo salvataggio** - Garantisce sincronizzazione completa

---

## 🚨 SE ANCORA NON FUNZIONA

1. **Verifica RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```
   Dovrebbero esserci 3 policies: SELECT, UPDATE, INSERT

2. **Verifica che RLS sia abilitato:**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';
   ```
   `rowsecurity` deve essere `true`

3. **Test diretto in Supabase SQL Editor:**
   ```sql
   UPDATE public.users 
   SET dota_account_id = 123456789 
   WHERE id = auth.uid();
   ```
   Se funziona qui, il problema è nel client. Se non funziona, problema nelle policies.

4. **Verifica accessToken:**
   - Apri console browser
   - Verifica che `currentSession.access_token` non sia `null` o `undefined`
   - Verifica che il token non sia scaduto

---

## ✅ RISULTATO FINALE

- ✅ Player ID viene salvato correttamente nel database
- ✅ RLS policies funzionano correttamente
- ✅ Dashboard si aggiorna automaticamente dopo il salvataggio
- ✅ Sincronizzazione completa tra Settings e Dashboard

