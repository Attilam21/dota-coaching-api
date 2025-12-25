# Analisi e Semplificazione Dashboard

## 📊 Situazione Attuale

### **Pagine nel Menu (DashboardLayout.tsx)**

#### PANORAMICA
- ✅ Panoramica (`/dashboard`)

#### ANALISI
- ✅ Performance & Stile (`/dashboard/performance`)
- ✅ Il Mio Pool (`/dashboard/heroes`)
- ✅ Matchup & Counter (`/dashboard/hero-analysis`)
- ✅ Analisi Ruolo (`/dashboard/role-analysis`)
- ✅ I Tuoi Compagni (`/dashboard/teammates`)
- ✅ Storico Partite (`/dashboard/matches`)
- ✅ Analisi Avanzate (`/dashboard/advanced`) + 4 sottopagine
- ✅ Build & Items (`/dashboard/builds`)

#### ANALISI PREDITTIVE
- ✅ Overview Predittivo (`/dashboard/predictions`)
- ✅ Path to Improvement (`/dashboard/predictions/improvement-path`)
- ✅ What-If Analysis (`/dashboard/predictions/what-if`)

#### COACHING
- ✅ Coaching & Insights (`/dashboard/coaching-insights`)
- ✅ Anti-Tilt (`/dashboard/anti-tilt`)

#### CONFIGURAZIONE
- ✅ Impostazioni Account (`/dashboard/settings`)

#### ACCESSORI
- ✅ Giochi Anti-Tilt (`/dashboard/games`)

### **Pagine NON nel Menu (ma esistenti)**
- ❓ AI Summary (`/dashboard/ai-summary`) - **DUPLICATO?**
- ❓ Coaching (`/dashboard/coaching`) - **DUPLICATO di coaching-insights?**
- ❓ Profiling (`/dashboard/profiling`) - **DUPLICATO di performance?**
- ❓ Match Advice (`/dashboard/match-advice`) - **DUPLICATO?**
- ❓ Graphics Demo (`/dashboard/graphics-demo`) - **DEV ONLY?**
- ❓ Achievements (`/dashboard/achievements`) - **NON USATO?**
- ❓ Quiz (`/dashboard/quiz`) - **NON USATO?**

---

## 🔍 Analisi Duplicati e Ridondanze

### **1. COACHING - Analisi Dettagliata**

**Situazione:**
- `/dashboard/coaching` - **NON nel menu**, mostra:
  - Tab "Meta" (meta-comparison)
  - Tab "Win Conditions"
  - API: `/api/player/[id]/meta-comparison`, `/api/player/[id]/win-conditions`

- `/dashboard/coaching-insights` - **Nel menu**, mostra:
  - Tab "Overview" (profile + insights)
  - Tab "Meta" (meta-comparison) ← **DUPLICATO di coaching**
  - Tab "Win Conditions" ← **DUPLICATO di coaching**
  - Tab "Recommendations"
  - API: `/api/player/[id]/profile`, `/api/player/[id]/meta-comparison`, `/api/player/[id]/win-conditions`

- `/dashboard/ai-summary` - **NON nel menu**, mostra:
  - Tab "Profile" (AI summary del profilo)
  - Tab "Match" (AI summary di una partita)
  - API: `/api/ai-summary/profile/[id]`, `/api/ai-summary/match/[id]`

**Conclusione:**
- `coaching-insights` è **SUPERSET** di `coaching` (include tutto + di più)
- `ai-summary` è **DIVERSO** (genera summary AI, non coaching)

**Soluzione:**
- ✅ **MANTIENI**: `coaching-insights` (più completo, nel menu)
- ❌ **RIMUOVI**: `coaching` (duplicato, subset di coaching-insights)
- 🔄 **MERGE o MANTIENI**: `ai-summary` (diverso, ma potrebbe essere tab in coaching-insights)

---

### **2. PROFILING vs PERFORMANCE**

**Situazione:**
- `/dashboard/profiling` - **NON nel menu**, mostra:
  - Tab "Overview" (role, playstyle, strengths, weaknesses, metrics)
  - Tab "Advanced" (trends, phase analysis)
  - Tab "Analysis" (radar chart, visualizations)
  - Tab "Visualizations" (trend charts)
  - API: `/api/player/[id]/profile`

- `/dashboard/performance` - **Nel menu**, mostra:
  - Performance metrics (KDA, GPM, playstyle)
  - Radar chart (KDA, GPM, Teamfight, Survival)
  - API: `/api/player/[id]/stats`, `/api/player/[id]/advanced-stats`

