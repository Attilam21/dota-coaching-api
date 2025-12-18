# 🔄 Piano di Backup e Ripristino - Dota 2 Coaching Platform

**Data creazione**: 18 Dicembre 2025  
**Scopo**: Documento di riferimento per ripristinare il codice in caso di problemi durante le modifiche

---

## ✅ BACKUP COMPLETATO

### Branch di Backup Creato
```
✅ Branch: backup/pre-modifiche-20251218
✅ Push: Completato su origin
✅ Stato: Backup sicuro disponibile
```

### Git Status Attuale
```
Branch: main
Status: Clean (working tree clean)
Ultimo commit: 10118bf - fix: rimossi import inutilizzati LineChart e Line da heroes page
```

### Commit Hash di Riferimento
```
10118bf - fix: rimossi import inutilizzati LineChart e Line da heroes page
e328ba0 - chore: force Vercel deployment - build verified successful
0777997 - chore: trigger Vercel deployment - fix Hero Pool cards and charts
```

**Commit di backup**: `10118bf` (stato attuale funzionante)  
**Branch di backup**: `backup/pre-modifiche-20251218` (disponibile su GitHub)

---

## 🛡️ PROCEDURA DI BACKUP

### Opzione 1: Creare Branch di Backup (CONSIGLIATO)

```bash
# 1. Crea branch di backup
git checkout -b backup/pre-modifiche-$(date +%Y%m%d)

# 2. Push del branch di backup
git push origin backup/pre-modifiche-$(date +%Y%m%d)

# 3. Torna su main
git checkout main
```

### Opzione 2: Tag di Backup

```bash
# Crea tag di backup
git tag backup-pre-modifiche-$(date +%Y%m%d)
git push origin backup-pre-modifiche-$(date +%Y%m%d)
```

### Opzione 3: Stash (per modifiche non committate)

```bash
# Salva modifiche correnti
git stash save "Backup pre-modifiche $(date +%Y%m%d-%H%M%S)"

# Lista stash
git stash list

# Ripristina stash (se necessario)
git stash pop
```

---

## 🔄 PROCEDURA DI RIPRISTINO

### Scenario 1: Ripristino Completo da Branch di Backup

```bash
# 1. Verifica branch di backup
git branch -a | grep backup

# 2. Torna al commit di backup
git checkout backup/pre-modifiche-YYYYMMDD

# 3. Se vuoi sovrascrivere main (ATTENZIONE!)
git checkout main
git reset --hard backup/pre-modifiche-YYYYMMDD
git push origin main --force  # ⚠️ SOLO SE NECESSARIO
```

### Scenario 2: Ripristino da Commit Hash

```bash
# 1. Torna al commit di riferimento
git checkout 10118bf

# 2. Crea nuovo branch da questo commit
git checkout -b restore-from-10118bf

# 3. Se vuoi sovrascrivere main
git checkout main
git reset --hard 10118bf
git push origin main --force  # ⚠️ SOLO SE NECESSARIO
```

### Scenario 3: Ripristino File Specifici

```bash
# Ripristina un singolo file dal commit di backup
git checkout 10118bf -- path/to/file.tsx

# Ripristina più file
git checkout 10118bf -- app/dashboard/heroes/page.tsx components/InsightBadge.tsx
```

### Scenario 4: Ripristino da Tag

```bash
# Lista tag
git tag -l

# Torna al tag di backup
git checkout backup-pre-modifiche-YYYYMMDD

# Crea branch da tag
git checkout -b restore-from-tag backup-pre-modifiche-YYYYMMDD
```

---

## 📝 FILE CHE VERRAANNO MODIFICATI

### File Critici (P0 - Fix AI Insight)

1. **`app/api/insights/profile/route.ts`**
   - **Modifica**: Aggiunta error handling graceful per API keys mancanti
   - **Rischio**: Basso (solo miglioramento error handling)
   - **Backup**: `git show 10118bf:app/api/insights/profile/route.ts`

2. **`components/InsightBadge.tsx`**
   - **Modifica**: Aggiunta fallback graceful e messaggi utente-friendly
   - **Rischio**: Basso (solo miglioramento UX)
   - **Backup**: `git show 10118bf:components/InsightBadge.tsx`

