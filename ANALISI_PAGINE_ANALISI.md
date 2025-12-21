# ANALISI PAGINE DI ANALISI
## Standardizzazione Layout e Navigazione

---

## 🔍 PROBLEMI PRINCIPALI

1. **Padding/Margin**: Mix di `mb-6` e `space-y-6`, padding card inconsistente (`p-4` vs `p-6`)
2. **Titoli**: Dimensioni diverse (`text-2xl` vs `text-3xl`), posizionamento inconsistente
3. **Grid**: Breakpoint diversi (`sm:` vs `md:`), colonne diverse
4. **Tabs**: Padding inconsistente (`py-2` vs `py-3`), min-width mancante
5. **Link Back**: `hero-analysis` non ha link back
6. **Tabelle**: Padding inconsistente (`py-2` vs `py-4`)
7. **Gap**: Inconsistente (`gap-2` vs `gap-3` per icona+testo)

---

## 🎯 STANDARD DA APPLICARE

### **Layout Base**:
```css
Container: p-4 md:p-6
Spazio Sezioni: space-y-6 (non mb-6)
Card: p-6
Metric Cards: p-4
```

### **Titoli**:
```css
H1: text-2xl md:text-3xl font-bold mb-2
H2: text-xl md:text-2xl font-semibold mb-4
H3: text-lg md:text-xl font-semibold mb-3
```

### **Grid**:
```css
Metriche: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4
Grafici: grid grid-cols-1 md:grid-cols-2 gap-6
```

### **Tabs**:
```css
Button: flex-1 min-w-[150px] px-4 py-3
Content: p-6 space-y-6
```

### **Tabelle**:
```css
Header: px-6 py-4 bg-gray-700
Cell: px-6 py-4
```

### **Gap**:
```css
Metriche: gap-4
Icona+Testo: gap-2
Sezioni: gap-6
```

### **Link Back**:
```css
text-gray-400 hover:text-white text-sm mb-4 inline-block
```
**Aggiungere a**: `hero-analysis`

---

## ✅ CHECKLIST

- [ ] Padding container: `p-4 md:p-6`
- [ ] Spazio sezioni: `space-y-6`
- [ ] Card: `p-6`, Metric cards: `p-4`
- [ ] Titoli: H1 `text-2xl md:text-3xl`, H2 `text-xl md:text-2xl`
- [ ] Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` (metriche)
- [ ] Tabs: `flex-1 min-w-[150px] px-4 py-3`
- [ ] Tabelle: `px-6 py-4` (header e cell)
- [ ] Gap: `gap-4` (metriche), `gap-2` (icona+testo), `gap-6` (sezioni)
- [ ] Link back: Aggiungere a `hero-analysis`

---

## 📝 PAGINE DA MODIFICARE

1. `/dashboard/match-analysis/[id]/page.tsx`
2. `/dashboard/hero-analysis/page.tsx`
3. `/dashboard/advanced/lane-early/page.tsx`
4. `/dashboard/advanced/farm-economy/page.tsx`
5. `/dashboard/advanced/fights-damage/page.tsx`
6. `/dashboard/advanced/vision-control/page.tsx`

