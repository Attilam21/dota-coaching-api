# 🎯 Team & Compagni - Proposta Funzionalità Innovative

## 📊 Cosa Offre OpenDota

### Endpoint Disponibili:
1. **`/players/{id}/peers`** - Lista compagni con:
   - `account_id`, `games`, `win`, `with_games`, `with_win`, `against_games`, `against_win`
   - `personaname`, `last_played` (timestamp)

2. **Match Data** - Per ogni match possiamo ottenere:
   - Team composition (5 heroes)
   - Player performance (KDA, GPM, XPM, role)
   - Teamfight participation
   - Warding patterns
   - Item builds

3. **Player Matches** - `/players/{id}/matches` con filtri:
   - `with_account_id` - Match con specifico compagno
   - `hero_id` - Match con specifico hero

---

## 🚀 Funzionalità Innovative da Implementare

### 1. **Synergy Matrix** ⭐⭐⭐ (ALTA PRIORITÀ)
**Cosa fa**: Matrice interattiva che mostra winrate per ogni combinazione di 2-3 compagni

**Differenziazione**: 
- Visualizzazione unica (heatmap)
- Identifica "triple threat" (3 giocatori con sinergia >70%)
- Mostra pattern nascosti

**Implementazione**:
- Fetch matches con filtri `with_account_id` per ogni coppia
- Calcola winrate per ogni combinazione
- Visualizza con heatmap colorata

**API da creare**: `/api/player/[id]/team/synergy-matrix`

---

### 2. **Optimal Team Builder** ⭐⭐⭐ (ALTA PRIORITÀ)
**Cosa fa**: Suggerisce la migliore composizione team di 5 giocatori basata su:
- Winrate storica insieme
- Role compatibility
- Hero pool overlap
- Performance prediction

**Differenziazione**:
- AI-driven team composition
- Considera meta attuale
- Suggerisce heroes da giocare insieme

**Implementazione**:
- Analizza tutte le combinazioni possibili
- Calcola "team score" basato su:
  - Winrate medio insieme
  - Role diversity (non tutti carry)
  - Hero synergy (basato su meta)
- Ranka e suggerisce top 3 composizioni

**API da creare**: `/api/player/[id]/team/optimal-builder`

---

### 3. **Role Compatibility Analysis** ⭐⭐ (MEDIA PRIORITÀ)
**Cosa fa**: Analizza come i ruoli dei compagni si complementano

**Metriche**:
- **Farm Distribution**: Chi prende farm quando giocano insieme
- **Teamfight Coordination**: Partecipazione teamfight sincronizzata
- **Vision Coverage**: Warding complementare
- **Timing Synergy**: Quando sono più forti insieme (early/mid/late)

**Differenziazione**:
- Analisi profonda di come i ruoli interagiscono
- Identifica "role conflicts" (es. 2 carry che competono per farm)

**API da creare**: `/api/player/[id]/team/role-compatibility`

---

### 4. **Time-based Synergy Trends** ⭐⭐ (MEDIA PRIORITÀ)
**Cosa fa**: Mostra come cambia la sinergia nel tempo

**Visualizzazione**:
- Grafico timeline con winrate insieme per mese/settimana
- Identifica trend (migliora/peggiora)
- Eventi significativi (es. "Sinergia migliorata dopo 10 partite insieme")

**Differenziazione**:
- Mostra evoluzione della sinergia
- Identifica "sweet spot" (quando giocano meglio insieme)

**API da creare**: `/api/player/[id]/team/synergy-trends`

---

### 5. **Hero Pool Overlap Analysis** ⭐ (BASSA PRIORITÀ)
**Cosa fa**: Analizza quali heroes giocano insieme più spesso e con più successo

**Metriche**:
- Heroes più giocati insieme
- Winrate per combinazione hero-hero
- "Power duos" (2 heroes con winrate >65% insieme)

**Differenziazione**:
- Identifica strategie di draft ottimali
- Suggerisce heroes da giocare insieme

**API da creare**: `/api/player/[id]/team/hero-overlap`

---

### 6. **Performance Prediction** ⭐⭐⭐ (ALTA PRIORITÀ)
**Cosa fa**: Predice winrate basata su composizione team proposta

**Input**:
- Lista di 5 account_id (o heroes se non specificati)
- Role di ogni giocatore

**Output**:
- Winrate predetto
- Strengths/Weaknesses della composizione
- Suggerimenti per migliorare

**Differenziazione**:
- Machine learning (se possibile) o regressione statistica
- Considera meta attuale
- Fattori esterni (rank, recent form)