**Conclusione:**
- `profiling` è **PIÙ COMPLETO** (4 tab, profilo dettagliato)
- `performance` è **PIÙ SEMPLICE** (metriche base, radar chart)
- Sono **COMPLEMENTARI** ma `profiling` ha più dati

**Soluzione:**
- 🔄 **DECISIONE**: 
  - Opzione A: **MANTIENI ENTRAMBI** (profiling = dettagliato, performance = veloce)
  - Opzione B: **MERGE** profiling in performance (aggiungi tab "Profilo Completo")
  - Opzione C: **RIMUOVI** performance, mantieni solo profiling (più completo)

---

### **3. MATCH ADVICE vs MATCH ANALYSIS**

**Problema:**
- `/dashboard/match-advice` - Non nel menu
- `/dashboard/match-analysis/[id]` - Dettaglio singola partita
- `/dashboard/matches` - Lista partite

**Analisi:**
- `match-advice`: Consigli per partita specifica?
- `match-analysis`: Analisi dettagliata partita
- `matches`: Lista partite

**Soluzione:**
- ✅ **MANTIENI**: `matches` (lista)
- ✅ **MANTIENI**: `match-analysis/[id]` (dettaglio)
- ❌ **RIMUOVI o MERGE**: `match-advice` (se duplicato, integrare in match-analysis)

---

### **4. PAGINE DEV/TEST**

**Problema:**
- `/dashboard/graphics-demo` - Probabilmente per test
- `/dashboard/achievements` - Non usato?
- `/dashboard/quiz` - Non usato?

**Soluzione:**
- ❌ **RIMUOVI**: `graphics-demo` (o spostare in `/dev/graphics-demo`)
- ❌ **RIMUOVI**: `achievements` (se non usato)
- ❌ **RIMUOVI**: `quiz` (se non usato)

---

## ✅ Proposta Semplificazione

### **Struttura Finale (Vendibile)**

#### **PANORAMICA**
- ✅ Panoramica (`/dashboard`)

#### **ANALISI**
- ✅ Performance & Stile (`/dashboard/performance`) - **CONSOLIDATO** (include profiling)
- ✅ Il Mio Pool (`/dashboard/heroes`)
- ✅ Matchup & Counter (`/dashboard/hero-analysis`)
- ✅ Analisi Ruolo (`/dashboard/role-analysis`)
- ✅ I Tuoi Compagni (`/dashboard/teammates`)
- ✅ Storico Partite (`/dashboard/matches`)
- ✅ Analisi Avanzate (`/dashboard/advanced`) + 4 sottopagine
- ✅ Build & Items (`/dashboard/builds`)

#### **ANALISI PREDITTIVE**
- ✅ Overview Predittivo (`/dashboard/predictions`)
- ✅ Path to Improvement (`/dashboard/predictions/improvement-path`)
- ✅ What-If Analysis (`/dashboard/predictions/what-if`)

#### **COACHING**
- ✅ Coaching & Insights (`/dashboard/coaching-insights`) - **CONSOLIDATO** (include ai-summary e coaching)
- ✅ Anti-Tilt (`/dashboard/anti-tilt`)

#### **CONFIGURAZIONE**
- ✅ Impostazioni Account (`/dashboard/settings`) - **AGGIORNA** (mostra limite 3 cambi)

#### **ACCESSORI**
- ✅ Giochi Anti-Tilt (`/dashboard/games`)

---

## 🔄 Flussi Utente Coerenti

### **Flusso 1: Primo Accesso (Nuovo Utente)**

```
1. Login/Registrazione
   ↓
2. Dashboard → PlayerIdInput (se non ha ID)
   ↓
3. Inserisce Player ID → Salva in DB (change_count = 0)
   ↓
4. Dashboard carica dati OpenDota
   ↓
5. Profilazione calcolata e cacheata (7 giorni)
   ↓
6. Utente vede Panoramica con dati
```

### **Flusso 2: Login Successivo**

```
1. Login
   ↓
2. PlayerIdContext carica ID:
   - localStorage (se presente)
   - Supabase (se localStorage vuoto)
   - Risolve conflitti (DB = fonte verità)
   ↓
3. Dashboard carica dati:
   - Stats da OpenDota (sempre fresh)
   - Profilazione da cache (se valida) o ricalcola
   ↓
4. Utente vede dati aggiornati
```

