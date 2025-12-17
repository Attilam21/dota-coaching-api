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
    title: 'Panoramica',
    description: 'Vista d\'insieme delle tue performance recenti con statistiche chiave e trend.',
    sections: [
      {
        title: 'Cosa trovi qui',
        content: 'Statistiche aggregate delle ultime 20 partite: winrate, KDA, GPM/XPM, trend delle performance e link rapidi alle analisi approfondite.'
      },
      {
        title: 'Come usarlo',
        content: 'Usa questa pagina come punto di partenza per monitorare le tue performance generali e accedere rapidamente alle analisi dettagliate.'
      }
    ]
  },
  '/dashboard/performance': {
    title: 'Performance & Stile di Gioco',
    description: 'Analisi dettagliata delle tue performance e identificazione del tuo stile di gioco.',
    sections: [
      {
        title: 'Metriche principali',
        content: 'KDA, GPM, XPM, morti medie e assist. Visualizzazione con grafici radar per confrontare le tue performance.'
      },
      {
        title: 'Stile di gioco',
        content: 'Identificazione automatica del tuo stile (aggressivo, conservativo, bilanciato) basato sulle tue statistiche.'
      },
      {
        title: 'Suggerimenti',
        content: 'Raccomandazioni personalizzate basate sul tuo stile di gioco identificato.'
      }
    ]
  },
  '/dashboard/heroes': {
    title: 'Hero Pool',
    description: 'Panoramica dei tuoi eroi più giocati con statistiche di base.',
    sections: [
      {
        title: 'Cosa trovi',
        content: 'Lista dei tuoi eroi più giocati con winrate, partite giocate e statistiche principali per ogni eroe.'
      }
    ]
  },
  '/dashboard/hero-analysis': {
    title: 'Hero Analysis',
    description: 'Analisi approfondita delle performance per ogni eroe giocato.',
    sections: [
      {
        title: 'Statistiche per eroe',
        content: 'Winrate, KDA, GPM, XPM dettagliati per ogni eroe. Grafici per visualizzare le performance.'
      },
      {
        title: 'Migliori e peggiori eroi',
        content: 'Identificazione automatica dei tuoi eroi più forti e di quelli su cui devi migliorare.'
      }
    ]
  },
  '/dashboard/role-analysis': {
    title: 'Analisi Ruolo',
    description: 'Performance dettagliate per ogni ruolo giocato (Carry, Mid, Offlane, Support).',
    sections: [
      {
        title: 'Performance per ruolo',
        content: 'Statistiche specifiche per ogni ruolo: GPM, KDA, morti, winrate. Identificazione del ruolo preferito.'
      },
      {
        title: 'Raccomandazioni',
        content: 'Suggerimenti specifici per migliorare in ogni ruolo basati sulle tue performance.'
      }
    ]
  },
  '/dashboard/teammates': {
    title: 'Team & Compagni',
    description: 'Statistiche dei giocatori con cui hai giocato più spesso.',
    sections: [
      {
        title: 'Top compagni',
        content: 'Lista dei giocatori con cui hai giocato più spesso, con winrate e numero di partite insieme.'
      },
      {
        title: 'Insights & Sinergie',
        content: 'Analisi delle sinergie migliori e peggiori, identificazione dei compagni con cui hai il winrate più alto.'
      }
    ]
  },
  '/dashboard/matches': {
    title: 'Partite',
    description: 'Lista delle tue ultime 20 partite con accesso rapido all\'analisi dettagliata.',
    sections: [
      {
        title: 'Cosa puoi fare',
        content: 'Visualizza tutte le tue partite recenti. Clicca su una partita per vedere l\'analisi dettagliata completa.'
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
      }
    ]
  },
  '/dashboard/settings': {
    title: 'Profilo Utente',
    description: 'Gestione del tuo profilo e configurazione del Dota 2 Account ID.',
    sections: [
      {
        title: 'Dota 2 Account ID',
        content: 'Configura qui il tuo Dota 2 Account ID. Una volta salvato, verrà utilizzato automaticamente in tutte le sezioni del dashboard.'
      },
      {
        title: 'Importante',
        content: 'Il Player ID salvato qui viene utilizzato in tutte le analisi. Assicurati che sia corretto per ottenere dati accurati.'
      }
    ]
  }
}

