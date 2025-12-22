# Video di Benvenuto

## Come caricare il video

1. **Prepara il video:**
   - Formato: MP4 (H.264 codec)
   - Dimensione consigliata: max 10MB per Git
   - Risoluzione: 1920x1080 o inferiore
   - Durata: consigliata 30-60 secondi

2. **Rinomina il file:**
   - Nome file: `welcome.mp4`
   - Posizione: `public/videos/welcome.mp4`

3. **Carica su Git:**
   ```bash
   git add public/videos/welcome.mp4
   git commit -m "feat: aggiunto video di benvenuto"
   git push
   ```

## Note

- Il video verrà mostrato automaticamente al primo accesso alla pagina di login
- Gli utenti possono chiudere il video e non verrà più mostrato (salvato in localStorage)
- Il video è accessibile all'URL: `/videos/welcome.mp4`

## Alternative per video grandi

Se il video è >10MB, considera:
- Supabase Storage (gratuito, CDN incluso)
- Vercel Blob Storage
- Cloudflare R2

