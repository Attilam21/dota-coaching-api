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
    description: 'Vista d\'insieme completa delle tue performance recenti con statistiche chiave, trend e accesso rapido a tutte le analisi.',
    sections: [
      {
        title: 'Cosa trovi qui',
        content: 'Statistiche aggregate delle ultime 20 partite: winrate complessivo e per periodo, KDA medio, GPM/XPM, trend delle performance nel tempo, heatmap attività e link rapidi alle analisi approfondite. I trend sono calcolati confrontando le ultime 5 e 10 partite. Questa pagina è il tuo punto di partenza per monitorare le tue performance generali.'
      },
      {
        title: 'Come usarlo',
        content: 'Usa questa pagina come dashboard principale per avere una visione d\'insieme rapida. Dalle card statistiche puoi accedere direttamente alle sezioni dettagliate. I tabs Overview, Trend & Statistiche e Partite ti permettono di approfondire diversi aspetti delle tue performance.'
      },
      {
        title: 'Metriche principali',
        content: 'Winrate: percentuale di vittorie. KDA: rapporto Kill/Death/Assist. GPM/XPM: Gold e Experience per minuto. Queste metriche vengono confrontate con i tuoi valori medi per mostrare se stai performando meglio o peggio del solito.'
      },
      {
        title: '💡 Lampadine Interattive (Suggerimenti AI)',
        content: 'In alcune card statistiche troverai delle piccole lampadine blu (icona 💡) in alto a destra o in altri angoli. Queste sono interattive: clicca su una lampadina per ottenere un suggerimento personalizzato generato da AI basato sui tuoi dati specifici. Il suggerimento analizza il contesto della metrica (es. trend winrate, performance eroe, ecc.) e ti fornisce consigli pratici per migliorare. I suggerimenti vengono generati in tempo reale quando clicchi la lampadina.'
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
    title: 'Hero Pool',
    description: 'Panoramica completa del tuo pool di eroi con statistiche dettagliate per ogni eroe giocato.',
    sections: [
      {
        title: 'Cosa trovi',
        content: 'Lista completa dei tuoi eroi più giocati con winrate, numero di partite giocate, KDA medio, GPM/XPM medio e statistiche principali per ogni eroe. Gli eroi sono ordinati per numero di partite o winrate per aiutarti a identificare i tuoi eroi più forti.'
      },
      {
        title: 'Come usarlo',
        content: 'Usa questa pagina per capire quali eroi giochi di più e con quali hai il miglior winrate. Clicca su un eroe per vedere statistiche più dettagliate. Identifica i tuoi eroi più forti (alto winrate) e quelli su cui devi migliorare (basso winrate).'
      },
      {
        title: '💡 Lampadine Interattive (Suggerimenti AI)',
        content: 'Nelle card statistiche e nei grafici troverai delle piccole lampadine blu interattive. Clicca su una lampadina per ottenere un suggerimento AI personalizzato basato sui tuoi eroi e le tue performance. Il suggerimento analizza il tuo hero pool (es. distribuzione winrate, eroi più giocati) e ti fornisce consigli pratici su quali eroi giocare di più o su cui migliorare.'
      }
    ]
  },
  '/dashboard/hero-analysis': {
    title: 'Analisi Eroi Dettagliata',
    description: 'Analisi approfondita delle performance per ogni eroe giocato con statistiche dettagliate e visualizzazioni grafiche.',
    sections: [
      {
        title: 'Statistiche per eroe',
        content: 'Per ogni eroe vedi: winrate complessivo, KDA medio, GPM/XPM medio, numero di partite giocate, ruolo principale giocato. Grafici interattivi per visualizzare le performance nel tempo e confrontare diversi eroi. Le statistiche sono calcolate sulle tue ultime partite con quell\'eroe.'
      },
      {
        title: 'Migliori e peggiori eroi',
        content: 'Identificazione automatica dei tuoi eroi più forti (alto winrate, buone statistiche) e di quelli su cui devi migliorare (basso winrate, statistiche scarse). Il sistema evidenzia anche eroi sottoutilizzati (poche partite ma alto winrate) che potresti giocare di più.'
      },
      {
        title: 'Confronto eroi',
        content: 'Confronta le performance di diversi eroi per capire quali si adattano meglio al tuo stile di gioco. I grafici ti permettono di vedere visivamente le differenze in winrate, KDA e altre metriche tra i tuoi eroi.'
      },
      {
        title: '💡 Lampadine Interattive (Suggerimenti AI)',
        content: 'Nelle card delle metriche e nei grafici troverai delle piccole lampadine blu interattive. Clicca su una lampadina per ottenere un suggerimento AI personalizzato basato sull\'eroe specifico o sulla metrica visualizzata. Il suggerimento analizza le tue performance con quell\'eroe e ti fornisce consigli pratici per migliorare (es. "Con questo eroe, migliora il tuo GPM" o "Questo eroe non si adatta al tuo stile").'
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
  '/dashboard/coaching': {
    title: 'Coaching & Task',
    description: 'Task personalizzati e raccomandazioni per migliorare le tue performance.',
    sections: [
      {
        title: 'Task personalizzati',
        content: 'Task generati automaticamente basati sulle tue performance. Ogni task ha una priorità (alta, media, bassa) e valori target specifici.'
      },
      {
        title: 'Raccomandazioni generali',
        content: 'Suggerimenti generali per migliorare il tuo gameplay basati sulle tue statistiche.'
      },
      {
        title: 'Come usarlo',
        content: 'Segna i task come completati quando li raggiungi. I task vengono rigenerati periodicamente in base alle tue nuove performance.'
      }
    ]
  },
  '/dashboard/profiling': {
    title: 'Profilazione FZTH',
    description: 'Profilo completo del giocatore con analisi AI-driven, trend e pattern identificati.',
    sections: [
      {
        title: 'FZTH Score',
        content: 'Punteggio complessivo (0-100) che valuta le tue performance globali basato su multiple metriche.'
      },
      {
        title: 'Trend Analysis',
        content: 'Analisi dei trend delle tue performance: confronto tra ultime 5 e ultime 10 partite per GPM, XPM, KDA e winrate.'
      },
      {
        title: 'Phase Analysis',
        content: 'Valutazione delle tue performance nelle diverse fasi di gioco: early game, mid game e late game.'
      },
      {
        title: 'Pattern Identification',
        content: 'Identificazione automatica di pattern nel tuo gameplay (es. "migliori performance in partite lunghe").'
      },
      {
        title: 'Punti di forza e debolezze',
        content: 'Analisi dettagliata dei tuoi punti di forza principali e delle aree che richiedono miglioramento.'
      },
      {
        title: '💡 Lampadine Interattive (Suggerimenti AI)',
        content: 'In molte card e metriche troverai delle piccole lampadine blu interattive. Clicca su una lampadina per ottenere un suggerimento AI personalizzato basato sulla metrica specifica (es. FZTH Score, trend GPM/XPM, stile di gioco, analisi fasi). Il suggerimento analizza i tuoi dati di profilazione e ti fornisce consigli pratici e concreti per migliorare. Ogni lampadina fornisce suggerimenti contestuali basati sulla sezione specifica (es. suggerimenti sul tuo stile di gioco, trend delle performance, analisi comparativa).'
      }
    ]
  },
  '/dashboard/ai-summary': {
    title: 'Riassunto IA',
    description: 'Riassunti intelligenti generati da AI delle tue partite o del tuo profilo completo.',
    sections: [
      {
        title: 'Riassunto Profilo',
        content: 'Genera un riassunto completo del tuo profilo di gioco basato su tutte le tue performance, punti di forza, debolezze e trend.'
      },
      {
        title: 'Riassunto Partita',
        content: 'Seleziona una partita dalla lista e genera un riassunto dettagliato con analisi AI della performance in quella specifica partita.'
      },
      {
        title: 'Come funziona',
        content: 'I riassunti vengono generati usando AI (Gemini o OpenAI) che analizza i tuoi dati e fornisce insights personalizzati.'
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
    description: 'Gestione del tuo profilo e configurazione del Dota 2 Account ID necessario per visualizzare le tue statistiche.',
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
  }
}