**API da creare**: `/api/player/[id]/team/predict-performance`

---

### 7. **Communication Score** ⭐⭐ (MEDIA PRIORITÀ)
**Cosa fa**: Calcola score di "comunicazione" basato su pattern di gioco

**Metriche**:
- **Ward Coordination**: Wards piazzate in modo complementare
- **Teamfight Sync**: Partecipazione sincronizzata ai teamfight
- **Objective Control**: Controllo Roshan/Tower insieme
- **Timing Awareness**: Item timing coordinati

**Differenziazione**:
- Score unico che misura "team chemistry"
- Non solo winrate, ma come giocano insieme

**API da creare**: `/api/player/[id]/team/communication-score`

---

### 8. **Matchup Analysis** ⭐⭐ (MEDIA PRIORITÀ)
**Cosa fa**: Analizza come performa il team contro specifici heroes nemici

**Metriche**:
- Winrate vs specifici heroes
- Heroes nemici che causano più problemi
- Conters ottimali per il team

**Differenziazione**:
- Analisi matchup-specifica
- Suggerimenti draft basati su performance storica

**API da creare**: `/api/player/[id]/team/matchups`

---

### 9. **Team Chemistry Score** ⭐⭐⭐ (ALTA PRIORITÀ)
**Cosa fa**: Score complessivo (0-100) che misura la "chimica" del team

**Componenti**:
- Winrate insieme (40%)
- Communication score (20%)
- Role compatibility (20%)
- Time played together (10%)
- Recent form (10%)

**Differenziazione**:
- Score unico e facile da capire
- Visualizzazione accattivante (gauge chart)

**API da creare**: `/api/player/[id]/team/chemistry-score`

---

### 10. **Dynamic Team Recommendations** ⭐⭐⭐ (ALTA PRIORITÀ)
**Cosa fa**: Suggerimenti in tempo reale per migliorare il team

**Esempi**:
- "Gioca più spesso con [Player X] - winrate 72% insieme"
- "Evita [Player Y] quando giochi carry - compete per farm"
- "Prova [Hero A] + [Hero B] insieme - winrate 68%"

**Differenziazione**:
- Suggerimenti actionable e specifici
- Basati su dati reali, non generici

**API da creare**: `/api/player/[id]/team/recommendations`

---

## 🎨 UI/UX Proposte

### Pagina Principale Team & Compagni
**Tab 1: Overview**
- Team Chemistry Score (gauge grande)
- Top 3 Synergies (cards con foto)
- Quick Stats (totale compagni, winrate medio)

**Tab 2: Synergy Matrix**
- Heatmap interattiva
- Filtri per numero partite minime
- Tooltip con dettagli

**Tab 3: Optimal Teams**
- Top 5 composizioni suggerite
- Winrate predetto
- Heroes consigliati

**Tab 4: Recommendations**
- Lista di suggerimenti actionable
- Priorità (alta/media/bassa)
- Badge "New" per suggerimenti recenti

---

## 📈 Priorità Implementazione

### Fase 1 (MVP - 2 settimane):
1. ✅ Synergy Matrix (base)
2. ✅ Team Chemistry Score
3. ✅ Dynamic Recommendations

### Fase 2 (Enhancement - 2 settimane):
4. Optimal Team Builder
5. Performance Prediction
6. Role Compatibility

### Fase 3 (Advanced - 2 settimane):
7. Time-based Trends
8. Communication Score
9. Matchup Analysis
10. Hero Pool Overlap

---

## 🔥 Cosa ci Differenzia dalla Concorrenza

1. **Synergy Matrix** - Nessuno la ha (unica visualizzazione)
2. **Team Chemistry Score** - Score unico e facile da capire
3. **Optimal Team Builder** - AI-driven, non solo statistiche
4. **Actionable Recommendations** - Non solo dati, ma suggerimenti
5. **Role Compatibility** - Analisi profonda, non solo winrate
6. **Performance Prediction** - Predizione basata su ML/stats

---

## 💡 Note Tecniche

### Limitazioni OpenDota:
- `/peers` endpoint limitato (max 100 compagni)
- Non ha endpoint diretto per "matches with specific teammates"
- Dobbiamo fetchare matches e filtrare lato backend

### Soluzione:
1. Fetch `/players/{id}/matches?limit=100`
2. Per ogni match, estrai teammates
3. Calcola statistiche aggregate
4. Cache risultati (30 minuti)

### Performance:
- Calcoli pesanti → background jobs o caching aggressivo
- Limitare a top 20 compagni per calcoli complessi
- Lazy loading per dettagli

