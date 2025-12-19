# 📢 Guida Completa: Google AdSense per PRO DOTA ANALISI

Questo documento descrive come predisporre annunci pubblicitari e pop-up sul sito utilizzando Google AdSense.

---

## 🎯 Panoramica

**Google AdSense** è la piattaforma di Google che permette di monetizzare il sito web mostrando annunci pertinenti ai visitatori. I guadagni vengono generati quando gli utenti cliccano sugli annunci o li visualizzano.

---

## ✅ Requisiti per l'Approvazione AdSense

### 1. **Requisiti del Sito Web**
- ✅ **Contenuti originali e di qualità**: Il sito deve avere contenuti unici, non copiati
- ✅ **Pagine sufficienti**: Almeno 10-15 pagine con contenuti sostanziali
- ✅ **Navigazione chiara**: Menu e struttura del sito ben organizzati
- ✅ **Privacy Policy**: Obbligatoria per siti che raccolgono dati
- ✅ **Termini di Servizio**: Consigliati
- ✅ **Contatti**: Pagina con informazioni di contatto
- ✅ **Traffico minimo**: Non c'è un numero ufficiale, ma Google preferisce siti con traffico organico

### 2. **Requisiti Tecnici**
- ✅ **Dominio verificato**: Il sito deve essere accessibile pubblicamente
- ✅ **HTTPS**: Obbligatorio (già presente su Vercel)
- ✅ **Mobile-friendly**: Il sito deve essere responsive (già implementato)
- ✅ **Tempo di caricamento**: Pagine che si caricano rapidamente

### 3. **Requisiti di Contenuto**
- ✅ **Contenuti in italiano o inglese**: Preferiti da Google
- ✅ **Niente contenuti vietati**: Niente pornografia, violenza, hate speech, etc.
- ✅ **Niente contenuti copiati**: Tutto deve essere originale
- ✅ **Aggiornamenti regolari**: Contenuti freschi e aggiornati

---

## 🚫 Policy sui Pop-up e Interstitial Ads

### **Cosa è VIETATO da AdSense:**
- ❌ **Popup che bloccano il contenuto**: Pop-up che coprono completamente la pagina all'arrivo
- ❌ **Pop-under**: Finestre che si aprono dietro la finestra principale
- ❌ **Popup automatici**: Pop-up che si aprono automaticamente senza interazione utente
- ❌ **Popup che interferiscono con la navigazione**: Pop-up che impediscono di usare il sito

### **Cosa è PERMESSO:**
- ✅ **Popup con interazione utente**: Pop-up che si aprono dopo un click o scroll
- ✅ **Banner in alto**: Banner pubblicitari nella parte superiore della pagina
- ✅ **Sidebar ads**: Annunci nella barra laterale
- ✅ **In-content ads**: Annunci all'interno del contenuto (dopo alcuni paragrafi)
- ✅ **Sticky ads**: Annunci che rimangono visibili durante lo scroll (ma non devono coprire il contenuto)

### **Best Practice per Pop-up:**
1. **Delay**: Mostra pop-up dopo almeno 30-60 secondi di permanenza
2. **Exit intent**: Pop-up quando l'utente sta per uscire (mouse verso l'alto)
3. **Scroll trigger**: Pop-up dopo che l'utente ha scrollato almeno il 50% della pagina
4. **Facilmente chiudibili**: Sempre un pulsante "X" chiaro e visibile
5. **Non invasivi**: Non coprire più del 30-40% dello schermo

---

## 📋 Passaggi per Implementare AdSense

### **Fase 1: Creazione Account AdSense**

