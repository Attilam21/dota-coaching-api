# Problemi Trovati in role-analysis/page.tsx

## 🔴 PROBLEMI CRITICI

### 1. **KDA Calculation - Valori undefined/null** (Linea 236)
```typescript
const kda = player.deaths > 0 ? (player.kills + player.assists) / player.deaths : (player.kills + player.assists)
```
**Problema**: 
- `player.kills` e `player.assists` potrebbero essere `undefined` o `null`
- `player.deaths` potrebbe essere `undefined` o `null`
- Risultato: `NaN` nel calcolo KDA

**Rischio**: Crash o valori errati nel trend chart

### 2. **Match Data - Valori undefined/null** (Linee 240-241)
```typescript
return {
  match_id: match.match_id,
  start_time: match.start_time,
  ...
}
```
**Problema**: 
- `match.match_id` potrebbe essere `undefined` o `null`
- `match.start_time` potrebbe essere `undefined` o `null`
- Risultato: Valori errati nel trend data

**Rischio**: Crash o dati inconsistenti

### 3. **Recommendations Array - Potrebbe essere undefined** (Linea 914)
```typescript
{analysis.recommendations.length > 0 && (
```
**Problema**: 
- `analysis.recommendations` potrebbe essere `undefined` o `null`
- Risultato: Crash su `.length`

**Rischio**: Crash quando l'API non restituisce recommendations

### 4. **Match Radiant Win - Potrebbe essere undefined** (Linea 235)
```typescript
const won = (playerTeam === 'radiant' && match.radiant_win) || (playerTeam === 'dire' && !match.radiant_win)
```
**Problema**: 
- `match.radiant_win` potrebbe essere `undefined` o `null`
- Risultato: Calcolo `won` errato

**Rischio**: Winrate errato nel trend

---

## 🟡 PROBLEMI MEDI

### 5. **Hero ID Validation** (Linee 765, 820, 1053)
**Problema**: Già gestito con check `heroes[hero.hero_id]`, ma potrebbe essere più robusto

### 6. **Array Operations senza validazione**
**Problema**: Alcune operazioni su array potrebbero fallire se l'array è undefined

---

## ✅ SOLUZIONI PROPOSTE

1. **KDA Calculation**: Aggiungere default values `|| 0` per kills, assists, deaths
2. **Match Data**: Aggiungere validazione per match_id e start_time
3. **Recommendations**: Aggiungere check `Array.isArray(analysis.recommendations)`
4. **Radiant Win**: Aggiungere default value `|| false` per radiant_win