### **Flusso 3: Cambio Player ID**

```
1. Utente va in Settings
   ↓
2. Vede:
   - ID attuale
   - Contatore cambi: "X/3 cambi rimanenti"
   - Warning se bloccato
   ↓
3. Cambia ID:
   - Se < 3 cambi → OK, incrementa contatore
   - Se = 3 cambi → ERRORE, mostra messaggio
   ↓
4. Se OK:
   - Salva in DB (trigger incrementa count)
   - Salva storico in player_id_history
   - Invalida cache profilazione vecchia
   - Aggiorna localStorage
   ↓
5. Dashboard si aggiorna automaticamente
```

### **Flusso 4: Navigazione Dashboard**

```
Panoramica (/dashboard)
  ↓
  ├─→ Performance & Stile (profilo completo)
  ├─→ Il Mio Pool (heroes)
  ├─→ Matchup & Counter
  ├─→ Analisi Ruolo
  ├─→ I Tuoi Compagni
  ├─→ Storico Partite
  │     └─→ Match Analysis (dettaglio)
  ├─→ Analisi Avanzate
  │     ├─→ Lane & Early
  │     ├─→ Farm & Economy
  │     ├─→ Fights & Damage
  │     └─→ Vision & Map Control
  ├─→ Build & Items
  ├─→ Coaching & Insights
  ├─→ Anti-Tilt
  └─→ Impostazioni (con limite 3 cambi)
```

---

## 🎯 Integrazione Nuovo Sistema

### **1. Settings Page - Mostra Limite 3 Cambi**

```typescript
// app/dashboard/settings/page.tsx

// Aggiungi sezione Player ID con:
- ID attuale
- Contatore: "Hai cambiato X/3 volte"
- Warning se bloccato: "Player ID bloccato. Contatta supporto."
- Disabilita input se bloccato
- Mostra storico cambi (opzionale)
```

### **2. PlayerIdContext - Gestione Conflitti**

```typescript
// lib/playerIdContext.tsx

// Al caricamento:
1. Carica da localStorage
2. Carica da Supabase
3. Se conflitto → usa DB (fonte verità)
4. Sincronizza localStorage con DB
5. Mostra warning se bloccato
```

### **3. API Profile - Cache**

```typescript
// app/api/player/[id]/profile/route.ts

// Flusso:
1. Controlla cache DB (player_profiles)
2. Se cache valida (< 7 giorni) → ritorna cache
3. Se cache scaduta o non esiste:
   - Chiama OpenDota
   - Calcola profilazione
   - Salva in cache
   - Ritorna risultato
```

---

## 📋 Checklist Semplificazione

### **Fase 1: Rimozione Duplicati**
- [ ] Verificare `coaching` vs `coaching-insights` → rimuovere duplicato
- [ ] Verificare `ai-summary` → merge in `coaching-insights` o rimuovere
- [ ] Verificare `profiling` → merge in `performance` o rimuovere
- [ ] Verificare `match-advice` → merge in `match-analysis` o rimuovere
- [ ] Rimuovere `graphics-demo` (o spostare in `/dev`)
- [ ] Rimuovere `achievements` (se non usato)
- [ ] Rimuovere `quiz` (se non usato)

### **Fase 2: Consolidamento**
- [ ] Unificare `coaching-insights` (include tutto coaching)
- [ ] Unificare `performance` (include profiling)
- [ ] Verificare che tutte le pagine nel menu funzionino

### **Fase 3: Integrazione Nuovo Sistema**
- [ ] Aggiornare `settings` per mostrare limite 3 cambi
- [ ] Aggiornare `PlayerIdContext` per gestire conflitti
- [ ] Aggiornare API `profile` per usare cache
- [ ] Testare flussi completi

### **Fase 4: Testing**
- [ ] Test primo accesso
- [ ] Test login successivo
- [ ] Test cambio ID (1, 2, 3 volte)
- [ ] Test blocco dopo 3 cambi
- [ ] Test cache profilazione
- [ ] Test navigazione dashboard

---

## 🎨 Coerenza UX

### **Pattern Comuni**

1. **Header Standard:**
   - HelpButton (sinistra)
   - Titolo (centro)
   - Settings link (destra, se applicabile)

2. **Loading States:**
   - Skeleton loaders consistenti
   - Spinner rosso (brand color)

3. **Error States:**
   - Banner rosso con messaggio chiaro
   - PlayerIdInput se manca ID

