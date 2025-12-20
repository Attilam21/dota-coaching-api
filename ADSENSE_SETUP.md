# 📢 Google AdSense Setup Guide

## ✅ Implementazione Completata

L'integrazione Google AdSense è stata implementata in modo sicuro e compatibile con:
- ✅ Next.js 14
- ✅ GDPR compliance (Cookie Consent)
- ✅ TypeScript strict mode
- ✅ Non invasivo (non rompe il codice esistente)

## 🚀 Come Configurare AdSense

### Passo 1: Registrazione Google AdSense

1. Vai su [Google AdSense](https://www.google.com/adsense)
2. Crea un account o accedi
3. Aggiungi il tuo sito web
4. Attendi l'approvazione (2-4 settimane)

### Passo 2: Ottieni le Credenziali

Dopo l'approvazione:
1. Vai su **Siti** → **Aggiungi sito**
2. Copia il **Publisher ID** (formato: `ca-pub-XXXXXXXXXX`)
3. Crea **Unità pubblicitarie** per ogni posizione:
   - Banner superiore (Leaderboard)
   - Sidebar (Skyscraper)
   - Footer (Banner)
   - In-content (Rectangle)

### Passo 3: Configura Environment Variables

Aggiungi nel file `.env.local`:

```env
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_TOP=1234567890
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=1234567891
NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM=1234567892
NEXT_PUBLIC_ADSENSE_SLOT_INCONTENT=1234567893
```

**Su Vercel:**
1. Vai su Settings → Environment Variables
2. Aggiungi tutte le variabili sopra
3. Redeploy

### Passo 4: Usa i Componenti

#### Banner Superiore (Home Page)
```tsx
import AdBanner from '@/components/AdBanner'

<AdBanner position="top" />
```

#### Sidebar (Dashboard)
```tsx
<AdBanner position="sidebar" className="sticky top-4" />
```

#### Footer
```tsx
<AdBanner position="bottom" />
```

#### In-Content (Tra i contenuti)
```tsx
<AdBanner position="in-content" />
```

#### Componente Personalizzato
```tsx
import AdSense from '@/components/AdSense'

<AdSense 
  adSlot="1234567890" 
  adFormat="auto"
  className="min-h-[250px]"
/>
```

## 🔒 GDPR Compliance

Il sistema include automaticamente:
- ✅ Cookie Consent Banner (GDPR compliant)
- ✅ Ads caricati solo dopo consenso
- ✅ Privacy Policy link
- ✅ Consenso salvato in localStorage

## ⚠️ Policy Google AdSense

**IMPORTANTE**: Rispetta sempre le policy:
- ❌ Non cliccare sui tuoi annunci
- ❌ Non chiedere ad altri di cliccare
- ❌ Non modificare il codice AdSense
- ✅ Mantieni contenuto di qualità
- ✅ Rispetta il limite di annunci per pagina (max 3 display ads)

## 📊 Best Practices

1. **Posizionamento**:
   - Banner superiore: visibile ma non invasivo
   - Sidebar: sticky solo su desktop
   - In-content: tra contenuti rilevanti

2. **Performance**:
   - Gli ads si caricano solo dopo il consenso
   - Lazy loading automatico
   - Non bloccano il rendering

3. **Mobile**:
   - Responsive automatico
   - Formato "auto" si adatta al dispositivo

## 🧪 Testing

Prima di andare in produzione:
1. Testa con AdSense in modalità test
2. Verifica che il cookie consent funzioni
3. Controlla che gli ads non rompano il layout
4. Testa su mobile e desktop

## 📝 Note

- Gli ads **NON** vengono caricati se:
  - `NEXT_PUBLIC_ADSENSE_CLIENT_ID` non è configurato
  - L'utente non ha dato il consenso
  - Si è in modalità sviluppo (opzionale)

- Il componente è **sicuro**: se AdSense fallisce, non rompe l'app

---

**Ultimo aggiornamento**: Gennaio 2025

