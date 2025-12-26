# Design System - Standard Card Styles

## Standard Card Styles

### Card Principali (Primary Cards)
- **Background**: `bg-gray-800` (opaco, no trasparenza)
- **Border**: `border border-gray-700`
- **Padding**: `p-4` (standard) o `p-6` (per card con molto contenuto)
- **Border Radius**: `rounded-lg` (standard)
- **Hover**: `hover:bg-gray-700/50` (solo se cliccabile)

### Card Secondarie (Nested Cards / Sub-cards)
- **Background**: `bg-gray-800/50` (50% trasparenza) - solo per card dentro altre card
- **Border**: `border border-gray-700`
- **Padding**: `p-3` o `p-4`
- **Border Radius**: `rounded-lg`

### Card Interattive (Clickable Cards)
- **Background**: `bg-gray-800`
- **Border**: `border border-gray-700`
- **Hover**: `hover:bg-gray-700/50 transition-colors`
- **Padding**: `p-4`

### Card con Background Immagine (Dashboard Layout)
- **Background**: `bg-gray-800/90 backdrop-blur-sm` (solo se c'è background image)
- **Border**: `border border-gray-700`
- **Padding**: `p-4`

## Regole da Applicare

1. **Rimuovere tutte le trasparenze inconsistenti** (`bg-gray-800/50`, `bg-gray-800/90`) tranne:
   - Card secondarie dentro altre card: `bg-gray-800/50`
   - Card con background image: `bg-gray-800/90 backdrop-blur-sm`

2. **Standardizzare padding**:
   - Card standard: `p-4`
   - Card con molto contenuto: `p-6`
   - Card compatte: `p-3`

3. **Standardizzare border radius**: sempre `rounded-lg` (tranne casi speciali come `rounded-xl` per card hero pool)

4. **Standardizzare hover states**: `hover:bg-gray-700/50 transition-colors`

