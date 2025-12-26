'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import OnboardingTour from '@/components/OnboardingTour'
import { 
  BookOpen, 
  Play, 
  HelpCircle, 
  Target, 
  Zap, 
  BarChart,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  Image as ImageIcon,
  PlayCircle,
  Settings
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function GuidaUtentePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const quickGuides = [
    {
      title: 'Inizia da qui',
      description: 'Configura il tuo Dota 2 Account ID nelle Impostazioni per iniziare a vedere le tue statistiche.',
      icon: Target,
      href: '/dashboard/settings',
      color: 'bg-blue-900/30 border-blue-700',
    },
    {
      title: 'Panoramica Dashboard',
      description: 'Dashboard principale con Hero Pool (Top 6), Partite Chiave, Benchmark, Attività Recente e Azioni Rapide per accesso veloce alle analisi.',
      icon: BarChart,
      href: '/dashboard',
      color: 'bg-green-900/30 border-green-700',
    },
    {
      title: 'Storico Partite',
      description: 'Visualizza tutte le tue partite con Overview (statistiche e trend), Lista (filtri e ricerca), e Insights (pattern e raccomandazioni).',
      icon: Zap,
      href: '/dashboard/matches',
      color: 'bg-yellow-900/30 border-yellow-700',
    },
    {
      title: 'Help in ogni pagina',
      description: 'Clicca il pulsante Help in alto a sinistra in qualsiasi pagina per vedere una guida specifica.',
      icon: HelpCircle,
      href: null,
      color: 'bg-purple-900/30 border-purple-700',
    },
    {
      title: 'Aggiornamento Automatico Dati',
      description: 'Il bottone rosso "Aggiorna" al centro della dashboard aggiorna automaticamente i tuoi dati. Il sistema rileva nuove partite e ti notifica quando disponibili.',
      icon: RefreshCw,
      href: '/dashboard',
      color: 'bg-red-900/30 border-red-700',
    },
    {
      title: 'Personalizzazione Dashboard',
      description: 'Personalizza lo sfondo del dashboard. Scegli tra diversi sfondi disponibili nelle impostazioni.',
      icon: Settings,
      href: '/dashboard/settings',
      color: 'bg-pink-900/30 border-pink-700',
    },
  ]

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
            <BookOpen className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Guida Utente</h1>
            <p className="text-gray-400 mt-1">Scopri come usare PRO DOTA ANALISI - AttilaLAB</p>
          </div>
        </div>
      </div>

      {/* Tour Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 bg-gradient-to-r from-red-900/30 to-purple-900/30 border border-red-700 rounded-lg p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 text-red-400" />
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Tour Guidato Interattivo</h2>
              <p className="text-gray-300 text-sm">
                Fai un tour completo della piattaforma con una guida passo-passo che ti mostra tutte le funzionalità principali.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Play className="w-5 h-5" />
            Avvia Tour
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle className="w-4 h-4" />
            <span>Disponibile sempre</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Guides */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Guide Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickGuides.map((guide, index) => (
            <motion.div
              key={guide.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${guide.color} border rounded-lg p-5`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-800/50 rounded-lg">
                  <guide.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{guide.title}</h3>
                  <p className="text-gray-300 text-sm mb-3">{guide.description}</p>
                  {guide.href && (
                    <a
                      href={guide.href}
                      className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Vai alla sezione
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Sezioni Principali</h2>
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-red-400 mb-2">🔄 Aggiornamento Automatico Dati</h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                <strong>Bottone Aggiorna:</strong> Il bottone rosso "Aggiorna" al centro della dashboard ti permette di aggiornare manualmente i tuoi dati in qualsiasi momento. 
                Clicca per forzare un refresh completo delle statistiche.
              </p>
              <p>
                <strong>Aggiornamento Automatico:</strong> Il sistema controlla automaticamente ogni 20 minuti se ci sono nuove partite disponibili. 
                Quando rileva una nuova partita, vedrai un badge verde "Nuova partita!" accanto al bottone.
              </p>
              <p>
                <strong>Background Sync:</strong> Quando torni sulla pagina dopo essere stato via, il sistema controlla automaticamente se ci sono aggiornamenti disponibili 
                e aggiorna i dati in background senza interrompere la tua navigazione.
              </p>
              <p>
                <strong>Timestamp:</strong> Accanto al bottone vedrai quando è stato fatto l'ultimo aggiornamento (es. "Aggiornato 5 minuti fa") 
                per sapere sempre quanto sono aggiornati i tuoi dati.
              </p>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">📊 Statistiche Giocatore</h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                <strong>Panoramica:</strong> Dashboard principale con Hero Pool (Top 6 eroi più giocati), Partite Chiave (migliore, peggiore, outlier), 
                Benchmark (percentili GPM, XPM, KDA), Attività Recente (ultime 5 partite) e Azioni Rapide per accesso veloce alle analisi.
              </p>
              <p>
                <strong>Performance & Stile:</strong> Analisi approfondita con Focus Areas (3 aree prioritarie per il miglioramento identificate automaticamente), 
                metriche di performance, stile di gioco e raccomandazioni personalizzate basate sui tuoi dati.
              </p>
              <p>
                <strong>Il Mio Pool:</strong> Analisi completa del tuo hero pool con tab "Pool Analysis" (diversità, copertura ruoli, specializzazione, raccomandazioni) 
                e "Statistiche" (visualizzazione grid/table con sorting per winrate, partite, KDA). Identifica i tuoi eroi migliori e le aree di miglioramento.
              </p>
              <p>
                <strong>Matchup & Counter:</strong> Analisi matchup e counter picks per decisioni draft. Tab "Matchup" con winrate vs altri eroi, 
                "Performance Trend" per vedere l'evoluzione nel tempo, e "Dettagli Eroe" con statistiche complete. Ideale per preparare draft e pick/ban.
              </p>
              <p>
                <strong>Analisi Ruolo:</strong> Performance per ruolo con Overview (ruolo preferito, confidenza, summary cards, confronto ruoli), 
                "Miglioramento Ruolo" (metriche specifiche, punti di forza/debolezza, raccomandazioni) e "Trend Ruolo" (performance storica per ruolo).
              </p>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-green-400 mb-2">👥 I Tuoi Compagni</h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                Analizza le sinergie con i tuoi compagni di squadra più frequenti. Per ogni compagno vedi:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Winrate insieme e numero di partite giocate</li>
                <li>Ruoli preferiti e combinazioni più efficaci</li>
                <li>Performance aggregate quando giocate insieme</li>
                <li>Raccomandazioni per migliorare la coordinazione e le sinergie</li>
              </ul>
              <p>
                Identifica i compagni con cui hai più successo e quelli con cui potresti migliorare la comunicazione.
              </p>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">🎮 Storico Partite</h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                <strong>Overview:</strong> Statistiche aggregate (winrate, KDA medio, GPM/XPM), trend performance con grafici delle ultime partite, 
                distribuzione risultati e performance per eroe/ruolo.
              </p>
              <p>
                <strong>Lista:</strong> Visualizza tutte le tue partite in formato compatto con filtri per risultato (Win/Loss), eroe e ruolo. 
                Ogni card mostra eroe, risultato, KDA, durata e link diretto all'analisi dettagliata. Puoi anche cercare direttamente un Match ID.
              </p>
              <p>
                <strong>Insights:</strong> Pattern identificati automaticamente (es. "Vinci di più con eroi X", "Perdi quando Y"), 
                raccomandazioni basate sui pattern e confronto dettagliato Win vs Loss per identificare cosa fai meglio nelle vittorie.
              </p>
              <p>
                <strong>Analisi Dettagliata:</strong> Clicca su una partita per analisi completa con tabs per Overview (statistiche generali), 
                Fasi di Gioco (early/mid/late), Item Timing (timeline acquisti) e Teamfight (contributo ai fight).
              </p>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">📚 Coaching & Insights</h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                <strong>Overview:</strong> Profilo completo con ruolo preferito, playstyle identificato, FZTH Score (metrica composita di performance), 
                trend delle metriche chiave, punti di forza e debolezze identificati automaticamente, e top eroi per ruolo.
              </p>
              <p>
                <strong>Confronto Meta:</strong> Confronto delle tue metriche con i percentili della community (GPM, XPM, KDA, ecc.) per vedere come ti posizioni rispetto agli altri giocatori. 
                Insights AI che identificano aree di miglioramento specifiche e gap rispetto al meta.
              </p>
              <p>
                <strong>Win Conditions:</strong> Pattern di vittoria identificati automaticamente analizzando le tue partite vincenti. 
                Mostra cosa fai diversamente quando vinci (es. "Vinci quando hai più farm", "Vinci quando giochi eroi X"). 
                Confronto dettagliato tra partite vinte e perse.
              </p>
              <p>
                <strong>Raccomandazioni:</strong> Suggerimenti personalizzati per il miglioramento basati su tutte le analisi. 
                Priorità automatiche e roadmap di miglioramento con focus sulle aree più impattanti.
              </p>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">🔮 Analisi Predittive</h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                <strong>Overview Predittive:</strong> Analizza tutte le tue partite per identificare pattern e creare proiezioni future. 
                Impact Score (0-100) che misura quanto impatto avrebbero i tuoi miglioramenti, errori più comuni identificati automaticamente, 
                winrate previsto se segui i consigli, e accesso rapido a Path to Improvement e What-If Analysis.
              </p>
              <p>
                <strong>Path to Improvement:</strong> Percorso step-by-step personalizzato per raggiungere i tuoi obiettivi. 
                Ogni step mostra: valore attuale vs target, gap da colmare, impatto previsto sul winrate, priorità, azioni concrete e stima partite necessarie. 
                Confronto con meta per il tuo ruolo e proiezione del risultato finale (winrate, MMR gain, timeframe).
              </p>
              <p>
                <strong>What-If Analysis:</strong> Simula cosa succede se migliori metriche specifiche (GPM, morti, KDA, teamfight). 
                Vedi l'impatto previsto di ogni miglioramento sul winrate e MMR. Scenario con maggior impatto evidenziato, 
                impatto combinato se migliori tutto insieme, e livello di confidenza per ogni proiezione.
              </p>
              <p>
                <strong>Come Usarli:</strong> Inizia dall'Overview per vedere i tuoi errori più comuni e l'Impact Score. 
                Usa Path to Improvement per un percorso strutturato step-by-step. Usa What-If Analysis per simulare miglioramenti specifici 
                e vedere quale ha il massimo impatto. Questi strumenti ti aiutano a prendere decisioni informate su dove concentrare i tuoi sforzi.
              </p>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-orange-400 mb-2">🔬 Analisi Tecniche</h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                <strong>Analisi Avanzate:</strong> Metriche dettagliate divise in 4 categorie:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Lane & Early Game:</strong> CS, XP, lane winrate, first blood involvement, early game impact</li>
                <li><strong>Farm & Economy:</strong> GPM, XPM, efficienza farm, dead gold, item timing, gold lead</li>
                <li><strong>Fights & Damage:</strong> Kill participation, damage share, teamfight impact, survivability</li>
                <li><strong>Vision & Map Control:</strong> Ward placement, map control, vision efficiency</li>
              </ul>
              <p>
                <strong>Build & Items:</strong> Analisi dei tuoi build preferiti, item timing, efficienza degli acquisti e raccomandazioni per ottimizzare i tuoi build.
              </p>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-red-400 mb-2">🛡️ Anti-Tilt & Benessere</h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                <strong>Anti-Tilt:</strong> Strumenti e strategie per gestire tilt e frustrazione durante le partite. 
                Analisi dei pattern di tilt, consigli per mantenere la calma e migliorare la mentalità di gioco.
              </p>
              <p>
                <strong>Giochi Anti-Tilt:</strong> Mini-giochi e attività per distrarsi e rilassarsi tra le partite. 
                Utile per mantenere un approccio positivo e ridurre lo stress legato alle perdite.
              </p>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-pink-400 mb-2">🎨 Personalizzazione Dashboard</h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                <strong>Sfondo Personalizzato:</strong> Puoi personalizzare lo sfondo del dashboard scegliendo tra diverse opzioni disponibili. 
                Vai su <strong>Dashboard → Impostazioni → Sfondo Dashboard</strong> per vedere tutte le opzioni disponibili.
              </p>
              <p>
                <strong>Come Cambiare Sfondo:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Vai su <strong>Impostazioni</strong> (icona ingranaggio nella sidebar)</li>
                <li>Scorri fino alla sezione <strong>"Sfondo Dashboard"</strong></li>
                <li>Vedrai le anteprime di tutti gli sfondi disponibili</li>
                <li>Clicca sullo sfondo che preferisci</li>
                <li>La modifica viene applicata immediatamente senza bisogno di ricaricare la pagina</li>
              </ul>
              <p>
                <strong>Sfondi Disponibili:</strong> Attualmente puoi scegliere tra:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Dashboard JPG</strong> - Sfondo principale dashboard (formato JPG)</li>
                <li><strong>Profile JPG</strong> - Sfondo pagina profilazione (formato JPG)</li>
                <li><strong>Nessuno</strong> - Rimuove lo sfondo per un look più pulito</li>
              </ul>
              <p>
                <strong>Nota:</strong> Gli sfondi disponibili vengono rilevati automaticamente. Se non vedi un'opzione, significa che il file corrispondente non è disponibile.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lampadine Interattive Section */}
      <div className="mb-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-600/30 rounded-lg">
            <Zap className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">💡 Lampadine Interattive - Suggerimenti AI</h3>
            <p className="text-gray-300 text-sm">Consigli personalizzati generati da AI in tempo reale</p>
          </div>
        </div>
        
        <div className="space-y-3 text-gray-300 text-sm">
          <p className="mb-3">
            In molte card statistiche e metriche troverai delle <strong className="text-blue-400">piccole lampadine blu interattive</strong> (icona 💡) posizionate negli angoli delle card.
          </p>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-white mb-2">Come funzionano:</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span><strong>Clicca</strong> su una lampadina per ottenere un suggerimento personalizzato</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Il suggerimento viene <strong>generato in tempo reale</strong> da AI analizzando i tuoi dati specifici</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Ogni suggerimento è <strong>contestuale</strong>: analizza la metrica specifica (es. trend winrate, performance eroe, ruolo) e ti dà consigli pratici</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>I suggerimenti sono <strong>personalizzati</strong> basati sulle tue performance reali, non generici</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mt-3">
            <p className="text-yellow-200 text-xs">
              <strong>Nota:</strong> Questa funzionalità utilizza l'intelligenza artificiale per generare consigli personalizzati. Se il servizio non è disponibile, vedrai un messaggio informativo.
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-3">💡 Consigli Utili</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>Usa il pulsante <strong>Help</strong> in ogni pagina per vedere una guida specifica</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>Configura il tuo Dota 2 Account ID nelle Impostazioni prima di iniziare</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>Le analisi sono basate sulle tue ultime 20 partite (i trend confrontano le ultime 5 e 10)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>Puoi riprendere questo tour in qualsiasi momento</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span><strong>Clicca sulle lampadine blu</strong> nelle card statistiche per ottenere suggerimenti AI personalizzati</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <span>Usa il <strong>bottone rosso "Aggiorna"</strong> al centro della dashboard per aggiornare manualmente i dati. Il sistema controlla automaticamente nuove partite ogni 20 minuti.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
            <span><strong>Personalizza lo sfondo</strong> del dashboard nelle Impostazioni. Scegli tra diversi sfondi disponibili e vedi l'anteprima prima di applicare.</span>
          </li>
        </ul>
      </div>

      {/* Tour Component */}
      {showTour && (
        <OnboardingTour
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  )
}

