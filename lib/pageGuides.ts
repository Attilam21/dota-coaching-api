export interface PageGuide {
  title: string
  description: string
  sections?: Array<{
    title: string
    content: string
  }>
}

export const pageGuides: Record<string, PageGuide> = {
  '/dashboard': {
    title: 'Panoramica Dashboard',
    description: 'Vista d\'insieme completa delle tue performance recenti con statistiche chiave, trend, hero pool, benchmark e accesso rapido a tutte le analisi.',
    sections: [
      {
        title: 'Navigazione e Interfaccia',
        content: 'La sidebar laterale può essere aperta/chiusa cliccando sul pulsante con le frecce in alto a sinistra. La preferenza viene salvata automaticamente. Quando la sidebar è chiusa, hai più spazio per visualizzare i contenuti. Il pulsante Help in alto a destra ti fornisce una guida specifica per ogni pagina.'
      },
      {
        title: 'Cosa trovi qui',
        content: 'Dashboard principale con: Hero Pool (Top 6 heroes più giocati), Partite Chiave (Best/Worst/Outlier), Snapshot Stato Forma (KDA e Farm trend), Confronto con Meta (percentili OpenDota), Attività Recente (ultime 5 partite) e Azioni Rapide per accedere velocemente alle analisi. Tutte le statistiche sono basate sulle ultime 20 partite. I trend confrontano le ultime 5 e 10 partite per identificare miglioramenti o peggioramenti.'
      },
      {
        title: 'Hero Pool (Top 6)',
        content: 'Visualizza i tuoi 6 heroes più giocati con winrate, statistiche (partite giocate, vittorie/sconfitte) e link diretto all\'analisi completa. Ogni card mostra l\'icona dell\'eroe, il nome, il winrate colorato (verde ≥60%, giallo ≥50%, rosso <50%) e un bottone per vedere l\'analisi dettagliata. Il layout compatto ti permette di vedere rapidamente i tuoi heroes migliori.'
      },
      {
        title: 'Partite Chiave',
        content: 'Tre partite selezionate automaticamente: Best Match (miglior KDA tra le vittorie), Worst Match (peggior KDA tra le sconfitte) e Match Outlier (partita con metriche molto diverse dalla media). Ogni card mostra l\'eroe giocato, il risultato (W/L), il KDA e un link diretto all\'analisi. Passa il mouse sulla card per vedere l\'insight dettagliato.'
      },
      {
        title: 'Confronto con Meta',
        content: 'Confronta le tue performance con i percentili OpenDota per GPM, XPM e KDA. I percentili mostrano in quale posizione ti trovi rispetto alla community (es. Top 65%, Top 70%). I colori indicano la performance: verde per percentili ≥75%, giallo per ≥50%, rosso per <50%. Questi dati provengono direttamente da OpenDota quando disponibili.'
      },
      {
        title: 'Attività Recente',
        content: 'Timeline delle tue ultime 5 partite con: risultato (vittoria/sconfitta), eroe giocato, KDA, GPM e data. Ogni partita è cliccabile per accedere direttamente all\'analisi dettagliata. Il feed ti permette di vedere rapidamente le tue performance recenti e identificare pattern o trend.'
      },
      {
        title: 'Azioni Rapide',
        content: 'Accesso veloce alle sezioni principali: Analizza Ultima Partita (se disponibile), Coaching & Insights, Analizza Hero Pool, Storico Partite e Performance & Stile. Questi link ti permettono di navigare rapidamente alle analisi più importanti senza dover cercare nel menu.'
      },
      {
        title: 'Tabs Overview, Trend & Statistiche, Partite',
        content: 'Il tab Overview mostra lo snapshot stato forma, benchmark e attività recente. Il tab Trend & Statistiche mostra grafici e statistiche globali con trend nel tempo. Il tab Partite mostra la lista completa delle ultime partite. Usa questi tabs per approfondire diversi aspetti delle tue performance.'
      },
      {
        title: 'Metriche principali',
        content: 'Winrate: percentuale di vittorie. KDA: rapporto Kill/Death/Assist. GPM/XPM: Gold e Experience per minuto. Queste metriche vengono confrontate con i tuoi valori medi e con i percentili OpenDota per mostrare se stai performando meglio o peggio del solito e rispetto alla community.'
      }
    ]
  },
  '/dashboard/performance': {
    title: 'Performance & Stile di Gioco',
    description: 'Analisi approfondita delle tue performance con identificazione automatica del tuo stile di gioco e raccomandazioni personalizzate.',
    sections: [
      {
        title: 'Metriche principali',
        content: 'KDA (Kill/Death/Assist ratio), GPM (Gold per minuto), XPM (Experience per minuto), morti medie, assist medie. Visualizzazione con grafici radar interattivi per confrontare le tue performance in diverse categorie. Ogni metrica viene confrontata con i tuoi valori medi per identificare punti di forza e debolezze.'
      },
      {
        title: 'Stile di gioco',
        content: 'Identificazione automatica del tuo stile di gioco basata sulle tue statistiche: Aggressivo (alto KDA, alta kill participation), Conservativo (basse morti, alta farm efficiency), Bilanciato (valori equilibrati). Il sistema analizza le tue performance e ti assegna uno stile dominante con percentuali.'
      },
      {
        title: 'Benchmarks e Percentili',
        content: 'Confronto delle tue performance con i benchmark della community. Vedi in quale percentile ti trovi per GPM, XPM e KDA rispetto agli altri giocatori del tuo livello. I benchmark ti aiutano a capire se stai performando sopra o sotto la media.'
      },
      {
        title: 'Suggerimenti personalizzati',
        content: 'Raccomandazioni specifiche basate sul tuo stile di gioco identificato e sulle tue performance. I suggerimenti sono generati analizzando le tue debolezze e suggerendo aree di miglioramento concrete.'
      }
    ]
  },
  '/dashboard/heroes': {
    title: 'Il Mio Pool',
    description: 'Analisi completa del tuo hero pool con diversità, copertura ruoli, specializzazione e raccomandazioni personalizzate.',
    sections: [
      {
        title: 'Tab Pool Analysis',
        content: 'Panoramica del tuo hero pool: summary cards con statistiche aggregate, analisi diversità (quanto è vario il tuo pool), analisi copertura ruoli (quali ruoli copri meglio), analisi specializzazione (su quali eroi sei più forte), e raccomandazioni personalizzate per migliorare il tuo pool.'
      },
      {
        title: 'Tab Statistiche',
        content: 'Statistiche dettagliate per ogni eroe giocato: winrate, numero di partite, KDA medio, GPM/XPM medio. Visualizzazione in grid o tabella compatta con opzioni di ordinamento. Filtra e ordina per identificare i tuoi eroi più forti e quelli su cui migliorare.'
      },
      {
        title: 'Diversità & Copertura Ruoli',
        content: 'Analisi della diversità del tuo pool: quanti eroi diversi giochi, distribuzione per ruolo (Carry, Mid, Offlane, Support), performance per ruolo con winrate e heroes giocati. Identifica gap nella copertura ruoli e suggerimenti per bilanciare il pool.'
      },
      {
        title: 'Come usarlo',
        content: 'Usa il tab Pool Analysis per avere una visione d\'insieme del tuo hero pool con raccomandazioni. Usa il tab Statistiche per vedere i dettagli di ogni eroe e identificare su quali concentrarti. Le raccomandazioni ti aiutano a capire come migliorare la diversità e la copertura ruoli.'
      }
    ]
  },
  '/dashboard/hero-analysis': {
    title: 'Matchup & Counter',
    description: 'Strumento per decisioni pick/ban con analisi matchup, counter picks e raccomandazioni per draft.',
    sections: [
      {
        title: 'Tab Matchup',
        content: 'Analisi matchup dettagliata: seleziona un eroe per vedere il winrate contro altri eroi, analisi counter (chi batte chi), pick recommendations basate sui tuoi dati e sul meta, e visualizzazione grafica dei matchups più importanti.'
      },
      {
        title: 'Tab Performance Trend',
        content: 'Trend delle performance nel tempo per ogni eroe: winrate nel tempo, KDA trend, GPM/XPM trend, e identificazione di pattern (es. "questo eroe performa meglio in partite lunghe").'
      },
      {
        title: 'Tab Hero Details',
        content: 'Dettagli completi per ogni eroe: statistiche aggregate, build più efficaci, item più utilizzati, ruoli giocati, e confronto con la tua media per identificare punti di forza e debolezze specifici.'
      },
      {
        title: 'Come usarlo',
        content: 'Usa questa pagina durante il draft per prendere decisioni informate. Il tab Matchup ti aiuta a scegliere counter picks efficaci. Il tab Performance Trend ti mostra se stai migliorando con un eroe. Il tab Hero Details ti dà tutte le informazioni per capire come giocare meglio un eroe.'
      }
    ]
  },
  '/dashboard/role-analysis': {
    title: 'Analisi Ruolo',
    description: 'Performance dettagliate per ogni ruolo giocato (Carry, Mid, Offlane, Support) con identificazione del tuo ruolo preferito e suggerimenti specifici.',
    sections: [
      {
        title: 'Performance per ruolo',
        content: 'Statistiche specifiche per ogni ruolo giocato: GPM medio, XPM medio, KDA, morti medie, winrate, numero di partite. Il sistema identifica automaticamente il ruolo in cui performi meglio e quello in cui hai bisogno di migliorare. Visualizzazione con grafici per confrontare le performance tra ruoli.'
      },
      {
        title: 'Ruolo preferito',
        content: 'Identificazione automatica del tuo ruolo preferito basato su winrate, numero di partite e performance medie. Vedi anche la distribuzione percentuale delle partite giocate per ruolo.'
      },
      {
        title: 'Raccomandazioni per ruolo',
        content: 'Suggerimenti specifici per migliorare in ogni ruolo basati sulle tue performance. Le raccomandazioni sono personalizzate per ogni ruolo e ti aiutano a capire cosa devi migliorare (es. "Come Carry, migliora il tuo GPM" o "Come Support, aumenta la tua kill participation").'
      },
      {
        title: '💡 Lampadine Interattive (Suggerimenti AI)',
        content: 'Nelle card dei ruoli e nelle metriche troverai delle piccole lampadine blu interattive. Clicca su una lampadina per ottenere un suggerimento AI personalizzato basato sul ruolo specifico o sulla metrica visualizzata. Il suggerimento analizza le tue performance in quel ruolo e ti fornisce consigli pratici e concreti per migliorare (es. "Come Carry, concentrati sul farm nelle prime 10 minuti" o "Il tuo ruolo preferito è Support, ma hai bisogno di migliorare la vision").'
      }
    ]
  },
  '/dashboard/teammates': {
    title: 'I Tuoi Compagni',
    description: 'Statistiche dettagliate dei giocatori con cui hai giocato più spesso, analisi delle sinergie e identificazione dei compagni più efficaci.',
    sections: [
      {
        title: 'Top compagni',
        content: 'Lista completa dei giocatori con cui hai giocato più spesso, con winrate insieme, numero di partite giocate insieme, KDA medio quando giochi insieme e statistiche aggregate. I compagni sono ordinati per numero di partite o winrate per aiutarti a identificare i tuoi compagni più frequenti e più efficaci.'
      },
      {
        title: 'Insights & Sinergie',
        content: 'Analisi approfondita delle sinergie: identificazione dei compagni con cui hai il winrate più alto (sinergie positive) e quelli con cui performi peggio (sinergie negative). Il sistema analizza anche i ruoli giocati insieme per capire quali combinazioni di ruoli funzionano meglio per te.'
      },
      {
        title: 'Come usarlo',
        content: 'Usa questa pagina per capire con chi giochi meglio e identificare i compagni ideali per le tue partite. Clicca su un compagno per vedere statistiche più dettagliate. Questa analisi ti aiuta a costruire team più efficaci.'
      },
      {
        title: '💡 Lampadine Interattive (Suggerimenti AI)',
        content: 'Nelle card dei compagni e nei grafici troverai delle piccole lampadine blu interattive. Clicca su una lampadina per ottenere un suggerimento AI personalizzato basato sulle tue sinergie con i compagni. Il suggerimento analizza i tuoi pattern di gioco insieme (es. winrate con compagni specifici, ruoli giocati insieme) e ti fornisce consigli pratici su come costruire team più efficaci.'
      }
    ]
  },
  '/dashboard/matches': {
    title: 'Storico Partite',
    description: 'Lista completa delle tue ultime partite con accesso rapido all\'analisi dettagliata di ogni singola partita.',
    sections: [
      {
        title: 'Cosa puoi fare',
        content: 'Visualizza tutte le tue partite recenti (ultime 20) con informazioni essenziali: risultato (vittoria/sconfitta), eroe giocato, KDA, durata partita, data e ora. Clicca su una partita per aprire l\'analisi dettagliata completa con tutti i tabs (Overview, Fasi, Item Timing, Teamfight).'
      },
      {
        title: 'Filtri e ricerca',
        content: 'Puoi filtrare le partite per risultato (vittorie/sconfitte), eroe giocato o periodo. Usa la ricerca per trovare partite specifiche per Match ID o data.'
      },
      {
        title: 'Statistiche rapide',
        content: 'Ogni card partita mostra le informazioni principali a colpo d\'occhio: eroe, KDA, risultato, durata. Questo ti permette di identificare rapidamente le partite più interessanti da analizzare in dettaglio.'
      }
    ]
  },
  '/dashboard/match-analysis': {
    title: 'Seleziona Partita',
    description: 'Hub centrale per selezionare e analizzare una partita specifica con analisi dettagliata completa.',
    sections: [
      {
        title: 'Cerca per Match ID',
        content: 'Puoi cercare una partita specifica inserendo il Match ID nella barra di ricerca. Il Match ID è un numero univoco che identifica ogni partita di Dota 2. Puoi trovarlo nel replay, su OpenDota o Dotabuff.'
      },
      {
        title: 'Lista partite recenti',
        content: 'Visualizza le tue ultime 20 partite con informazioni essenziali: eroe giocato, risultato, KDA, durata. Clicca su una partita per aprire l\'analisi dettagliata completa con tabs: Overview (panoramica generale), Fasi (early/mid/late game), Item Timing (timeline item), Teamfight (analisi teamfight).'
      },
      {
        title: 'Analisi disponibili',
        content: 'Ogni partita può essere analizzata in dettaglio con: confronto delle tue performance con la tua media, analisi fase per fase (early/mid/late game), item timing e efficienza itemization, analisi dettagliata di ogni teamfight con partecipazione e damage. Tutte le metriche sono confrontate con i tuoi valori medi per mostrare se hai performato meglio o peggio del solito.'
      },
      {
        title: 'Come usarlo',
        content: 'Seleziona una partita dalla lista o cerca per Match ID. Una volta aperta l\'analisi, naviga tra i tabs per vedere diversi aspetti della partita. Usa il confronto con la media per capire se hai performato meglio o peggio del solito.'
      }
    ]
  },
  '/dashboard/match-analysis/[id]': {
    title: 'Analisi Dettagliata Partita',
    description: 'Analisi completa di una singola partita con tabs per Overview, Fasi di Gioco, Item Timing e Teamfight.',
    sections: [
      {
        title: 'Tab Overview',
        content: 'Panoramica completa: confronto con la tua media, performance giocatori, timeline Gold/XP, grafici e analisi AI.'
      },
      {
        title: 'Tab Fasi di Gioco',
        content: 'Analisi dettagliata per fase: Early Game (0-10min), Mid Game (10-25min), Late Game (25+min) con metriche specifiche per ogni fase.'
      },
      {
        title: 'Tab Item Timing',
        content: 'Timeline degli item acquistati, confronto con timing ottimali e analisi dell\'efficienza dell\'itemization.'
      },
      {
        title: 'Tab Teamfight',
        content: 'Analisi dettagliata di ogni teamfight: partecipazione, damage/healing, outcome e impatto sul risultato della partita.'
      },
      {
        title: 'Confronto con Media',
        content: 'Ogni metrica viene confrontata con la tua media delle ultime partite, mostrando se hai performato meglio o peggio del solito.'
      }
    ]
  },
  '/dashboard/coaching-insights': {
    title: 'Coaching & Insights',
    description: 'Sezione consolidata che combina profilo, confronto meta, pattern di vittoria e raccomandazioni personalizzate basate su AI avanzata.',
    sections: [
      {
        title: 'Tab Overview',
        content: 'Panoramica completa del tuo profilo: ruolo principale identificato, stile di gioco, AttilaLAB Score (0-100), trend delle performance (GPM/XPM/KDA), metriche chiave con percentili, punti di forza e debolezze identificati, e raccomandazioni prioritarie per il miglioramento.'
      },
      {
        title: 'Tab Meta Comparison',
        content: 'Confronto dettagliato delle tue performance rispetto al meta attuale: percentili OpenDota per ruolo, gap identificati (dove sei sopra/sotto la media), aree di miglioramento prioritario con insight AI, e confronto metriche chiave (GPM, XPM, KDA, Winrate) con i valori meta.'
      },
      {
        title: 'Tab Win Conditions',
        content: 'Analisi approfondita dei pattern di vittoria: cosa fai di diverso quando vinci rispetto a quando perdi, metriche chiave che determinano le vittorie (es. GPM più alto, morti più basse), insight AI sui pattern identificati, e confronto dettagliato tra partite vinte e perse.'
      },
      {
        title: 'Tab Recommendations',
        content: 'Raccomandazioni personalizzate basate su tutte le analisi: punti di forza principali da sfruttare, aree di miglioramento prioritarie con azioni concrete, suggerimenti specifici per ruolo e stile di gioco, e roadmap di miglioramento strutturata.'
      },
      {
        title: 'Come usarlo',
        content: 'Naviga tra i 4 tabs per vedere diversi aspetti del tuo profilo. Ogni tab fornisce insights specifici: Overview per la panoramica generale, Meta Comparison per capire dove ti trovi rispetto alla community, Win Conditions per identificare cosa funziona, e Recommendations per azioni concrete di miglioramento.'
      }
    ]
  },
  '/dashboard/advanced': {
    title: 'Analisi Avanzate',
    description: 'Analisi approfondite divise per categoria: Lane, Farm, Fight e Vision.',
    sections: [
      {
        title: 'Cosa trovi',
        content: 'Quattro categorie di analisi avanzate: Lane & Early Game, Farm & Economy, Fights & Damage, Vision & Map Control.'
      },
      {
        title: 'Dati utilizzati',
        content: 'Tutte le analisi sono basate sulle tue ultime 20 partite con valori medi e aggregati.'
      }
    ]
  },
  '/dashboard/advanced/lane-early': {
    title: 'Lane & Early Game',
    description: 'Analisi dettagliata della fase di lane e early game.',
    sections: [
      {
        title: 'Metriche principali',
        content: 'Last Hits, Denies, CS/min, Deny Rate, First Blood involvement, CS stimato a 10 minuti.'
      },
      {
        title: 'Cosa indica',
        content: 'Queste metriche mostrano quanto sei efficace nella fase di lane e quanto bene controlli il farm nella early game.'
      }
    ]
  },
  '/dashboard/advanced/farm-economy': {
    title: 'Farm & Economy',
    description: 'Analisi dell\'efficienza di farm e gestione dell\'economia.',
    sections: [
      {
        title: 'Metriche principali',
        content: 'GPM, XPM, Gold Utilization, Net Worth, Buyback Efficiency, Phase Analysis (winrate per fase di gioco).'
      },
      {
        title: 'Cosa indica',
        content: 'Queste metriche mostrano quanto sei efficiente nel farmare e come gestisci l\'economia durante la partita.'
      }
    ]
  },
  '/dashboard/advanced/fights-damage': {
    title: 'Fights & Damage',
    description: 'Analisi del contributo ai teamfight e del damage output.',
    sections: [
      {
        title: 'Metriche principali',
        content: 'Kill Participation, Hero Damage, Tower Damage, Damage per Minute, Deaths per Minute, Teamfight Participation.'
      },
      {
        title: 'Cosa indica',
        content: 'Queste metriche mostrano quanto impatto hai nei teamfight e quanto damage infliggi durante le partite.'
      }
    ]
  },
  '/dashboard/advanced/vision-control': {
    title: 'Vision & Map Control',
    description: 'Analisi del controllo mappa e della gestione della visione.',
    sections: [
      {
        title: 'Metriche principali',
        content: 'Observer/Sentry Wards piazzate/rimosse, Ward Efficiency, Deward Efficiency, Rune per Minute, Roshan Control, Camps Stacked.'
      },
      {
        title: 'Cosa indica',
        content: 'Queste metriche mostrano quanto sei efficace nel controllare la mappa e gestire la visione per il tuo team.'
      }
    ]
  },
  '/dashboard/builds': {
    title: 'Build & Items',
    description: 'Analisi approfondita delle tue build e degli item utilizzati nelle partite.',
    sections: [
      {
        title: 'Overview',
        content: 'Panoramica generale degli item più utilizzati, build più comuni e statistiche aggregate su tutte le tue partite.'
      },
      {
        title: 'Per Hero',
        content: 'Analisi delle build specifiche per ogni eroe. Seleziona un eroe per vedere le build più efficaci e gli item più utilizzati con quel eroe.'
      },
      {
        title: 'Analisi Item',
        content: 'Identificazione di item sottoutilizzati (alto winrate, bassa frequenza) e overpurchased (alta frequenza, basso winrate). Analisi dell\'efficienza degli item.'
      },
      {
        title: 'Build Comparison',
        content: 'Confronto tra diverse build per identificare quali combinazioni di item sono più efficaci in termini di winrate.'
      },
      {
        title: '💡 Lampadine Interattive (Suggerimenti AI)',
        content: 'Nelle sezioni Item Più Utilizzati, Build Più Comuni, Item Sottoutilizzati, Item Overpurchased, Efficienza Item e Confronto Build troverai delle piccole lampadine blu interattive. Clicca su una lampadina per ottenere un suggerimento AI personalizzato basato sui tuoi item e build. Il suggerimento analizza i tuoi pattern di itemization (es. item sottoutilizzati con alto winrate, build più efficaci) e ti fornisce consigli pratici su quali item comprare più spesso o quali build evitare.'
      }
    ]
  },
  '/dashboard/settings': {
    title: 'Impostazioni Account',
    description: 'Gestione del tuo profilo, configurazione del Dota 2 Account ID e personalizzazione dell\'interfaccia del dashboard.',
    sections: [
      {
        title: 'Dota 2 Account ID',
        content: 'Configura qui il tuo Dota 2 Account ID (Player ID). Questo è un numero univoco che identifica il tuo account Steam/Dota 2. Puoi trovarlo nel tuo profilo Steam, su OpenDota o Dotabuff. Una volta salvato, verrà utilizzato automaticamente in tutte le sezioni del dashboard per caricare le tue statistiche.'
      },
      {
        title: 'Importante',
        content: 'Il Player ID salvato qui viene utilizzato in tutte le analisi. Assicurati che sia corretto per ottenere dati accurati. Se cambi account, aggiorna il Player ID qui. Il sistema salva il Player ID nel localStorage del browser per comodità.'
      },
      {
        title: 'Come trovare il tuo Account ID',
        content: '1) Apri Steam → Visualizza Profilo → Modifica Profilo → URL personalizzato (se configurato). 2) Vai su OpenDota.com e cerca il tuo profilo. 3) Vai su Dotabuff.com e cerca il tuo profilo. L\'Account ID è un numero (es. 123456789).'
      },
      {
        title: 'Personalizzazione Sfondo Dashboard',
        content: 'Puoi personalizzare lo sfondo del dashboard scegliendo tra diverse opzioni disponibili. Vai alla sezione "Sfondo Dashboard" per vedere tutte le anteprime. Clicca su uno sfondo per applicarlo immediatamente. La modifica viene salvata automaticamente e applicata a tutte le pagine del dashboard. Gli sfondi disponibili includono: Dashboard (sfondo principale), Profile (sfondo pagina profilazione), Landa Desolata, Sfondo Pop, e Nessuno (per un look più pulito). Il sistema adatta automaticamente trasparenze e contrasti per garantire la leggibilità su tutti gli sfondi.'
      },
      {
        title: 'Gestione Password',
        content: 'Nella sezione "Sicurezza Account" puoi cambiare la tua password. Inserisci la password corrente, la nuova password e confermala. La nuova password deve essere diversa da quella attuale e rispettare i requisiti di sicurezza.'
      },
      {
        title: 'Informazioni Account',
        content: 'Vedi le informazioni del tuo account: email, data di registrazione e altre informazioni di profilo. Queste informazioni sono utilizzate per personalizzare la tua esperienza sulla piattaforma.'
      }
    ]
  },
  '/dashboard/guida-utente': {
    title: 'Guida Utente',
    description: 'Centro di aiuto completo con tour guidato interattivo, guide rapide e panoramica di tutte le funzionalità della piattaforma.',
    sections: [
      {
        title: 'Tour Guidato',
        content: 'Avvia il tour guidato interattivo per scoprire tutte le funzionalità della piattaforma. Il tour ti guida passo-passo attraverso le sezioni principali, evidenziando gli elementi importanti e spiegando come usarli. Puoi saltare o riprendere il tour in qualsiasi momento.'
      },
      {
        title: 'Guide Rapide',
        content: 'Le guide rapide ti forniscono una panoramica veloce delle funzionalità principali: configurazione iniziale, dashboard panoramica, analisi partite e uso del pulsante Help. Ogni guida include un link diretto alla sezione corrispondente.'
      },
      {
        title: 'Sezioni Principali',
        content: 'Panoramica completa di tutte le sezioni del dashboard: Statistiche Giocatore (Panoramica, Performance, Hero Pool, ecc.), Team & Partite, Analisi Partita, Coaching & Profilo, Analisi Tecniche. Ogni sezione è spiegata con il suo scopo e le funzionalità principali.'
      },
      {
        title: 'Consigli Utili',
        content: 'Suggerimenti pratici per usare al meglio la piattaforma: usa sempre il pulsante Help in ogni pagina, configura il Player ID prima di iniziare, le analisi sono basate sulle ultime 20 partite (i trend confrontano le ultime 5 e 10), puoi riprendere il tour quando vuoi.'
      }
    ]
  },
  '/dashboard/games': {
    title: 'Giochi Anti-Tilt',
    description: 'Mini-giochi divertenti per rilassarsi e sfogarsi tra una partita e l\'altra, ideali per gestire il tilt e mantenere la concentrazione.',
    sections: [
      {
        title: 'Smash The Ancient',
        content: 'Distruggi l\'Ancient nemico cliccando il più velocemente possibile! Crea combo incredibili per ottenere bonus punti. Il gioco dura 30 secondi. Il punteggio finale è calcolato considerando i click totali, le combo e la velocità (CPS - Clicks Per Second).'
      },
      {
        title: 'Hero Matchup',
        content: 'Metti alla prova la tua conoscenza dei matchups di Dota 2! Indovina quale eroe batte l\'avversario mostrato. Hai 4 opzioni tra cui scegliere. Ogni risposta corretta ti dà punti e crea uno streak. Rispondi correttamente per 30 secondi per ottenere il miglior punteggio possibile.'
      },
      {
        title: 'Come funzionano',
        content: 'Entrambi i giochi sono progettati per aiutarti a rilassarti e distrarti tra le partite. Usa questi mini-giochi quando ti senti tiltato o stressato. Non richiedono concentrazione estrema e ti permettono di "resettare" la mente prima della prossima partita.'
      },
      {
        title: '💡 Lampadine Interattive (Suggerimenti AI)',
        content: 'Nei giochi troverai delle piccole lampadine blu interattive. Clicca su una lampadina per ottenere suggerimenti personalizzati basati sulle tue performance di gioco. I suggerimenti AI analizzano i tuoi dati e ti forniscono consigli pratici per migliorare il tuo gameplay, anche mentre ti rilassi con i mini-giochi.'
      }
    ]
  },
  '/dashboard/anti-tilt': {
    title: 'Anti-Tilt',
    description: 'Sistema intelligente per identificare e gestire il tilt, con analisi dei pattern negativi e suggerimenti per il recupero.',
    sections: [
      {
        title: 'Rilevamento Tilt',
        content: 'Il sistema analizza automaticamente le tue ultime partite per identificare segnali di tilt: serie di sconfitte consecutive, winrate in calo, performance peggiorate. Quando viene rilevato il tilt, vedrai un avviso con statistiche dettagliate sulla tua situazione attuale.'
      },
      {
        title: 'Pattern Negativi',
        content: 'L\'analisi identifica i pattern che portano a performance negative: orari del giorno con winrate basso, giorni della settimana problematici, eroi con cui performi peggio quando sei tiltato. Questi pattern ti aiutano a capire quando e come evitare di giocare in condizioni subottimali.'
      },
      {
        title: 'Statistiche di Recupero',
        content: 'Visualizza statistiche sul tuo recupero: tempo medio per recuperare da una serie di sconfitte, migliori winstreak dopo un tilt, winrate durante il recupero. Queste statistiche ti aiutano a capire quanto tempo serve tipicamente per tornare in forma.'
      },
      {
        title: 'Suggerimenti Personalizzati',
        content: 'Ricevi suggerimenti specifici basati sui tuoi pattern: quando prendere una pausa, quali eroi evitare quando sei tiltato, come migliorare il winrate in determinati orari. I suggerimenti sono personalizzati per il tuo profilo di gioco.'
      },
      {
        title: '💡 Lampadine Interattive (Suggerimenti AI)',
        content: 'Nelle card delle statistiche e nei grafici troverai delle piccole lampadine blu interattive. Clicca su una lampadina per ottenere un suggerimento AI personalizzato basato sui tuoi pattern di tilt e recupero. Il suggerimento analizza la tua situazione specifica (serie di sconfitte, pattern negativi, statistiche di recupero) e ti fornisce consigli pratici e concreti per gestire il tilt e migliorare le tue performance.'
      }
    ]
  },
  '/dashboard/predictions': {
    title: 'Analisi Predittive',
    description: 'Scopri cosa succederà se segui i consigli delle tue partite. Analizziamo tutte le tue partite per identificare pattern e creare proiezioni future.',
    sections: [
      {
        title: 'Impact Score',
        content: 'L\'Impact Score (0-100) misura quanto impatto avrebbero i tuoi miglioramenti se seguissi tutti i consigli identificati. Un punteggio alto indica che ci sono molte opportunità di miglioramento con alto impatto. Il punteggio è calcolato analizzando la frequenza e l\'impatto di ogni raccomandazione nelle tue partite.'
      },
      {
        title: 'I Tuoi Errori Più Comuni',
        content: 'Visualizza i pattern di errori che appaiono più spesso nelle tue partite, ordinati per frequenza e impatto. Ogni pattern mostra: la raccomandazione, quante partite è apparsa (frequenza e percentuale), la categoria (farming, positioning, teamfight, ecc.) e il livello di impatto (high/medium/low). Seguire questi consigli avrebbe il massimo impatto sul tuo winrate.'
      },
      {
        title: 'Winrate Previsto',
        content: 'Vedi quanto potrebbe migliorare il tuo winrate se seguissi tutte le raccomandazioni. Il sistema calcola un winrate previsto basato sull\'impatto cumulativo di tutti i miglioramenti suggeriti. Questo ti aiuta a capire il potenziale di miglioramento.'
      },
      {
        title: 'Path to Improvement',
        content: 'Accesso rapido al percorso step-by-step personalizzato per raggiungere i tuoi obiettivi. Questo strumento crea un percorso strutturato con step prioritari, target specifici e stime di tempo per il miglioramento.'
      },
      {
        title: 'What-If Analysis',
        content: 'Simula cosa succede se migliori metriche specifiche (GPM, morti, KDA, teamfight). Questo strumento ti permette di vedere l\'impatto previsto di miglioramenti specifici sul tuo winrate e MMR.'
      },
      {
        title: 'Recommendations per Categoria',
        content: 'Visualizza il riepilogo delle raccomandazioni divise per livello di impatto (alto, medio, basso) e la categoria più comune. Questo ti aiuta a capire su quali aree concentrarti per il massimo impatto.'
      }
    ]
  },
  '/dashboard/predictions/improvement-path': {
    title: 'Path to Improvement',
    description: 'Percorso step-by-step personalizzato per raggiungere i tuoi obiettivi di miglioramento basato sulle tue performance attuali e sul meta.',
    sections: [
      {
        title: 'Step da Seguire',
        content: 'Ogni step rappresenta un\'area di miglioramento specifica con: valore attuale, valore target, gap da colmare, percentuale di miglioramento, impatto previsto sul winrate, priorità (high/medium/low), azioni concrete da intraprendere e stima del numero di partite necessarie. Gli step sono ordinati per priorità e impatto.'
      },
      {
        title: 'Stato Attuale vs Risultato Previsto',
        content: 'Confronta le tue statistiche attuali (winrate, GPM, KDA, morti, ruolo) con il risultato previsto dopo aver completato tutti gli step. Vedi il miglioramento previsto del winrate, il guadagno MMR stimato e il timeframe necessario (breve/medio/lungo termine).'
      },
      {
        title: 'Confronto con Meta',
        content: 'Vedi i gap tra le tue performance e gli standard del meta per il tuo ruolo. Il confronto mostra: GPM gap, XPM gap, KDA gap e Deaths gap. I gap positivi indicano che sei sopra il meta, quelli negativi indicano aree di miglioramento.'
      },
      {
        title: 'Categorie di Miglioramento',
        content: 'Gli step coprono diverse categorie: Farming (GPM, farm rate), Positioning (morti, map awareness), Teamfight (KDA, partecipazione), Teamplay (coordinazione), Vision (warding per support). Ogni categoria ha metriche specifiche e target basati sul meta per il tuo ruolo.'
      },
      {
        title: 'Come Usarlo',
        content: 'Segui gli step in ordine di priorità. Inizia dagli step ad alto impatto e alta priorità. Ogni step include azioni concrete che puoi intraprendere. Monitora i tuoi progressi confrontando i valori attuali con i target. Il sistema aggiorna automaticamente il percorso quando migliori.'
      }
    ]
  },
  '/dashboard/predictions/what-if': {
    title: 'What-If Analysis',
    description: 'Simula cosa succede se migliori metriche specifiche. Scopri l\'impatto dei tuoi miglioramenti sul winrate e MMR previsti.',
    sections: [
      {
        title: 'Scenari Disponibili',
        content: 'Ogni scenario simula il miglioramento di una metrica specifica: GPM (Gold per minuto), Morti (riduzione), KDA (miglioramento), Teamfight (partecipazione). Per ogni scenario vedi: valore attuale, valore migliorato, miglioramento percentuale, winrate previsto, miglioramento winrate, MMR gain stimato e livello di confidenza (high/medium/low).'
      },
      {
        title: 'Scenario con Maggior Impatto',
        content: 'Lo scenario evidenziato mostra quale miglioramento avrebbe il massimo impatto sul tuo winrate. Questo ti aiuta a identificare l\'area su cui concentrarti per il miglioramento più significativo. Vedi anche il reasoning che spiega perché questo scenario è il più impattante.'
      },
      {
        title: 'Impatto Combinato',
        content: 'Vedi cosa succederebbe se migliorassi TUTTE le metriche insieme. Questo mostra il potenziale massimo di miglioramento: winrate finale previsto, miglioramento totale del winrate e MMR gain totale. Questo ti dà una visione del tuo potenziale di crescita complessivo.'
      },
      {
        title: 'Confidenza',
        content: 'Ogni scenario ha un livello di confidenza (high/medium/low) che indica quanto affidabile è la proiezione. La confidenza è basata sulla quantità di dati disponibili e sulla coerenza delle tue performance. Gli scenari ad alta confidenza sono più affidabili.'
      },
      {
        title: 'Come Usarlo',
        content: 'Usa questa analisi per identificare quali metriche migliorare per il massimo impatto. Concentrati sugli scenari ad alto impatto e alta confidenza. Usa l\'impatto combinato per vedere il tuo potenziale massimo. Questa analisi ti aiuta a prendere decisioni informate su dove concentrare i tuoi sforzi di miglioramento.'
      }
    ]
  }
}

