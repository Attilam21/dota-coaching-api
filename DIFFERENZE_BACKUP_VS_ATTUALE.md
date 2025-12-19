# 🔍 DIFFERENZE BACKUP FUNZIONANTE vs ATTUALE

## 📋 BRANCH DI BACKUP
- **Branch**: `backup/pre-modifiche-20251218`
- **Stato**: ✅ Funzionava (nessun errore 403)

---

## 🔑 DIFFERENZA CHIAVE: `app/dashboard/settings/page.tsx`

### ✅ BACKUP (FUNZIONAVA)
```typescript
// NON faceva query a Supabase!
// Salvava SOLO in localStorage
const handleSave = async (e: React.FormEvent) => {
  // ...
  // Salva SOLO in localStorage (via PlayerIdContext)
  // Non usiamo più Supabase per evitare errori RLS
  const playerIdString = dotaAccountId.trim() || null
  
  if (playerIdString) {
    localStorage.setItem('fzth_player_id', playerIdString)
  } else {
    localStorage.removeItem('fzth_player_id')
  }
  
  // Update context (this will trigger re-renders)
  setPlayerId(playerIdString)
}
```

**Caratteristiche**:
- ✅ Nessuna query SELECT a Supabase
- ✅ Nessuna query INSERT/UPDATE a Supabase
- ✅ Salva SOLO in localStorage
- ✅ Usa `usePlayerIdContext` per sincronizzare
- ✅ Nessun errore 403

### ❌ ATTUALE (NON FUNZIONA)
```typescript
// Fa query a Supabase → ERRORE 403!
const { data, error } = await supabase
  .from('users')
  .select('dota_account_id')  // ❌ 403 Forbidden
  .eq('id', user.id)
  .maybeSingle()

// E poi INSERT/UPDATE
await supabase
  .from('users')
  .insert({ ... })  // ❌ 403 Forbidden
```

**Problemi**:
- ❌ Query SELECT a Supabase → 403
- ❌ Query INSERT/UPDATE a Supabase → 403
- ❌ RLS policies bloccano l'accesso

---

## 🔑 DIFFERENZA: `lib/supabase.ts`

### ✅ BACKUP (SEMPLICE)
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabase: SupabaseClient<Database>

if (!supabaseUrl || !supabaseAnonKey) {
  // Mock client
} else {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
```

**Caratteristiche**:
- ✅ Versione SEMPLICE
- ✅ Nessun custom fetch
- ✅ Nessun logging extra
- ✅ Nessuna funzione wrapper

### ❌ ATTUALE (COMPLESSO)
```typescript
function createSupabaseClient(): SupabaseClient<Database> {
  // ... validazioni ...
  // ... logging ...
  // ... commenti ...
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
    },
  })
  // ... debug logging ...
  return client
}
```

**Differenze**:
- ⚠️ Versione più complessa
- ⚠️ Aggiunto `storage` e `storageKey`
- ⚠️ Aggiunto logging debug

---

## 🎯 SOLUZIONE: TORNARE AL SISTEMA DEL BACKUP

### ✅ COSA FUNZIONAVA
1. **Settings Page**: Salva SOLO in localStorage, NON in Supabase
2. **PlayerIdContext**: Legge da localStorage, NON da Supabase
3. **Nessuna query RLS**: Nessun errore 403

### ❌ COSA NON FUNZIONA ORA
1. **Settings Page**: Cerca di salvare in Supabase → 403
2. **PlayerIdContext**: Cerca di leggere da Supabase → 403
3. **Query RLS**: Bloccate dalle policies

---

## 📊 CONFRONTO COMPLETO

| Aspetto | BACKUP (Funzionava) | ATTUALE (Non funziona) |
|---------|---------------------|------------------------|
| **Salvataggio Player ID** | ✅ localStorage | ❌ Supabase (403) |
| **Lettura Player ID** | ✅ localStorage | ❌ Supabase (403) |
| **Query Supabase** | ✅ Nessuna | ❌ SELECT/INSERT/UPDATE |
| **Errori 403** | ✅ Nessuno | ❌ Continui |
| **RLS Policies** | ✅ Non usate | ❌ Bloccano accesso |
| **Supabase Client** | ✅ Semplice | ⚠️ Complesso |

---

## 🔧 RACCOMANDAZIONE

**Tornare al sistema del backup**:
1. ✅ Settings Page: Salva SOLO in localStorage
2. ✅ PlayerIdContext: Legge SOLO da localStorage
3. ✅ Rimuovere tutte le query a Supabase per Player ID
4. ✅ Mantenere Supabase solo per autenticazione (auth.*)

**Vantaggi**:
- ✅ Nessun errore 403
- ✅ Funziona immediatamente
- ✅ Più semplice
- ✅ Nessun problema RLS

**Svantaggi**:
- ⚠️ Player ID non sincronizzato tra dispositivi
- ⚠️ Player ID perso se si cancella localStorage

**Ma**: Per MVP, localStorage è sufficiente!