### File Importanti (P1 - Validazioni Calcoli)

3. **`app/dashboard/heroes/page.tsx`**
   - **Modifica**: Validazioni calcoli secondo best practices
   - **Rischio**: Medio (modifica logica calcoli)
   - **Backup**: `git show 10118bf:app/dashboard/heroes/page.tsx`

4. **`app/dashboard/page.tsx`**
   - **Modifica**: Validazioni calcoli
   - **Rischio**: Medio
   - **Backup**: `git show 10118bf:app/dashboard/page.tsx`

5. **`app/dashboard/performance/page.tsx`**
   - **Modifica**: Validazioni calcoli
   - **Rischio**: Medio
   - **Backup**: `git show 10118bf:app/dashboard/performance/page.tsx`

### File Miglioramenti (P2 - UI/UX)

6. Altri file dashboard (se necessario)
   - **Modifica**: Miglioramenti UI/UX
   - **Rischio**: Basso

---

## 🔍 VERIFICA PRE-MODIFICHE

### Checklist Pre-Modifiche

- [x] Repository pulito (working tree clean)
- [x] Branch main aggiornato
- [x] Commit hash di riferimento documentato: `10118bf`
- [ ] Branch di backup creato (da creare prima di iniziare)
- [ ] Test funzionamento attuale (opzionale ma consigliato)

### Test Rapido Pre-Modifiche

```bash
# 1. Verifica che il progetto compili
npm run build

# 2. Verifica lint
npm run lint

# 3. Avvia dev server (opzionale)
npm run dev
```

---

## 🚨 PROCEDURA DI EMERGENZA

### Se Qualcosa Va Storto

#### Step 1: Ferma Tutto
```bash
# Interrompi qualsiasi processo in esecuzione
# Ctrl+C nel terminale
```

#### Step 2: Verifica Stato
```bash
# Controlla cosa è stato modificato
git status

# Vedi differenze
git diff
```

#### Step 3: Ripristino Immediato
```bash
# Opzione A: Ripristina tutto
git reset --hard 10118bf

# Opzione B: Ripristina file specifici
git checkout 10118bf -- path/to/file.tsx

# Opzione C: Annulla modifiche non committate
git checkout -- .
```

#### Step 4: Verifica Ripristino
```bash
# Verifica che tutto sia tornato normale
git status
npm run build
```

---

## 📦 BACKUP MANUALE FILE CRITICI

### Comandi per Backup Manuale

```bash
# Crea directory di backup
mkdir -p .backup/$(date +%Y%m%d-%H%M%S)

# Copia file critici
cp app/api/insights/profile/route.ts .backup/$(date +%Y%m%d-%H%M%S)/
cp components/InsightBadge.tsx .backup/$(date +%Y%m%d-%H%M%S)/
cp app/dashboard/heroes/page.tsx .backup/$(date +%Y%m%d-%H%M%S)/
cp app/dashboard/page.tsx .backup/$(date +%Y%m%d-%H%M%S)/
cp app/dashboard/performance/page.tsx .backup/$(date +%Y%m%d-%H%M%S)/

# Lista backup
ls -la .backup/
```

### Ripristino da Backup Manuale

```bash
# Ripristina file da backup manuale
cp .backup/YYYYMMDD-HHMMSS/route.ts app/api/insights/profile/
cp .backup/YYYYMMDD-HHMMSS/InsightBadge.tsx components/
# ... etc
```

---

## ✅ CHECKLIST POST-MODIFICHE

### Verifica che Tutto Funzioni

- [ ] `npm run build` compila senza errori
- [ ] `npm run lint` non mostra errori critici
- [ ] Bottoni AI Insight funzionano o mostrano messaggio chiaro
- [ ] Calcoli dashboard corretti
- [ ] Nessun errore JavaScript in console
- [ ] UI responsive funziona
- [ ] Test manuale pagine principali

### Se Tutto OK

```bash
# Commit modifiche
git add .
git commit -m "fix: miglioramenti error handling e validazioni calcoli"

# Push (se approvato)
git push origin main
```

