# 🎮 Guida Avatar e Rank Medal - Dota 2

## ✅ AVATAR: Già Disponibile da OpenDota

### **OpenDota API Fornisce Avatar**

L'endpoint `/api/opendota/player/{id}` restituisce:

```json
{
  "profile": {
    "personaname": "Nome Giocatore",
    "avatar": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/...",
    "avatarmedium": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/...",
    "avatarfull": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/..."
  },
  "rank_tier": 72,  // Rank numerico (0-80)
  "solo_competitive_rank": "4500",  // MMR
  "competitive_rank": "4500"
}
```

### **Campi Disponibili:**
- ✅ `profile.avatarfull` - Avatar full size (184x184px)
- ✅ `profile.avatarmedium` - Avatar medium (64x64px)
- ✅ `profile.avatar` - Avatar small (32x32px)
- ✅ `profile.personaname` - Nome Steam del giocatore
- ✅ `rank_tier` - Rank numerico (0-80, dove 80 = Immortal)
- ✅ `solo_competitive_rank` - MMR numerico

### **Implementazione:**
```typescript
// Esempio uso
const playerData = await fetch(`/api/opendota/player/${playerId}`)
const { profile, rank_tier } = await playerData.json()

// Avatar
const avatarUrl = profile?.avatarfull || '/default-avatar.png'

// Rank
const rankTier = rank_tier || 0
```

---

## 🏆 RANK MEDAL: Opzioni Disponibili

### **Opzione 1: Usare Immagini da Internet** (Raccomandato)

#### **A. Steam CDN (Ufficiale)**
Steam fornisce le immagini dei medal tramite CDN:

```
https://steamcdn-a.akamaihd.net/apps/dota2/images/rank_icons/rank_icon_XX.png
```

Dove `XX` è il `rank_tier` (0-80).

**Pro:**
- ✅ Ufficiale, sempre aggiornato
- ✅ Nessun download necessario
- ✅ Qualità alta

**Contro:**
- ⚠️ Dipendenza da Steam CDN
- ⚠️ Potrebbe cambiare URL in futuro

#### **B. Repository GitHub**
Esistono repository con immagini rank:
- `dota2-rank-icons` (GitHub)
- `opendota-assets` (GitHub)

**Pro:**
- ✅ Controllo totale
- ✅ Possibilità di cache locale

**Contro:**
- ⚠️ Richiede download e hosting
- ⚠️ Potrebbe essere non aggiornato

### **Opzione 2: Creare Immagini Proprie** (Personalizzato)

**Pro:**
- ✅ Design personalizzato
- ✅ Coerente con brand
- ✅ Nessuna dipendenza esterna

**Contro:**
- ❌ Richiede design/grafica
- ❌ Manutenzione quando Valve aggiunge nuovi rank

---

## 🎯 SOLUZIONE RACCOMANDATA

### **Approccio Ibrido:**

1. **Avatar**: Usare `profile.avatarfull` da OpenDota (già disponibile)
2. **Rank Medal**: 
   - **Prima scelta**: Steam CDN (ufficiale)
   - **Fallback**: Immagini locali in `/public/ranks/`

### **Implementazione:**

```typescript
// app/api/player/[id]/profile/route.ts
// Aggiungere campi avatar e rank

const opendotaResponse = await fetch(`https://api.opendota.com/api/players/${id}`)
const opendotaData = await opendotaResponse.json()

return NextResponse.json({
  // ... dati esistenti
  avatar: opendotaData.profile?.avatarfull || null,
  personaname: opendotaData.profile?.personaname || null,
  rankTier: opendotaData.rank_tier || 0,
  soloMMR: opendotaData.solo_competitive_rank || null,
  rankMedalUrl: getRankMedalUrl(opendotaData.rank_tier),
})

