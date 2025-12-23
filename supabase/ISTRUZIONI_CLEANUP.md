# 🧹 Istruzioni Pulizia Database Supabase

## ⚠️ ATTENZIONE
Questo script **ELIMINA DATI**! Esegui solo se sei sicuro.

## 📋 Cosa viene rimosso:

### Tabelle da rimuovere:
- ✅ `public.users` - Non usata (Player ID in localStorage)
- ✅ `public.match_analyses` - Non usata nel codice
- ✅ Tutte le tabelle gamification (achievements, user_stats, ecc.)
- ✅ Tutte le tabelle coaching/learning (non implementate)
- ✅ Tutte le tabelle vecchie (matches, heroes, items, ecc.)

### Cosa rimane:
- ✅ `auth.users` - Gestito automaticamente da Supabase (autenticazione)

## 🚀 Come eseguire:

1. **Vai su Supabase Dashboard**
   - Apri: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb
   - Oppure: https://supabase.com/dashboard → Seleziona progetto

2. **Apri SQL Editor**
   - Menu laterale → **"SQL Editor"**
   - Clicca **"New Query"**

3. **Copia e incolla lo script**
   - Apri il file `supabase/CLEANUP_FINAL.sql`
   - Copia tutto il contenuto
   - Incolla nel SQL Editor

4. **Esegui lo script**
   - Clicca **"RUN"** (o premi `Ctrl+Enter`)
   - Attendi il completamento

5. **Verifica risultato**
   - Lo script mostra le tabelle rimanenti
   - Dovresti vedere 0 tabelle in `public` schema
   - Solo `auth.users` rimane (gestito da Supabase)

## ✅ Verifica finale:

Dopo l'esecuzione, esegui questa query per verificare:

```sql
SELECT 
  table_name,
  'Should be empty' as note
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Risultato atteso**: Nessuna riga (0 tabelle in public schema)

## 📝 Note:

- `auth.users` è gestito automaticamente da Supabase e NON viene toccato
- Tutti i dati in `public.users` e `public.match_analyses` verranno eliminati
- Il trigger `handle_new_user` viene rimosso (non serve più)

