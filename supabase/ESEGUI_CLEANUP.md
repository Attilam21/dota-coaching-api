# 🚀 Come Eseguire CLEANUP_FINAL.sql

## ✅ Metodo più semplice: SQL Editor (CONSIGLIATO)

1. Apri: https://supabase.com/dashboard/project/yzfjtrteezvyoudpfccb/sql/new
2. Copia tutto il contenuto di `supabase/CLEANUP_FINAL.sql`
3. Incolla nell'editor SQL
4. Clicca **"Run"** (o premi `Ctrl+Enter`)

✅ **Questo è il metodo più semplice e non richiede password!**

---

## 🔧 Metodo alternativo: Supabase CLI

Se vuoi usare il CLI (già installato come dev dependency):

### Opzione 1: Con link al progetto

```bash
# 1. Fai login (se non l'hai già fatto)
npx supabase login

# 2. Linka il progetto
npx supabase link --project-ref yzfjtrteezvyoudpfccb

# 3. Pusha la migration
npx supabase db push
```

### Opzione 2: Con connection string diretta

```bash
# Usa la connection string dal dashboard Supabase
# Settings → Database → Connection string
npx supabase db push --db-url "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@..."
```

---

## 📋 Cosa fa lo script:

- ✅ Rimuove tutte le tabelle non utilizzate in `public` schema
- ✅ Rimuove trigger e funzioni associate
- ✅ Lascia solo `auth.users` (gestito automaticamente da Supabase)

⚠️ **ATTENZIONE**: Questo script ELIMINA dati! Esegui solo se sei sicuro.