// Helper function
function getRankMedalUrl(rankTier: number): string {
  if (!rankTier || rankTier === 0) {
    return '/ranks/unranked.png' // Fallback locale
  }
  
  // Steam CDN (ufficiale)
  return `https://steamcdn-a.akamaihd.net/apps/dota2/images/rank_icons/rank_icon_${rankTier}.png`
}
```

### **Componente React:**

```typescript
// components/PlayerAvatar.tsx
export function PlayerAvatar({ playerId }: { playerId: string }) {
  const [playerData, setPlayerData] = useState<any>(null)
  
  useEffect(() => {
    fetch(`/api/opendota/player/${playerId}`)
      .then(res => res.json())
      .then(data => setPlayerData(data))
  }, [playerId])
  
  if (!playerData) return <div>Loading...</div>
  
  return (
    <div className="flex items-center gap-3">
      <img 
        src={playerData.profile?.avatarfull || '/default-avatar.png'}
        alt={playerData.profile?.personaname || 'Player'}
        className="w-16 h-16 rounded-full"
      />
      {playerData.rank_tier > 0 && (
        <img 
          src={`https://steamcdn-a.akamaihd.net/apps/dota2/images/rank_icons/rank_icon_${playerData.rank_tier}.png`}
          alt={`Rank ${playerData.rank_tier}`}
          className="w-12 h-12"
        />
      )}
    </div>
  )
}
```

---

## 📊 MAPPATURA RANK TIER

### **Rank Tier Values (OpenDota):**

```
0 = Unranked
1-5 = Herald (Bronze)
6-10 = Guardian (Bronze)
11-15 = Crusader (Silver)
16-20 = Archon (Silver)
21-25 = Legend (Gold)
26-30 = Ancient (Gold)
31-35 = Divine (Red)
36-40 = Divine (Red) - Higher
41-45 = Immortal (Red with stars)
46-80 = Immortal (con numero stelle)
```

### **Esempio Mapping:**

```typescript
function getRankName(rankTier: number): string {
  if (rankTier === 0) return 'Unranked'
  if (rankTier <= 5) return 'Herald'
  if (rankTier <= 10) return 'Guardian'
  if (rankTier <= 15) return 'Crusader'
  if (rankTier <= 20) return 'Archon'
  if (rankTier <= 25) return 'Legend'
  if (rankTier <= 30) return 'Ancient'
  if (rankTier <= 35) return 'Divine'
  if (rankTier <= 40) return 'Divine'
  if (rankTier >= 41) return 'Immortal'
  return 'Unknown'
}
```

---

## 🚀 IMPLEMENTAZIONE RAPIDA

### **Step 1: Aggiungere Avatar e Rank al Profile Endpoint**

Modificare `/api/player/[id]/profile/route.ts` per includere:
- `avatar` (da `profile.avatarfull`)
- `personaname` (da `profile.personaname`)
- `rankTier` (da `rank_tier`)
- `rankMedalUrl` (calcolato)

### **Step 2: Creare Componente PlayerAvatar**

Componente che mostra:
- Avatar Steam
- Rank Medal (se disponibile)
- Nome giocatore

### **Step 3: Integrare nel Dashboard**

Aggiungere il componente nelle pagine:
- Dashboard principale
- Profiling page
- Settings page

---

## 📝 NOTE IMPORTANTI

### **Avatar:**
- ✅ **Già disponibile** da OpenDota
- ✅ URL Steam CDN (sempre aggiornato)
- ✅ Nessun download necessario

### **Rank Medal:**
- ✅ **Steam CDN** è la soluzione più semplice
- ⚠️ Se Steam CDN non funziona, serve fallback locale
- ⚠️ Rank tier 0 = Unranked (serve immagine default)

### **Licenze:**
- ✅ Avatar Steam: Usabile (pubblico)
- ✅ Rank Medal Steam: Usabile (pubblico, parte di Dota 2)
- ⚠️ Rispettare ToS di Valve per uso commerciale

---

## ✅ CONCLUSIONE

**Avatar**: ✅ **Già disponibile** - Basta usare `profile.avatarfull` da OpenDota

**Rank Medal**: ✅ **Steam CDN** - URL diretto, nessun download necessario

**Implementazione**: ~30 minuti per aggiungere avatar e rank medal al dashboard

