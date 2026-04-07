import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, WifiOff, Lock, EyeOff, DollarSign, Cpu,
  HardDrive, CheckCircle, Cloud, CloudOff, Zap,
  RefreshCw, Download, AlertCircle, ChevronRight
} from 'lucide-react'
import { getStorageStats } from '../lib/storage'
import {
  AVAILABLE_MODELS, initRunAnywhere, activeModel,
  isModelReady, getGenerationProfile, setGenerationProfile,
  type GenerationProfile,
  type ModelInfo
} from '../lib/runanywhere'

const MODEL_KEY = 'sb_model_v4'

function fmtBytes(b: number) {
  if (!b) return '0B'
  if (b < 1048576) return `${(b / 1024).toFixed(1)}KB`
  return `${(b / 1048576).toFixed(1)}MB`
}

export default function PrivacyPage() {
  const [stats, setStats]       = useState({ notes: 0, tasks: 0, memories: 0, storageUsed: 0, storageQuota: 0 })
  const [online, setOnline]     = useState(navigator.onLine)

  // Model switcher state
  const [switching,    setSwitching]    = useState(false)
  const [switchTarget, setSwitchTarget] = useState<string | null>(null)
  const [switchProgress, setSwitchProgress] = useState(0)
  const [switchStage,    setSwitchStage]    = useState('')
  const [switchError,    setSwitchError]    = useState<string | null>(null)
  const [switchDone,     setSwitchDone]     = useState(false)
  const [currentModelId, setCurrentModelId] = useState<string>(
    () => localStorage.getItem(MODEL_KEY) ?? activeModel()?.id ?? AVAILABLE_MODELS[0].id
  )
  const [genProfile, setGenProfile] = useState<GenerationProfile>(() => getGenerationProfile())

  useEffect(() => {
    getStorageStats().then(setStats)
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  async function switchModel(modelId: string) {
    if (modelId === currentModelId || switching) return
    setSwitching(true)
    setSwitchTarget(modelId)
    setSwitchProgress(0)
    setSwitchStage('')
    setSwitchError(null)
    setSwitchDone(false)

    try {
      await initRunAnywhere(modelId, (pct, stage) => {
        setSwitchProgress(pct)
        setSwitchStage(stage)
      })
      localStorage.setItem(MODEL_KEY, modelId)
      setCurrentModelId(modelId)
      setSwitchDone(true)
      setTimeout(() => {
        setSwitching(false)
        setSwitchTarget(null)
        setSwitchDone(false)
        setSwitchError(null)
      }, 2000)
    } catch (e: any) {
      setSwitchError(e?.message ?? 'Failed to load model')
      setSwitching(false)
    }
  }

  function changeProfile(profile: GenerationProfile) {
    setGenProfile(profile)
    setGenerationProfile(profile)
  }

  const GUARANTEES = [
    { icon: WifiOff,    title: 'Zero Network Calls',  desc: 'AI inference via WebAssembly. No HTTP requests to AI APIs.' },
    { icon: Lock,       title: 'No Data Egress',       desc: 'Your notes, memories and chats never leave this device.' },
    { icon: DollarSign, title: '$0 Inference Cost',    desc: 'RunAnywhere runs free on your local hardware. No API fees.' },
    { icon: Cpu,        title: 'On-Device LLM',        desc: 'LlamaCPP WASM + WebGPU acceleration. Runs in your browser.' },
    { icon: EyeOff,     title: 'No Tracking',          desc: 'No analytics, no telemetry, no session recording.' },
    { icon: HardDrive,  title: 'Local Storage Only',   desc: 'IndexedDB + OPFS. All data is yours to export or delete.' },
  ]

  const COMPARE = [
    ['AI Inference Location', 'Your device (WASM)',  'Cloud servers'],
    ['Data Storage',          'Local IndexedDB',      'Remote databases'],
    ['Internet Required',     'Never (after setup)',  'Always'],
    ['API Cost per Query',    '$0.000',               '$0.001–$0.05'],
    ['Response Latency',      '~50–500ms local',      '500ms–3s network'],
    ['Conversations Logged',  'Never',                'Yes (for training)'],
    ['Works Offline',         '✅ Always',            '❌ Never'],
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="relative px-6 py-6 border-b border-border" style={{
        background: 'linear-gradient(135deg,rgba(94,234,212,0.04) 0%,transparent 60%)'
      }}>
        <div className="flex items-start gap-4">
          <motion.div
            animate={{ boxShadow: ['0 0 8px rgba(94,234,212,0.3)','0 0 20px rgba(94,234,212,0.5)','0 0 8px rgba(94,234,212,0.3)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0"
          >
            <Shield size={22} className="text-accent" />
          </motion.div>
          <div className="flex-1">
            <h2 className="text-bright font-bold text-xl mb-1">Privacy & Settings</h2>
            <p className="text-dim text-sm leading-relaxed max-w-lg">
              Every computation runs via <span className="text-accent font-mono">RunAnywhere Web SDK</span> — no cloud, no tracking, no cost.
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
            online ? 'bg-amber/10 border-amber/30 text-amber' : 'bg-accent/10 border-accent/30 text-accent'
          }`}>
            {online ? <Cloud size={11} /> : <CloudOff size={11} />}
            {online ? 'Online (AI still local)' : 'Offline mode'}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── MODEL SWITCHER ───────────────────────────────────────────────── */}
        <div>
          <h3 className="text-bright font-semibold text-sm mb-3 flex items-center gap-2">
            <Zap size={14} className="text-amber" />
            AI Speed Mode
          </h3>
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => changeProfile('instant')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  genProfile === 'instant'
                    ? 'bg-amber/10 border-amber/40'
                    : 'bg-surface/30 border-border hover:border-amber/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-text">Instant</p>
                  <Zap size={12} className="text-amber" />
                </div>
                <p className="text-[11px] text-dim">Fastest replies, shorter outputs.</p>
              </button>

              <button
                onClick={() => changeProfile('balanced')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  genProfile === 'balanced'
                    ? 'bg-accent/10 border-accent/40'
                    : 'bg-surface/30 border-border hover:border-accent/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-text">Balanced</p>
                  <CheckCircle size={12} className="text-accent" />
                </div>
                <p className="text-[11px] text-dim">Better detail, still responsive.</p>
              </button>
            </div>
            <p className="text-[10px] text-dim font-mono mt-3">
              Applies globally to Chat, AI Tutor, Docs, Notes, Tasks, Voice, Writing, and all AI tools.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-bright font-semibold text-sm mb-3 flex items-center gap-2">
            <Cpu size={14} className="text-iris" />
            Switch AI Model
          </h3>
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            {/* Currently loaded */}
            <div className="px-4 py-3 border-b border-border bg-surface/50">
              <p className="text-xs text-dim font-mono mb-0.5">Currently loaded</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <p className="text-sm text-accent font-medium">
                  {AVAILABLE_MODELS.find(m => m.id === currentModelId)?.name ?? currentModelId}
                </p>
              </div>
            </div>

            {/* Model list */}
            <div className="divide-y divide-border">
              {AVAILABLE_MODELS.map(m => {
                const isCurrent  = m.id === currentModelId
                const isTarget   = switchTarget === m.id
                const isLoading  = switching && isTarget

                return (
                  <div key={m.id}
                    className={`px-4 py-3 flex items-center gap-3 transition-all ${
                      isCurrent ? 'bg-accent/5' : 'hover:bg-card/80'
                    }`}
                  >
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isCurrent ? 'bg-accent' : isLoading ? 'bg-iris animate-ping' : 'bg-muted/40'
                    }`} />

                    {/* Model info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${isCurrent ? 'text-accent' : 'text-text'}`}>
                          {m.name}
                        </p>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-semibold uppercase tracking-wide">
                            Active
                          </span>
                        )}
                        {m.id === 'lfm2-1.3b' && !isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-iris/15 text-iris font-semibold uppercase tracking-wide">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-dim mt-0.5">{m.description}</p>
                    </div>

                    {/* Size badge */}
                    <span className="text-[10px] font-mono text-dim flex-shrink-0">
                      ~{m.sizeMB >= 1000 ? `${(m.sizeMB / 1000).toFixed(1)}GB` : `${m.sizeMB}MB`}
                    </span>

                    {/* Switch button */}
                    {!isCurrent && (
                      <button
                        onClick={() => switchModel(m.id)}
                        disabled={switching}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                          isLoading
                            ? 'bg-iris/10 border border-iris/30 text-iris cursor-wait'
                            : 'bg-panel border border-border text-dim hover:border-iris/40 hover:text-iris hover:bg-iris/5 disabled:opacity-40'
                        }`}
                      >
                        {isLoading
                          ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><RefreshCw size={11} /></motion.div> Loading…</>
                          : <><Download size={11} /> Load</>
                        }
                      </button>
                    )}

                    {isCurrent && (
                      <CheckCircle size={14} className="text-accent flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progress bar when switching */}
            <AnimatePresence>
              {switching && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-3 border-t border-border bg-iris/5"
                >
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-iris font-mono">{switchStage || 'Loading…'}</span>
                    <span className="text-iris font-mono font-semibold">{switchProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-iris rounded-full"
                      animate={{ width: `${switchProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  {switchDone && (
                    <p className="text-xs text-accent mt-1.5 flex items-center gap-1">
                      <CheckCircle size={11} /> Model loaded successfully!
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {switchError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 py-3 border-t border-border flex items-start gap-2 text-rose text-xs"
                >
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Failed to load model</p>
                    <p className="opacity-70 mt-0.5">{switchError}</p>
                    <button onClick={() => setSwitchError(null)} className="underline mt-1 hover:opacity-100 opacity-70">Dismiss</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-[10px] text-dim font-mono mt-2">
            Models are cached in browser OPFS — switching a downloaded model takes ~2s, first download takes longer.
          </p>
        </div>

        {/* ── Live stats ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Notes',    value: stats.notes.toString(),         color: 'text-iris'   },
            { label: 'Memories', value: stats.memories.toString(),      color: 'text-amber'  },
            { label: 'Storage',  value: fmtBytes(stats.storageUsed),    color: 'text-rose'   },
            { label: 'Cost',     value: '$0.00',                        color: 'text-accent' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 rounded-2xl bg-card border border-border">
              <p className={`text-[10px] font-mono uppercase tracking-wide mb-1 ${color} opacity-70`}>{label}</p>
              <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-[10px] text-dim mt-0.5">local only</p>
            </div>
          ))}
        </div>

        {/* ── Privacy guarantees ──────────────────────────────────────────── */}
        <div>
          <h3 className="text-bright font-semibold text-sm mb-3">Privacy Guarantees</h3>
          <div className="grid grid-cols-2 gap-3">
            {GUARANTEES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-4 rounded-2xl bg-card border border-border hover:border-accent/20 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm font-medium text-text">{title}</span>
                      <CheckCircle size={11} className="text-accent" />
                    </div>
                    <p className="text-xs text-dim leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Comparison table ─────────────────────────────────────────────── */}
        <div>
          <h3 className="text-bright font-semibold text-sm mb-3">vs Cloud AI</h3>
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs text-dim font-medium">Feature</th>
                  <th className="text-left px-4 py-2.5 text-xs text-accent font-medium">
                    <div className="flex items-center gap-1.5"><div className="live-dot" style={{width:6,height:6}}/>ZeroCloud AI</div>
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs text-dim font-medium">
                    <div className="flex items-center gap-1.5"><Cloud size={10}/>Cloud AI</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([feat, ours, theirs], i) => (
                  <tr key={feat} className={`border-b border-border/40 last:border-0 ${i%2===0?'':'bg-surface/30'}`}>
                    <td className="px-4 py-2.5 text-xs text-dim">{feat}</td>
                    <td className="px-4 py-2.5 text-xs text-accent font-medium">{ours}</td>
                    <td className="px-4 py-2.5 text-xs text-dim">{theirs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-6 py-3">
          {[
            { icon: WifiOff,    text: '100% Offline' },
            { icon: Lock,       text: 'Zero Egress' },
            { icon: DollarSign, text: '$0 Cost' },
            { icon: Zap,        text: 'WASM Speed' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-dim">
              <Icon size={11} className="text-accent" />{text}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
