# 🔍 Ricerca Modelli ML Open Source per Dota 2

**Data ricerca**: Gennaio 2025

---

## ❌ RISULTATO PRINCIPALE

**Non esistono modelli ML pre-addestrati open source specifici per Dota 2 disponibili pubblicamente.**

---

## 📊 COSA HO TROVATO

### 1. **OpenAI Five** (NON Open Source)
- **Cosa è**: AI di OpenAI che ha battuto campioni mondiali di Dota 2
- **Stato**: ❌ **NON rilasciato open source**
- **Codice**: Non disponibile pubblicamente
- **Paper**: Disponibile, ma non il modello/codice
- **Link**: https://openai.com/research/openai-five

### 2. **Framework ML Generici** (Disponibili)
Questi sono framework generici, NON modelli pre-addestrati per Dota 2:

#### **TensorFlow** (Google)
- Libreria ML generica
- Serve per creare modelli custom
- Non ha modelli Dota 2 pre-addestrati

#### **PyTorch** (Meta)
- Framework deep learning
- Serve per creare modelli custom
- Non ha modelli Dota 2 pre-addestrati

#### **Scikit-learn**
- Libreria ML Python
- Algoritmi classici (regressione, classificazione)
- Serve per creare modelli custom
- Non ha modelli Dota 2 pre-addestrati

#### **Fast.ai**
- Libreria educativa per deep learning
- Serve per imparare/creare modelli
- Non ha modelli Dota 2 pre-addestrati

---

## 🎯 COSA ESISTE NEL MERCATO

### **Servizi Commerciali** (NON Open Source)

#### **1. Dotabuff Plus**
- **Cosa fa**: Analisi avanzate, win probability, item suggestions
- **Modello**: Proprietario (non open source)
- **API**: Limitata (solo per utenti premium)
- **Costo**: ~$5/mese

#### **2. OpenDota**
- **Cosa fa**: Statistiche, analisi match
- **Modello**: Nessun ML (solo calcoli statistici)
- **API**: Gratuita, ma no predizioni ML
- **Costo**: Gratuito

#### **3. Stratz**
- **Cosa fa**: Analisi avanzate, grafici
- **Modello**: Proprietario (non open source)
- **API**: Limitata
- **Costo**: Freemium

---

## 💡 COSA POSSIAMO FARE

### **Opzione 1: Creare Modello Custom** (Raccomandato)

#### **Approccio A: Modello Semplice (Regressione/Classificazione)**
```
Dati Input:
- GPM, XPM, KDA, Winrate storico
- Ruolo giocatore
- Eroi giocati
- Matchup (se disponibili)

Output:
- Probabilità vittoria
- Suggerimenti item
- Priorità miglioramento

Tecnologia:
- Scikit-learn (Random Forest, XGBoost)
- Dataset: OpenDota API (gratuito)
- Training: Su dati pubblici match
```

**Vantaggi:**
- ✅ Controllo totale
- ✅ Personalizzabile
- ✅ Gratuito (solo compute)
- ✅ Interpretabile

**Svantaggi:**
- ❌ Richiede dataset grande
- ❌ Richiede competenze ML
- ❌ Training time (settimane)

#### **Approccio B: Fine-tuning LLM**
```
Base Model:
- GPT-3.5/4 (OpenAI)
- Gemini (Google)
- Llama 2/3 (Meta, open source)

Fine-tuning su:
- Dataset partite Dota 2
- Analisi match esistenti
- Guide coaching

Output:
- Suggerimenti testuali
- Analisi partite
- Coaching personalizzato
```

**Vantaggi:**
- ✅ Migliore per testo/coaching
- ✅ Più flessibile
- ✅ Meno dati necessari

**Svantaggi:**
- ❌ Costoso (API calls)
- ❌ Meno preciso per predizioni numeriche
- ❌ Dipendenza da provider

---

### **Opzione 2: Usare API Esistenti** (Pragmatica)