4. **Empty States:**
   - Messaggio chiaro
   - CTA per risolvere (es. "Inserisci Player ID")

5. **Navigation:**
   - Breadcrumb: "← Torna a Dashboard"
   - Link interni coerenti

---

## ❓ Decisioni da Prendere

### **1. Coaching** ✅ RISOLTO
- ❌ **RIMUOVI**: `coaching` (duplicato di coaching-insights)
- ✅ **MANTIENI**: `coaching-insights` (più completo)
- 🔄 **DECIDI**: `ai-summary` → merge in coaching-insights come tab "AI Summary" o rimuovere?

### **2. Profiling vs Performance** ⚠️ DA DECIDERE
- **Opzione A**: Mantieni entrambi (profiling = dettagliato, performance = veloce)
- **Opzione B**: Merge profiling in performance (aggiungi tab "Profilo Completo")
- **Opzione C**: Rimuovi performance, mantieni solo profiling (più completo)

**Raccomandazione**: **Opzione B** - Merge profiling in performance come tab aggiuntivo

### **3. Match Advice** ✅ RISOLTO
- `/dashboard/match-advice/[id]` - **NON nel menu**, mostra:
  - Consigli specifici per partita (actions, team composition, macro/micro advice)
  - API: `/api/match/[id]/game-advice`
  
- `/dashboard/match-analysis/[id]` - **Nel menu** (da matches), mostra:
  - Analisi dettagliata partita (stats, timeline, performance)
  - API: `/api/analysis/match/[id]`

**Conclusione:**
- Sono **COMPLEMENTARI** (advice = consigli, analysis = dati)
- `match-advice` non è nel menu ma è utile

**Soluzione:**
- 🔄 **MERGE**: Aggiungi tab "Consigli" in `match-analysis/[id]` che mostra dati da `match-advice`
- ❌ **RIMUOVI**: Pagina standalone `match-advice` (non serve se integrata)

### **4. Pagine Dev/Test** ✅ DA RIMUOVERE
- ❌ **RIMUOVI**: `graphics-demo` (dev only)
- ❌ **RIMUOVI**: `achievements` (se non usato)
- ❌ **RIMUOVI**: `quiz` (se non usato)

---

## ✅ Decisioni Finali

### **Pagine da RIMUOVERE:**
1. ❌ `/dashboard/coaching` → Duplicato di coaching-insights
2. ❌ `/dashboard/match-advice` (standalone) → Merge in match-analysis come tab
3. ❌ `/dashboard/graphics-demo` → Dev only
4. ❌ `/dashboard/achievements` → Non usato (verificare)
5. ❌ `/dashboard/quiz` → Non usato (verificare)

### **Pagine da MERGE/CONSOLIDARE:**
1. 🔄 `/dashboard/ai-summary` → Merge in coaching-insights come tab "AI Summary"
2. 🔄 `/dashboard/profiling` → Merge in performance come tab "Profilo Completo"
3. 🔄 `/dashboard/match-advice/[id]` → Merge in match-analysis come tab "Consigli"

### **Pagine da MANTENERE:**
- ✅ Tutte le pagine nel menu attuale
- ✅ `/dashboard/match-analysis/[id]` (dettaglio partita)

---

## 🚀 Piano Implementazione

### **Fase 1: Rimozione Duplicati** (Priorità Alta)
1. Rimuovere `/dashboard/coaching` (redirect a coaching-insights)
2. Rimuovere `/dashboard/graphics-demo`
3. Verificare e rimuovere `achievements` e `quiz` se non usati

### **Fase 2: Consolidamento** (Priorità Media)
1. Merge `ai-summary` in `coaching-insights` (tab "AI Summary")
2. Merge `profiling` in `performance` (tab "Profilo Completo")
3. Merge `match-advice` in `match-analysis` (tab "Consigli")

### **Fase 3: Integrazione Nuovo Sistema** (Priorità Alta)
1. Database: Aggiungere colonne limite 3 cambi
2. Settings: Mostrare contatore cambi
3. PlayerIdContext: Gestire conflitti localStorage ↔ DB
4. API Profile: Implementare cache

### **Fase 4: Testing** (Priorità Alta)
1. Test flussi completi
2. Test limite 3 cambi
3. Test cache profilazione
4. Test navigazione dashboard

### **Fase 5: Deploy** (Priorità Media)
1. Deploy con dashboard semplificata
2. Monitoraggio errori
3. Feedback utenti

