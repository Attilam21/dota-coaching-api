# 🔍 Dashboard UX Audit Completo

**Data**: Gennaio 2025  
**Scope**: Tutte le pagine della dashboard (`/dashboard/*`)

---

## 📊 Problemi Identificati

### 1. **Inconsistenze di Spacing e Padding**

#### Problema
- **Dashboard principale** (`/dashboard/page.tsx`): `p-8`
- **Performance** (`/dashboard/performance/page.tsx`): `p-8`
- **Profiling** (`/dashboard/profiling/page.tsx`): `p-8`
- **Coaching** (`/dashboard/coaching/page.tsx`): `p-8`
- **Hero Analysis** (`/dashboard/hero-analysis/page.tsx`): `p-8`
- **Role Analysis** (`/dashboard/role-analysis/page.tsx`): `p-8`
- **Advanced** (`/dashboard/advanced/page.tsx`): `p-8`
- **Builds** (`/dashboard/builds/page.tsx`): `p-8`
- **AI Summary** (`/dashboard/ai-summary/page.tsx`): `p-8`

✅ **Status**: Coerente (tutte usano `p-8`)

#### Problema Interno alle Card
- Alcune card usano `p-6`, altre `p-4`, altre `p-3`
- Inconsistenza tra sezioni della stessa pagina

**Esempi**:
- Dashboard: card con `p-6` e `p-4` misti
- Performance: card con `p-4` e `p-6` misti
- Builds: card con `p-6` e `p-4` misti

**Soluzione Proposta**: Standardizzare a `p-6` per card principali, `p-4` per card secondarie

---

### 2. **Inconsistenze di Heading Sizes**

#### Problema
- **H1 principale**: Alcune pagine usano `text-3xl`, altre `text-2xl`
- **H2 sezioni**: Alcune usano `text-2xl`, altre `text-xl`, altre `text-lg`
- **H3 sottosezioni**: Alcune usano `text-xl`, altre `text-lg`, altre `text-base`

**Esempi**:
- Dashboard: `text-3xl` (H1), `text-2xl` (H2), `text-xl` (H3)
- Performance: `text-3xl` (H1), `text-xl` (H2), `text-lg` (H3)
- Hero Analysis: `text-3xl` (H1), `text-xl` (H2), `text-lg` (H3)
- Role Analysis: `text-3xl` (H1), `text-2xl` (H2), `text-xl` (H3)
- Builds: `text-3xl` (H1), `text-xl` (H2), `text-lg` (H3)

**Soluzione Proposta**:
- H1: `text-3xl font-bold mb-4` (sempre)
- H2: `text-2xl font-semibold mb-4` (sempre)
- H3: `text-xl font-semibold mb-3` (sempre)
- H4: `text-lg font-semibold mb-2` (sempre)

---

### 3. **Inconsistenze di Card Styling**

#### Problema
- Alcune card usano `bg-gray-800`, altre `bg-gray-700`
- Alcune hanno `border border-gray-700`, altre `border-gray-600`
- Alcune hanno `rounded-lg`, altre `rounded`
- Alcune hanno gradient (`bg-gradient-to-r`), altre no

**Esempi**:
- Dashboard: `bg-gray-800 border border-gray-700 rounded-lg`
- Performance: `bg-gray-800 border border-gray-700 rounded-lg`
- Hero Analysis: `bg-gray-800 border border-gray-700 rounded-lg`
- Builds: `bg-gray-800 rounded-lg border border-gray-700` (ordine diverso)

**Soluzione Proposta**:
- Card principale: `bg-gray-800 border border-gray-700 rounded-lg p-6`
- Card secondaria: `bg-gray-700/50 border border-gray-600 rounded-lg p-4`
- Card highlight: `bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6`

---

### 4. **Inconsistenze di Icone e Emoji**

#### Problema
- Alcune pagine usano emoji nei titoli, altre no
- Alcune usano emoji diverse per lo stesso concetto
- Alcune usano emoji nei link sidebar, altre no

**Esempi**:
- Dashboard: nessun emoji nel titolo principale
- Performance: nessun emoji nel titolo principale
- Hero Analysis: nessun emoji nel titolo principale
- AI Summary: `🤖` nel titolo
- Coaching: nessun emoji nel titolo

