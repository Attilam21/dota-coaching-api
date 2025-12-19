# 🎨 ISTRUZIONI COMPLETE - Sfondo Dashboard

## ✅ CODICE IMPLEMENTATO

Lo sfondo è già implementato nel codice! Funziona così:

**File**: `components/DashboardLayout.tsx` (linee 154-169)
- ✅ Legge l'immagine da `/public/dashboard-bg.jpg`
- ✅ Mostra lo sfondo solo nell'area contenuto (non nella sidebar)
- ✅ Overlay scuro per leggibilità
- ✅ Opacità 20% per non essere invasivo

---

## 📍 DOVE METTERE L'IMMAGINE

### Percorso Esatto:
```
C:\Users\attil\Desktop\dota-2-giusto\dota-coaching-api\dota-coaching-api\public\dashboard-bg.jpg
```

### Struttura Cartelle:
```
dota-coaching-api/
├── public/
│   ├── dashboard-bg.jpg    ← QUI! Salva la tua immagine
│   ├── profile-bg.jpg      (già esistente)
│   └── README.md
├── app/
├── components/
│   └── DashboardLayout.tsx  ← Codice che legge l'immagine
└── ...
```

---

## 🎯 COME CARICARE L'IMMAGINE

### Metodo 1: Drag & Drop (Più Semplice)
1. Apri la cartella `public` nel tuo file explorer
2. Trascina l'immagine nella cartella
3. Rinomina il file in `dashboard-bg.jpg` (se necessario)

### Metodo 2: Copia e Incolla
1. Copia l'immagine dal tuo computer
2. Vai nella cartella `public` del progetto
3. Incolla l'immagine
4. Rinomina in `dashboard-bg.jpg`

### Metodo 3: Salva Direttamente
1. Apri l'immagine con un editor (Paint, Photoshop, ecc.)
2. Salva come `dashboard-bg.jpg`
3. Salva nella cartella `public` del progetto

---

## ✅ REQUISITI IMMAGINE

- **Nome file**: `dashboard-bg.jpg` (ESATTO, case-sensitive)
- **Formato**: JPG, PNG o WebP
- **Dimensione consigliata**: 1920x1080 o superiore
- **Dimensione file**: Consigliato sotto 1MB per performance ottimali

---

## 🔍 VERIFICA CHE FUNZIONI

1. **Controlla che il file esista**:
   - Vai in `public/dashboard-bg.jpg`
   - Il file deve essere presente

2. **Riavvia il server** (se è in esecuzione):
   ```bash
   # Ferma il server (Ctrl+C)
   # Riavvia
   npm run dev
   ```

3. **Ricarica la dashboard**:
   - Vai su `/dashboard`
   - Lo sfondo dovrebbe apparire

---

## 🐛 SE NON VEDI LO SFONDO

### Problema 1: File non trovato
**Sintomi**: Sfondo grigio normale, nessuna immagine
**Soluzione**: 
- Verifica che il file si chiami ESATTAMENTE `dashboard-bg.jpg`
- Verifica che sia nella cartella `public/` (non in `public/images/` o altre sottocartelle)

### Problema 2: Immagine troppo grande
**Sintomi**: Caricamento lento
**Soluzione**: Comprimi l'immagine con [TinyPNG](https://tinypng.com/) o [Squoosh](https://squoosh.app/)

### Problema 3: Formato non supportato
**Sintomi**: Immagine non appare
**Soluzione**: Converti in JPG, PNG o WebP

### Problema 4: Cache del browser
**Sintomi**: Modifiche non visibili
**Soluzione**: 
- Ricarica forzata: `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac)
- Oppure svuota la cache del browser

---

## 📝 LINK DIRETTO AL FILE

**Percorso completo Windows:**
```
C:\Users\attil\Desktop\dota-2-giusto\dota-coaching-api\dota-coaching-api\public\dashboard-bg.jpg
```

**Percorso relativo (dal progetto):**
```
public/dashboard-bg.jpg
```

**URL nel browser (dopo il deploy):**
```
https://tuo-dominio.com/dashboard-bg.jpg
```

---

## 🎨 COME FUNZIONA IL CODICE

Il codice in `components/DashboardLayout.tsx`:

```tsx
<Image
  src="/dashboard-bg.jpg"  // ← Cerca qui: public/dashboard-bg.jpg
  alt="Dashboard Background"
  fill
  className="object-cover opacity-20"  // Opacità 20%
/>
<div className="absolute inset-0 bg-gray-900/60" />  // Overlay scuro 60%
```

- `src="/dashboard-bg.jpg"` → Cerca in `public/dashboard-bg.jpg`
- `opacity-20` → Immagine al 20% di opacità
- `bg-gray-900/60` → Overlay scuro al 60% sopra l'immagine

---

## ✅ CHECKLIST FINALE

- [ ] Ho salvato l'immagine in `public/dashboard-bg.jpg`
- [ ] Il nome del file è ESATTAMENTE `dashboard-bg.jpg`
- [ ] L'immagine è in formato JPG, PNG o WebP
- [ ] Ho riavviato il server (se necessario)
- [ ] Ho ricaricato la pagina dashboard
- [ ] Lo sfondo è visibile!

---

**Tutto pronto! Salva semplicemente l'immagine in `public/dashboard-bg.jpg` e funzionerà!** 🚀

