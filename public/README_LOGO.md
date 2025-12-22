# Logo ATTILA LAB

## Come aggiungere il logo

1. **Salva il tuo logo** come immagine PNG o SVG nella cartella `public/`
2. **Rinomina il file** come `attila-lab-logo.png` (o `.svg` se usi SVG)
3. **Dimensioni consigliate**: 
   - Per la sidebar: minimo 200x200px
   - Per la navbar: minimo 150x150px
   - Formato: PNG con sfondo trasparente (preferito) o JPG

## Formato del logo

Il logo dovrebbe contenere:
- L'emblema esagonale/stilizzato a sinistra
- Il testo "ATTILA LAB" (opzionale, può essere solo l'emblema)

## Fallback

Se il logo non viene trovato, verrà mostrato un placeholder con le iniziali "AL" in stile minimalista.

## Modifiche al componente

Se vuoi modificare il comportamento del logo, modifica il file `components/Logo.tsx`.

### Props disponibili:
- `className`: classi CSS aggiuntive
- `showText`: mostra/nasconde il testo "ATTILA LAB" (default: true)
- `size`: dimensione del logo ('sm' | 'md' | 'lg', default: 'md')
- `href`: link quando si clicca sul logo (opzionale)