### Se Qualcosa Non Funziona

```bash
# Ripristina immediatamente
git reset --hard 10118bf
```

---

## 📞 COMANDI RAPIDI DI RIFERIMENTO

### Backup
```bash
git checkout -b backup/pre-modifiche-$(date +%Y%m%d)
git push origin backup/pre-modifiche-$(date +%Y%m%d)
git checkout main
```

### Ripristino Completo
```bash
# Opzione A: Da branch di backup (CONSIGLIATO)
git checkout backup/pre-modifiche-20251218
git checkout -b restore-from-backup
# Oppure sovrascrivi main (ATTENZIONE!)
git checkout main
git reset --hard backup/pre-modifiche-20251218

# Opzione B: Da commit hash
git reset --hard 10118bf
```

### Ripristino File Specifico
```bash
git checkout 10118bf -- path/to/file.tsx
```

### Verifica Stato
```bash
git status
git diff
git log --oneline -5
```

---

## 🎯 STRATEGIA DI MODIFICHE INCREMENTALI

Per minimizzare i rischi, procederò con modifiche incrementali:

1. **Fase 1**: Fix AI Insight (2 file)
   - Commit separato
   - Test immediato
   - Se OK → procedi, se NO → ripristino

2. **Fase 2**: Validazioni calcoli (1 file alla volta)
   - Commit per ogni file
   - Test dopo ogni modifica
   - Se OK → procedi, se NO → ripristino file specifico

3. **Fase 3**: UI/UX miglioramenti
   - Commit separati
   - Test incrementali

---

## 📋 LOG DELLE MODIFICHE

### Modifiche Pianificate

| Data | File | Modifica | Status | Commit Hash |
|------|------|----------|--------|-------------|
| - | `app/api/insights/profile/route.ts` | Fix error handling | ⏳ Pianificato | - |
| - | `components/InsightBadge.tsx` | Fallback graceful | ⏳ Pianificato | - |
| - | `app/dashboard/heroes/page.tsx` | Validazioni calcoli | ⏳ Pianificato | - |
| - | `app/dashboard/page.tsx` | Validazioni calcoli | ⏳ Pianificato | - |
| - | `app/dashboard/performance/page.tsx` | Validazioni calcoli | ⏳ Pianificato | - |

---

## 🔐 SICUREZZA

### Prima di Ogni Modifica

1. ✅ Verifica branch di backup creato
2. ✅ Verifica commit hash di riferimento
3. ✅ Test build attuale funzionante
4. ✅ Backup manuale file critici (opzionale)

### Durante le Modifiche

1. ✅ Commit incrementali
2. ✅ Test dopo ogni modifica
3. ✅ Verifica build dopo ogni commit

### Dopo le Modifiche

1. ✅ Test completo funzionalità
2. ✅ Verifica build produzione
3. ✅ Documentazione modifiche

---

## 📝 NOTE IMPORTANTI

- **NON modificherò**: Pattern di fetching OpenDota, PlayerIdContext, API routes esistenti (solo fix error handling)
- **Modificherò solo**: Error handling, validazioni calcoli, UI/UX miglioramenti
- **Approccio**: Incrementale, test dopo ogni modifica, commit atomici

---

**Ultimo aggiornamento**: Gennaio 2025  
**Commit di riferimento**: `10118bf`  
**Branch attuale**: `main`

---

## 🚀 PRONTO PER INIZIARE

Una volta creato il branch di backup, posso procedere con le modifiche in modo sicuro e incrementale.

**✅ BACKUP GIÀ CREATO**:
```bash
✅ Branch: backup/pre-modifiche-20251218
✅ Push: Completato
✅ Repository: Pronto per modifiche
```

## 🚀 STATO: PRONTO PER PROCEDERE

Il backup è stato creato con successo. Posso procedere con le modifiche in modo sicuro.

**Per ripristinare in caso di problemi**:
```bash
git checkout backup/pre-modifiche-20251218
# Oppure
git reset --hard 10118bf
```

**Procedo con le modifiche?** 🛡️