**Sidebar**:
- Tutte le voci hanno emoji (✅ coerente)

**Soluzione Proposta**:
- Rimuovere emoji dai titoli principali (mantenere solo nella sidebar)
- Standardizzare emoji per concetti simili (es. sempre 🎯 per "Analisi", sempre 📊 per "Statistiche")

---

### 5. **Inconsistenze di Loading States**

#### Problema
- Alcuni loading hanno spinner `h-12 w-12`, altri `h-8 w-8`
- Alcuni hanno messaggio "Caricamento...", altri "Loading..."
- Alcuni hanno `py-12`, altri `py-8`

**Esempi**:
- Dashboard: `h-12 w-12`, "Caricamento statistiche..."
- Performance: `h-12 w-12`, "Caricamento performance..."
- Hero Analysis: `h-12 w-12`, "Caricamento analisi heroes..."
- Builds: `h-8 w-8`, "Caricamento dati build..."

**Soluzione Proposta**:
- Spinner: `h-12 w-12 border-b-2 border-red-600` (sempre)
- Container: `text-center py-12`
- Messaggio: `mt-4 text-gray-400` con testo specifico per pagina

---

### 6. **Inconsistenze di Error States**

#### Problema
- Tutte le pagine usano lo stesso stile per errori (✅ coerente)
- Ma alcune hanno `mb-6`, altre `mb-4`

**Esempi**:
- Dashboard: `mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg`
- Performance: `mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg`
- Hero Analysis: `mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg`

**Soluzione Proposta**: Standardizzare a `mb-6` (sempre)

---

### 7. **Inconsistenze di Responsive Grid Layouts**

#### Problema
- Alcune grid usano `md:grid-cols-2`, altre `md:grid-cols-3`, altre `md:grid-cols-4`
- Alcune usano `lg:grid-cols-4`, altre `lg:grid-cols-5`, altre `lg:grid-cols-6`
- Alcune non hanno breakpoint `sm:`

**Esempi**:
- Dashboard: `md:grid-cols-2 lg:grid-cols-4` (4 card)
- Performance: `grid-cols-2 md:grid-cols-4` (4 card)
- Hero Analysis: `md:grid-cols-4` (4 card)
- Role Analysis: `md:grid-cols-3` (3 card)
- Builds: `grid-cols-1 md:grid-cols-3` (3 card)

**Soluzione Proposta**:
- 2 card: `grid-cols-1 md:grid-cols-2`
- 3 card: `grid-cols-1 md:grid-cols-3`
- 4 card: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`
- 5+ card: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5`

---

### 8. **Inconsistenze di Grafici e Chart Heights**

#### Problema
- Alcuni grafici hanno `height={300}`, altri `height={250}`, altri `height={280}`
- Alcuni hanno `ResponsiveContainer`, altri no (tutti lo hanno ✅)

**Esempi**:
- Dashboard: `height={300}` (LineChart)
- Performance: `height={250}` (LineChart), `height={280}` (RadarChart)
- Hero Analysis: `height={300}` (BarChart)
- Role Analysis: `height={300}` (BarChart, PieChart)

**Soluzione Proposta**:
- Chart principale: `height={300}` (sempre)
- Chart secondario: `height={250}` (sempre)
- Chart compatto: `height={200}` (sempre)

---

### 9. **Inconsistenze di Colori**

#### Problema
- Alcune usano `text-red-400`, altre `text-red-600`
- Alcune usano `bg-red-600`, altre `bg-red-700`
- Alcune usano gradient, altre no

**Esempi**:
- Dashboard: `text-red-400`, `bg-red-600`
- Performance: `text-red-400`, `bg-red-600`
- Hero Analysis: `text-red-400`, `bg-red-600`
- Role Analysis: `text-red-400`, `bg-red-600`

**Soluzione Proposta**:
- Testo primario: `text-red-400` (sempre)
- Background primario: `bg-red-600` (sempre)
- Hover: `hover:bg-red-700` (sempre)
- Testo secondario: `text-gray-400` (sempre)

---

### 10. **Inconsistenze di Tipografia**

#### Problema
- Alcune usano `font-bold`, altre `font-semibold`
- Alcune usano `text-sm`, altre `text-xs`
- Alcune usano `uppercase tracking-wider`, altre no

