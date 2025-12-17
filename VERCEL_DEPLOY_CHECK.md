# 🔍 Checklist Deploy Vercel

## ✅ Verifica 1: Repository GitHub
- [ ] Repository: `Attilam21/dota-coaching-api`
- [ ] Branch principale: `main`
- [ ] Ultimo commit: `228b133` (Remove trailing blank line)

## ✅ Verifica 2: Vercel Dashboard
1. Vai su: https://vercel.com/dashboard
2. Trova il progetto `dota-coaching-api`
3. Controlla:
   - [ ] Settings → Git → Repository collegato: `Attilam21/dota-coaching-api`
   - [ ] Settings → Git → Production Branch: `main`
   - [ ] Deployments → Ultimo deploy esiste

## ✅ Verifica 3: Webhook GitHub
1. Vai su: https://github.com/Attilam21/dota-coaching-api/settings/hooks
2. Controlla:
   - [ ] Esiste un webhook di Vercel
   - [ ] Status: Active (verde)
   - [ ] Recent deliveries: ci sono chiamate recenti

## ✅ Verifica 4: Permessi Vercel
1. Vai su: https://github.com/settings/installations
2. Controlla:
   - [ ] Vercel è installato
   - [ ] Ha accesso a `dota-coaching-api`
   - [ ] Permessi: Repository access (tutti o solo `dota-coaching-api`)

## 🐞 Se non funziona ancora:

### Problema: "Repository not found"
**Soluzione:**
1. Vercel → Settings → Git → Disconnect
2. Vercel → Settings → Git → Connect → Seleziona `dota-coaching-api`
3. Autorizza Vercel su GitHub

### Problema: "Webhook not receiving events"
**Soluzione:**
1. GitHub → Settings → Webhooks → Trova Vercel
2. Clicca "Recent Deliveries"
3. Se vedi errori 401/403 → Vercel non ha permessi
4. Vai su GitHub → Settings → Applications → Vercel → Grant access

### Problema: "Build fails"
**Soluzione:**
1. Vercel → Deployments → Click ultimo deploy
2. Leggi "Build Logs"
3. Cerca errori TypeScript/dependencies
4. Se vedi errori, condividili e li risolviamo

## 🚀 Test Rapido
Dopo aver verificato tutto:
1. Fai un piccolo cambiamento (es. aggiungi un commento)
2. Commit e push
3. Vercel dovrebbe fare auto-deploy in 1-2 minuti

```bash
# Test commit
echo "// Test deploy" >> app/api/player/[id]/builds/route.ts
git add .
git commit -m "Test: verify Vercel auto-deploy"
git push
```

Poi controlla Vercel Dashboard → Deployments → Dovresti vedere un nuovo deploy in corso.

