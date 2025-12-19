# 🎨 Sfondo Dashboard - Istruzioni

## 📍 DOVE METTERE L'IMMAGINE

Salva la tua immagine di sfondo qui:

```
public/dashboard-bg.jpg
```

## 📂 Struttura Corretta

```
public/
├── dashboard-bg.jpg    ← SALVA QUI la tua immagine!
├── profile-bg.jpg      (già esistente)
└── README.md
```

## ✅ Requisiti Immagine

- **Nome file**: `dashboard-bg.jpg` (ESATTO, case-sensitive)
- **Formato**: JPG, PNG o WebP
- **Dimensione consigliata**: 1920x1080 o superiore
- **Dimensione file**: Consigliato sotto 1MB per performance

## 🎯 Come Funziona

1. Salva l'immagine come `dashboard-bg.jpg` in questa cartella (`public/`)
2. L'immagine verrà automaticamente utilizzata come sfondo nella dashboard
3. Lo sfondo apparirà solo nell'area contenuto principale (non nella sidebar)
4. Ha un overlay scuro per mantenere la leggibilità del testo

## 🔧 Se l'Immagine Non Appare

1. Verifica che il file si chiami ESATTAMENTE `dashboard-bg.jpg`
2. Verifica che sia nella cartella `public/` (stesso livello di `app/`, `components/`, ecc.)
3. Riavvia il server di sviluppo (`npm run dev`)
4. Ricarica la pagina (F5 o Ctrl+R)

## 📝 Note

- L'immagine viene ottimizzata automaticamente da Next.js
- Lo sfondo è fisso (non scrolla con il contenuto)
- L'opacità è impostata al 20% per non essere invasiva
- C'è un overlay scuro (60%) sopra l'immagine per leggibilità

---

**Percorso completo Windows:**
`C:\Users\attil\Desktop\dota-2-giusto\dota-coaching-api\dota-coaching-api\public\dashboard-bg.jpg`