1. **Registrazione**
   - Vai su [Google AdSense](https://www.google.com/adsense/)
   - Clicca su "Inizia ora"
   - Accedi con il tuo account Google

2. **Aggiunta del Sito**
   - Inserisci l'URL del sito: `https://pro-dota-analisi.vercel.app` (o il tuo dominio)
   - Seleziona la lingua principale: Italiano
   - Seleziona il paese: Italia

3. **Verifica del Sito**
   - Google ti fornirà un codice da inserire nel `<head>` del sito
   - Questo codice verifica che tu sia il proprietario del sito

### **Fase 2: Implementazione Tecnica in Next.js**

#### **Step 1: Aggiungere lo Script AdSense al Layout**

Crea/modifica `app/layout.tsx`:

```typescript
import Script from 'next/script'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <head>
        {/* Google AdSense Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

**Nota**: Sostituisci `ca-pub-XXXXXXXXXX` con il tuo Publisher ID che riceverai dopo l'approvazione.

#### **Step 2: Creare Componente per Annunci**

Crea `components/AdSense.tsx`:

```typescript
'use client'

import { useEffect } from 'react'

interface AdSenseProps {
  adSlot: string
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal'
  style?: React.CSSProperties
  className?: string
}

export default function AdSense({ 
  adSlot, 
  adFormat = 'auto',
  style,
  className 
}: AdSenseProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [])

  return (
    <ins
      className={`adsbygoogle ${className || ''}`}
      style={{
        display: 'block',
        ...style
      }}
      data-ad-client="ca-pub-XXXXXXXXXX" // Sostituisci con il tuo Publisher ID
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  )
}
```

#### **Step 3: Usare il Componente nelle Pagine**

Esempio in `app/dashboard/page.tsx`:

```typescript
import AdSense from '@/components/AdSense'

