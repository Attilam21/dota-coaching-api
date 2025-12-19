# 🔑 Spiegazione: Chiavi Supabase e "Placeholder"

## 📋 LE CHIAVI SUPABASE

Supabase ha **2 tipi di chiavi API**:

### 1. **Anon Key** (Pubblica) ✅ USATA
- **Nome**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Dove si trova**: Dashboard Supabase → Settings → API → `anon` `public` key
- **Cosa fa**: 
  - Chiave **pubblica** che può essere esposta nel frontend
  - Rispetta le **RLS Policies** (Row Level Security)
  - Gli utenti possono accedere solo ai loro dati
- **Usata nel codice**: ✅ Sì, in `lib/supabase.ts`

### 2. **Service Role Key** (Privata) ⚠️ NON USATA
- **Nome**: `SUPABASE_SERVICE_ROLE_KEY`
- **Dove si trova**: Dashboard Supabase → Settings → API → `service_role` `secret` key
- **Cosa fa**:
  - Chiave **privata** che **bypassa RLS**
  - Ha accesso **completo** al database
  - **NON deve essere esposta** nel frontend!
  - Usata solo per operazioni server-side privilegiate
- **Usata nel codice**: ❌ No, non è referenziata da nessuna parte

---

## ❓ PERCHÉ "PLACEHOLDER"?

La variabile `SUPABASE_SERVICE_ROLE_KEY` con valore `placeholder_service_role_key` è stata probabilmente:

1. **Aggiunta durante il setup iniziale** come "promemoria" per il futuro
2. **Mai configurata** con la chiave reale perché non serve (non è usata nel codice)
3. **Lasciata come placeholder** per indicare che non è ancora configurata

---

## 🔍 VERIFICA: È NECESSARIA?

**NO, non è necessaria** perché:
- ❌ Non è usata nel codice
- ❌ Non è referenziata in nessun file
- ❌ L'app funziona solo con `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ✅ COSA FARE?

### Opzione 1: Rimuoverla (Consigliato)
Se non la usi, puoi **rimuoverla** da Vercel:
1. Vai su Vercel Dashboard → Settings → Environment Variables
2. Cerca `SUPABASE_SERVICE_ROLE_KEY`
3. Clicca sui 3 puntini → **Delete**

### Opzione 2: Configurarla (Solo se serve in futuro)
Se in futuro avrai bisogno di operazioni server-side privilegiate:
1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb)
2. Settings → API → `service_role` `secret` key
3. Copia la chiave
4. Sostituisci `placeholder_service_role_key` con la chiave reale su Vercel

**⚠️ ATTENZIONE**: La Service Role Key **bypassa RLS**! Usala solo per:
- Operazioni admin
- Migrations
- Script server-side
- **MAI nel frontend!**

---

## 📊 RIEPILOGO

| Chiave | Tipo | Usata? | Necessaria? | Dove |
|--------|------|--------|-------------|------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pubblica | ✅ Sì | ✅ Sì | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Privata | ❌ No | ❌ No | Server-side (non usata) |

---

## 🎯 RACCOMANDAZIONE

**Rimuovi `SUPABASE_SERVICE_ROLE_KEY`** da Vercel se non la usi. È solo confusione e non serve.

Se in futuro avrai bisogno di operazioni privilegiate, potrai sempre aggiungerla di nuovo.