**Esempi**:
- Dashboard: `font-bold` per titoli, `font-semibold` per sottotitoli
- Performance: `font-semibold` per titoli, `font-bold` per valori
- Hero Analysis: `font-semibold` per titoli, `font-bold` per valori

**Soluzione Proposta**:
- Titoli: `font-bold` (H1, H2)
- Sottotitoli: `font-semibold` (H3, H4)
- Label: `text-sm text-gray-400 uppercase tracking-wider` (sempre)
- Valori: `font-bold` (sempre)

---

### 11. **Problemi di Empty States**

#### Problema
- Alcune pagine hanno empty states, altre no
- Alcune hanno messaggi diversi per lo stesso caso

**Esempi**:
- Dashboard: nessun empty state (ha sempre dati)
- Performance: nessun empty state
- Hero Analysis: "Nessun hero con winrate >= 55%"
- Role Analysis: "Nessun dato disponibile"
- Builds: "Nessuna partita trovata"

**Soluzione Proposta**:
- Empty state standard: `text-center py-12` con icona, titolo, descrizione
- Messaggio: `text-gray-400` con testo specifico

---

### 12. **Problemi di Button Styling**

#### Problema
- Alcuni button usano `px-6 py-3`, altri `px-4 py-2`
- Alcuni hanno `rounded-lg`, altri `rounded`
- Alcuni hanno `font-semibold`, altri `font-bold`

**Esempi**:
- Dashboard: `px-4 py-2 rounded-lg font-semibold`
- Performance: nessun button principale
- Hero Analysis: nessun button principale
- AI Summary: `px-6 py-3 rounded-lg font-semibold`

**Soluzione Proposta**:
- Button primario: `px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors`
- Button secondario: `px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors`

---

## 🎯 Priorità di Intervento

### 🔴 Alta Priorità
1. **Standardizzare heading sizes** (H1, H2, H3, H4)
2. **Standardizzare card styling** (bg, border, padding)
3. **Standardizzare responsive grids** (breakpoints consistenti)
4. **Standardizzare chart heights** (300, 250, 200)

### 🟡 Media Priorità
5. **Standardizzare spacing interno alle card** (p-6, p-4)
6. **Standardizzare colori** (red-400, red-600, red-700)
7. **Standardizzare tipografia** (font-bold, font-semibold)
8. **Standardizzare button styling** (px-6 py-3, rounded-lg)

### 🟢 Bassa Priorità
9. **Standardizzare emoji usage** (rimuovere dai titoli)
10. **Standardizzare empty states** (componente riutilizzabile)
11. **Standardizzare loading states** (componente riutilizzabile)

---

## 📝 Note Implementazione

### Componenti da Creare
1. **`LoadingSpinner`**: Componente riutilizzabile per loading states
2. **`ErrorBanner`**: Componente riutilizzabile per error states
3. **`EmptyState`**: Componente riutilizzabile per empty states
4. **`Card`**: Componente riutilizzabile per card standardizzate
5. **`PageHeader`**: Componente riutilizzabile per header di pagina

### Utility Classes da Definire
1. **Spacing**: `p-page`, `p-card`, `p-card-sm`
2. **Typography**: `heading-1`, `heading-2`, `heading-3`, `heading-4`
3. **Colors**: `text-primary`, `bg-primary`, `border-primary`
4. **Grids**: `grid-2`, `grid-3`, `grid-4`, `grid-5`

---

## ✅ Checklist Implementazione

- [ ] Standardizzare heading sizes in tutte le pagine
- [ ] Standardizzare card styling in tutte le pagine
- [ ] Standardizzare responsive grids in tutte le pagine
- [ ] Standardizzare chart heights in tutte le pagine
- [ ] Standardizzare spacing interno alle card
- [ ] Standardizzare colori in tutte le pagine
- [ ] Standardizzare tipografia in tutte le pagine
- [ ] Standardizzare button styling in tutte le pagine
- [ ] Rimuovere emoji dai titoli principali
- [ ] Creare componenti riutilizzabili (LoadingSpinner, ErrorBanner, EmptyState, Card, PageHeader)
- [ ] Testare responsive design su mobile, tablet, desktop
- [ ] Verificare accessibilità (contrasti, focus states, aria labels)

---

**Ultimo aggiornamento**: Gennaio 2025