export default function DashboardPage() {
  return (
    <div>
      {/* Contenuto esistente */}
      
      {/* Annuncio banner in alto */}
      <div className="mb-6">
        <AdSense 
          adSlot="1234567890" 
          adFormat="horizontal"
          className="w-full"
        />
      </div>
      
      {/* Contenuto */}
    </div>
  )
}
```

#### **Step 4: Auto Ads (Annunci Automatici)**

Per gli annunci automatici, aggiungi solo lo script nel layout. Google posizionerà automaticamente gli annunci nelle posizioni ottimali.

---

## 🎨 Posizionamenti Consigliati per PRO DOTA ANALISI

### **1. Banner Superiore (Leaderboard)**
- **Posizione**: Sotto la navbar, sopra il contenuto principale
- **Formato**: 728x90 (Desktop) o 320x50 (Mobile)
- **Pagine**: Dashboard principale, Profiling, Performance

### **2. Sidebar (Desktop)**
- **Posizione**: Nella sidebar del dashboard (se presente)
- **Formato**: 300x250 (Medium Rectangle)
- **Pagine**: Tutte le pagine del dashboard

### **3. In-Content (Tra i Contenuti)**
- **Posizione**: Dopo 2-3 paragrafi di contenuto
- **Formato**: 300x250 o 336x280
- **Pagine**: Pagine con contenuti lunghi (Profiling, Coaching)

### **4. Sticky Sidebar (Desktop)**
- **Posizione**: Barra laterale che rimane visibile durante lo scroll
- **Formato**: 300x600 (Skyscraper)
- **Pagine**: Dashboard, Profiling

### **5. Footer**
- **Posizione**: Prima del footer
- **Formato**: 728x90 o responsive
- **Pagine**: Tutte le pagine

---

## 🔔 Implementazione Pop-up (Conforme alle Policy)

### **Componente Pop-up Consenso Cookie**

Crea `components/CookieConsent.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Mostra pop-up solo se l'utente non ha già accettato
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Delay di 3 secondi prima di mostrare
      const timer = setTimeout(() => {
        setShow(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShow(false)
    // Qui puoi inizializzare AdSense se necessario
  }

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl">
      <button
        onClick={() => setShow(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>
      
      <h3 className="text-lg font-semibold mb-2">Cookie e Privacy</h3>
      <p className="text-sm text-gray-300 mb-4">
        Utilizziamo cookie per migliorare la tua esperienza e mostrare annunci pertinenti. 
        Continuando a navigare, accetti l'utilizzo dei cookie.
      </p>
      
      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
        >
          Accetta
        </button>
        <button
          onClick={handleDecline}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition"
        >
          Rifiuta
        </button>
      </div>
    </div>
  )
}
```

### **Pop-up Exit Intent (Quando l'utente sta per uscire)**

Crea `components/ExitIntentPopup.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function ExitIntentPopup() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Se il mouse esce dalla parte superiore della finestra
      if (e.clientY <= 0) {
        const hasSeen = sessionStorage.getItem('exit-intent-shown')
        if (!hasSeen) {
          setShow(true)
          sessionStorage.setItem('exit-intent-shown', 'true')
        }
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-semibold mb-2">Non andare via!</h3>
        <p className="text-gray-300 mb-4">
          Hai ancora molto da scoprire su PRO DOTA ANALISI. 
          Continua a esplorare le tue statistiche e migliora le tue performance!
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShow(false)}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
          >
            Continua a Esplorare
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 Monitoraggio e Ottimizzazione

### **Metriche da Monitorare in AdSense:**
- **RPM (Revenue per Mille)**: Guadagno per 1000 visualizzazioni
- **CTR (Click-Through Rate)**: Percentuale di click sugli annunci
- **CPC (Cost per Click)**: Guadagno medio per click
- **Impressions**: Numero di volte che gli annunci sono stati mostrati

### **Ottimizzazioni Consigliate:**
1. **Testare diverse posizioni**: Sposta gli annunci per trovare le posizioni migliori
2. **A/B Testing**: Prova formati diversi (banner vs. rectangle)
3. **Mobile vs. Desktop**: Monitora separatamente le performance
4. **Contenuti di qualità**: Più traffico = più guadagni potenziali

---

## ⚠️ Cose da Evitare

1. ❌ **Click fraud**: Non cliccare mai sui tuoi annunci
2. ❌ **Posizionamento ingannevole**: Non posizionare annunci vicino a pulsanti importanti
3. ❌ **Contenuti vietati**: Niente contenuti che violano le policy
4. ❌ **Troppi annunci**: Non saturare la pagina con annunci
5. ❌ **Popup invasivi**: Rispetta sempre l'esperienza utente

---

## 🔐 Privacy e GDPR

### **Requisiti GDPR per AdSense:**
1. **Cookie Banner**: Obbligatorio per utenti EU
2. **Privacy Policy**: Deve menzionare l'uso di AdSense
3. **Consenso esplicito**: L'utente deve accettare prima di caricare gli annunci
4. **Opt-out**: Possibilità di rifiutare i cookie

### **Esempio Privacy Policy Section:**

```markdown
## Pubblicità

Utilizziamo Google AdSense per mostrare annunci pubblicitari sul nostro sito. 
Google AdSense utilizza cookie per personalizzare gli annunci in base ai tuoi interessi.

Puoi disattivare la personalizzazione degli annunci nelle [Impostazioni Annunci Google](https://www.google.com/settings/ads).
```

---

## 📝 Checklist Pre-Implementazione

- [ ] Sito ha almeno 10-15 pagine con contenuti originali
- [ ] Privacy Policy implementata e accessibile
- [ ] Termini di Servizio (opzionale ma consigliato)
- [ ] Pagina Contatti presente
- [ ] Sito è mobile-friendly
- [ ] HTTPS attivo (già presente su Vercel)
- [ ] Tempo di caricamento ottimizzato
- [ ] Contenuti originali e di qualità
- [ ] Account Google creato
- [ ] Account AdSense registrato
- [ ] Sito verificato in AdSense
- [ ] Codice AdSense implementato
- [ ] Cookie consent implementato (per EU)
- [ ] Test degli annunci su diverse pagine
- [ ] Monitoraggio attivo delle performance

---

## 🚀 Prossimi Passi

1. **Completa il sito**: Assicurati di avere abbastanza contenuti
2. **Registrati su AdSense**: Crea l'account e verifica il sito
3. **Attendi l'approvazione**: 2-4 settimane (a volte meno)
4. **Implementa il codice**: Una volta approvato, aggiungi il codice
5. **Monitora e ottimizza**: Usa i dati per migliorare le performance

---

## 📚 Risorse Utili

- [Google AdSense Official](https://www.google.com/adsense/)
- [AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Policies](https://support.google.com/adsense/answer/48182)
- [Best Practices](https://support.google.com/adsense/topic/1319754)

---

**Ultimo aggiornamento**: Gennaio 2025

