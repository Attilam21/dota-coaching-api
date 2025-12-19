# 📊 Analisi: Rimozione Tabella `match_analyses`

**Data**: Dicembre 2025  
**Obiettivo**: Capire l'impatto della rimozione del salvataggio match

---

## 🔍 Analisi Impatto

### ✅ Dove è Usato Attualmente

**1. Salvataggio Match** (`app/analysis/match/[id]/page.tsx`)
- Funzione `handleSaveAnalysis()` (righe 178-223)
- Salva analisi custom in `match_analyses.analysis_data`
- **NON salva il match completo** (OpenDota è source of truth)

**2. TypeScript Types** (`lib/supabase.ts`)
- Definizione tipo `match_analyses` nel Database type
- Usato solo per type safety

**3. Database Schema** (`supabase/schema.sql`)
- Tabella `match_analyses` con RLS policies
- Indici per performance

### ❌ Dove NON è Usato

**1. Dashboard Matches** (`app/dashboard/matches/page.tsx`)
- ✅ **NON usa `match_analyses`**
- ✅ Fetcha direttamente da OpenDota API (`/api/player/${playerId}/stats`)
- ✅ Mostra match recenti dal player ID, non da database

**2. Visualizzazione Match Salvati**
- ❌ **NON esiste pagina che mostra match salvati da `match_analyses`**
- ❌ Nessun componente che legge da questa tabella

**3. Altre Features**
- ❌ Nessuna feature dipende da `match_analyses`
- ❌ Nessun report o statistiche basate su match salvati

---

## ⚠️ Cosa Succede Se Rimuoviamo

### ✅ Cosa CONTINUA a Funzionare

1. **Visualizzazione Match**
   - ✅ Dashboard matches funziona (usa OpenDota API)
   - ✅ Match analysis page funziona (usa OpenDota API)
   - ✅ Player analysis funziona (usa OpenDota API)

2. **Tutte le Features**
   - ✅ Dashboard completo
   - ✅ Performance stats
   - ✅ Hero analysis
   - ✅ Tutto basato su OpenDota API, non su database

### ❌ Cosa SMETTE di Funzionare

1. **Salvataggio Analisi**
   - ❌ Bottone "Salva Analisi" nella match page non funzionerà
   - ❌ Nessun modo per salvare analisi personali

2. **Nessun Altro Impatto**
   - ✅ Tutto il resto funziona normalmente

---

## 🎯 Conclusione

### Impatto: **MINIMO** ✅

**Motivi**:
1. La tabella è usata **SOLO** per salvare analisi custom
2. **Nessuna feature** legge da questa tabella
3. Tutte le visualizzazioni usano **OpenDota API direttamente**
4. Rimuoverla **non rompe nulla** di esistente

### Rischi: **ZERO** ✅

- Nessuna dipendenza da altri componenti
- Nessun dato critico perso (analisi custom non sono essenziali)
- Facile da ripristinare in futuro se necessario

---

## 📋 Azioni Richieste per Rimozione

### 1. Database
```sql
-- Rimuovi tabella (opzionale, può rimanere vuota)
DROP TABLE IF EXISTS public.match_analyses CASCADE;
```

**Nota**: `CASCADE` rimuove anche:
- Indici associati
- RLS policies
- Foreign key constraints

### 2. Codice
- Rimuovere `handleSaveAnalysis()` da `app/analysis/match/[id]/page.tsx`
- Rimuovere bottone "Salva Analisi" dalla UI
- Rimuovere tipo `match_analyses` da `lib/supabase.ts` (opzionale)

### 3. Documentazione
- Aggiornare `supabase/schema.sql` (rimuovere tabella)
- Aggiornare documentazione che menziona `match_analyses`

---

## 💡 Suggerimento PM

**Raccomandazione**: ✅ **RIMUOVERE**

**Motivi**:
1. **YAGNI Principle** (You Aren't Gonna Need It)
   - Non è usato da nessuna feature
   - Aggiunge complessità senza valore

2. **Manutenzione**
   - Meno codice da mantenere
   - Meno database schema da gestire
   - Meno RLS policies da configurare

3. **Performance**
   - Meno tabelle = query più veloci
   - Meno storage usato

4. **Futuro**
   - Se servirà in futuro, è facile riaggiungere
   - OpenDota API è sempre disponibile come source of truth

---

## 🔄 Alternativa: Lasciare Vuota

Se preferisci **non rimuovere** ma **disabilitare**:

1. ✅ Lascia tabella nel database (vuota)
2. ✅ Rimuovi solo il codice che scrive
3. ✅ Mantieni schema per futuro

**Pro**: Facile riabilitare in futuro  
**Contro**: Mantiene complessità inutile

---

**Raccomandazione Finale**: **Rimuovere completamente** ✅