#### **A. OpenDota API** (Gratuita)
```
Cosa fornisce:
- Statistiche match
- Dati giocatori
- Storico partite
- Winrate eroi

Cosa NON fornisce:
- Predizioni ML
- Suggerimenti AI
- Analisi avanzate
```

**Uso**: Raccolta dati per nostro modello custom

#### **B. Servizi Commerciali** (A pagamento)
```
Dotabuff API:
- Win probability
- Item suggestions
- Meta analysis

Costo: ~$50-100/mese
Limitazioni: Rate limits, non personalizzabile
```

---

## 🚀 RACCOMANDAZIONE PER IL PROGETTO

### **Fase 1: Approccio Ibrido** (Immediato)

```
1. Calcoli Statistici (Codice)
   - Winrate, GPM, KDA trends
   - Benchmark hardcoded
   - Priorità calcolate

2. LLM per Formattazione (Gemini/OpenAI)
   - Riceve dati già calcolati
   - Formatta in testo chiaro
   - Aggiunge contesto

3. Nessun ML Custom (per ora)
   - Troppo complesso
   - Richiede dataset grande
   - Non necessario per MVP
```

**Vantaggi:**
- ✅ Implementazione rapida
- ✅ Funziona subito
- ✅ Costi bassi
- ✅ Facile da migliorare

---

### **Fase 2: Modello Custom Semplice** (Futuro)

```
Dataset:
- 10,000+ match da OpenDota
- Features: GPM, XPM, KDA, Ruolo, Eroi
- Target: Winrate, Item efficacia

Modello:
- XGBoost (scikit-learn)
- Training: 1-2 settimane
- Deploy: API endpoint

Output:
- Win probability
- Item recommendations
- Role-specific suggestions
```

**Quando implementare:**
- ✅ Dopo MVP funzionante
- ✅ Con dataset sufficiente
- ✅ Con utenti che generano dati

---

## 📚 RISORSE UTILI

### **Dataset**
- **OpenDota API**: https://www.opendota.com/api
  - Match pubblici
  - Statistiche giocatori
  - Storico partite
  - **Gratuito, illimitato**

### **Framework ML**
- **Scikit-learn**: https://scikit-learn.org/
  - Algoritmi classici
  - Facile da usare
  - Documentazione ottima

- **XGBoost**: https://xgboost.readthedocs.io/
  - Tree-based models
  - Ottimo per tabular data
  - Molto performante

### **LLM Open Source**
- **Llama 2/3** (Meta): https://llama.meta.com/
  - Open source
  - Richiede GPU potente
  - Può essere fine-tuned

- **Mistral AI**: https://mistral.ai/
  - Open source models
  - Più leggero di Llama
  - Buone performance

---

## 🎯 CONCLUSIONE

### **Per il Progetto Attuale:**

1. **NON usare modelli ML custom** (troppo complesso per MVP)
2. **Usare calcoli statistici** (codice) + **LLM per formattazione** (Gemini/OpenAI)
3. **Raccogliere dati** via OpenDota per futuro modello custom
4. **Valutare modello custom** solo dopo MVP funzionante

### **Stack Raccomandato:**

```
Calcoli: TypeScript/JavaScript (già nel progetto)
Formattazione: Gemini API (già integrato)
Dataset: OpenDota API (già integrato)
Futuro ML: Python + Scikit-learn/XGBoost (se necessario)
```

---

## 📝 NOTE FINALI

- **OpenAI Five** è il modello più avanzato per Dota 2, ma NON è open source
- **Nessun modello pre-addestrato** disponibile pubblicamente
- **Creare modello custom** è fattibile ma richiede tempo/risorse
- **Approccio attuale** (calcoli + LLM) è sufficiente per MVP
- **Modello custom** può essere aggiunto in futuro se necessario

---

**Prossimi Passi:**
1. ✅ Mantenere approccio attuale (calcoli + LLM)
2. ✅ Migliorare prompt LLM con più contesto
3. ⏳ Raccogliere dati match per analisi future
4. ⏳ Valutare modello custom solo dopo validazione MVP

