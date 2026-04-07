import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Download, CheckCircle, WifiOff, Shield, AlertCircle, RefreshCw, Play, Lock, Sparkles, Cpu } from 'lucide-react'
import { AVAILABLE_MODELS, initRunAnywhere, detectWebGPU } from '../lib/runanywhere'

const MODEL_KEY = 'sb_model_v4'
interface Props { onReady: (modelId: string) => void }

export default function SetupScreen({ onReady }: Props) {
  const [selected,  setSelected]  = useState<string|null>(null)
  const [started,   setStarted]   = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [stage,     setStage]     = useState('')
  const [error,     setError]     = useState<string|null>(null)
  const [done,      setDone]      = useState(false)
  const [saved,     setSaved]     = useState<string|null>(null)
  const [hasWebGPU, setHasWebGPU] = useState<boolean|null>(null)

  useEffect(() => {
    ;['sb_setup_v2','sb_setup_v1','ra_setup_done','sb_model_id','sb_model_id_v3'].forEach(k=>localStorage.removeItem(k))
    const s = localStorage.getItem(MODEL_KEY)
    if (s && AVAILABLE_MODELS.find(m=>m.id===s)) { setSaved(s); setSelected(s) }
    detectWebGPU().then(v => setHasWebGPU(v))
  }, [])

  async function launch(id: string) {
    setStarted(true); setError(null); setProgress(0); setDone(false); setSelected(id)
    try {
      await initRunAnywhere(id, (pct, msg) => { setProgress(pct); setStage(msg) })
      setDone(true)
      setTimeout(() => onReady(id), 500)
    } catch(e:any) {
      setError(e?.message ?? 'Setup failed')
      setStarted(false); setProgress(0)
    }
  }

  const savedInfo = saved ? AVAILABLE_MODELS.find(m=>m.id===saved) : null
  const steps = [
    { label:'Initialize RunAnywhere SDK',     at:15  },
    { label:'Register LlamaCPP WASM backend', at:30  },
    { label:'Download / verify model (OPFS)', at:88  },
    { label:'Load model into WASM engine',    at:100 },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 60%), #090e1a' }}>

      {/* Animated grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:'linear-gradient(rgba(99,102,241,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.07) 1px,transparent 1px)', backgroundSize:'60px 60px', opacity:0.8 }} />

      {/* Glow orbs */}
      <motion.div animate={{ scale:[1,1.2,1], opacity:[0.3,0.5,0.3] }} transition={{ duration:6, repeat:Infinity }}
        className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(99,102,241,0.18),transparent)', filter:'blur(60px)' }} />
      <motion.div animate={{ scale:[1,1.15,1], opacity:[0.2,0.4,0.2] }} transition={{ duration:8, repeat:Infinity, delay:2 }}
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(52,211,153,0.12),transparent)', filter:'blur(50px)' }} />

      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
        className="relative z-10 w-full max-w-md">

        {/* Hero */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ boxShadow:['0 0 20px rgba(99,102,241,0.5)','0 0 50px rgba(99,102,241,0.85)','0 0 20px rgba(99,102,241,0.5)'] }}
            transition={{ duration:2.5, repeat:Infinity }}
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background:'linear-gradient(135deg,#6366f1,#4338ca)' }}>
            <Zap size={42} className="text-white" />
          </motion.div>
          <h1 className="text-5xl font-bold tracking-tight mb-3" style={{ color:'#f8fafc' }}>
            Zero<span className="gradient-text">Cloud</span> AI
          </h1>
          <p className="font-mono text-sm" style={{ color:'#64748b' }}>Offline AI Productivity Suite · RunAnywhere SDK</p>
        </div>

        {/* Badges */}
        <div className="flex justify-center flex-wrap gap-2 mb-6">
          {[
            { icon:WifiOff, label:'100% Offline',    color:'#34d399', bg:'rgba(52,211,153,0.12)',  border:'rgba(52,211,153,0.25)'  },
            { icon:Lock,    label:'Zero Data Egress', color:'#818cf8', bg:'rgba(99,102,241,0.12)', border:'rgba(99,102,241,0.25)'  },
            { icon:Shield,  label:'$0 API Cost',      color:'#fbbf24', bg:'rgba(251,191,36,0.12)', border:'rgba(251,191,36,0.25)'  },
            ...(hasWebGPU === true ? [{ icon:Zap, label:'WebGPU ⚡', color:'#f97316', bg:'rgba(249,115,22,0.12)', border:'rgba(249,115,22,0.25)' }] : []),
          ].map(({ icon:Icon, label, color, bg, border }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background:bg, border:`1px solid ${border}` }}>
              <Icon size={11} style={{ color }} />
              <span className="text-[11px] font-semibold" style={{ color }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6" style={{ background:'rgba(13,20,40,0.95)', border:'1px solid rgba(99,102,241,0.25)', backdropFilter:'blur(24px)' }}>
          <AnimatePresence mode="wait">
            {!started ? (
              <motion.div key="pick" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                {savedInfo && (
                  <div className="mb-4 p-4 rounded-2xl" style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)' }}>
                    <p className="text-[10px] font-mono uppercase tracking-wide mb-2" style={{ color:'#64748b' }}>Previously used</p>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color:'#c7d2fe' }}>{savedInfo.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color:'#64748b' }}>{savedInfo.description}</p>
                      </div>
                      <button onClick={() => launch(savedInfo.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white flex-shrink-0"
                        style={{ background:'#6366f1' }}>
                        <Play size={12} /> Continue
                      </button>
                    </div>
                  </div>
                )}

                <h2 className="font-bold text-sm mb-3" style={{ color:'#f1f5f9' }}>
                  {savedInfo ? 'Or choose a different model:' : 'Choose your AI model'}
                </h2>

                <div className="space-y-2 mb-4">
                  {AVAILABLE_MODELS.map(m => {
                    const isSel = selected === m.id
                    return (
                      <button key={m.id} onClick={() => setSelected(isSel ? null : m.id)}
                        className="w-full text-left px-4 py-3 rounded-2xl border transition-all"
                        style={{
                          background: isSel ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                          borderColor: isSel ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.09)',
                          color: isSel ? '#c7d2fe' : '#cbd5e1'
                        }}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{m.name}</span>
                            {m.badge && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
                                style={{ background: isSel ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)', color: isSel ? '#c7d2fe' : '#94a3b8' }}>
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono" style={{ color:'#64748b' }}>
                            ~{m.sizeMB>=1000?`${(m.sizeMB/1000).toFixed(1)}GB`:`${m.sizeMB}MB`}
                          </span>
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color:'#64748b' }}>{m.description}</p>
                      </button>
                    )
                  })}
                </div>

                {error && (
                  <div className="mb-3 flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#fca5a5' }}>
                    <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                    <div><p className="font-semibold">Error</p><p className="opacity-80 mt-0.5">{error}</p></div>
                  </div>
                )}

                <button onClick={() => selected && launch(selected)} disabled={!selected}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
                  style={{ background: selected ? '#6366f1' : 'rgba(255,255,255,0.06)', opacity: selected ? 1 : 0.5, cursor: selected ? 'pointer' : 'not-allowed' }}>
                  {error ? <RefreshCw size={14}/> : <Download size={14}/>}
                  {!selected ? 'Select a model above' : error ? 'Retry' : `Load ${AVAILABLE_MODELS.find(m=>m.id===selected)?.name ?? 'Model'}`}
                </button>

                <p className="text-center text-[10px] mt-3 font-mono" style={{ color:'#334155' }}>
                  Cached in OPFS · downloaded once · reloads in ~2s
                </p>
              </motion.div>
            ) : (
              <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                <div className="flex items-center gap-3 mb-5">
                  {done
                    ? <CheckCircle size={26} style={{ color:'#34d399' }} />
                    : <motion.div animate={{ rotate:360 }} transition={{ duration:1.5, repeat:Infinity, ease:'linear' }}>
                        <Sparkles size={26} style={{ color:'#818cf8' }} />
                      </motion.div>
                  }
                  <div>
                    <h2 className="font-bold text-base" style={{ color:'#f8fafc' }}>{done?'🎉 Ready to go!':'Loading AI model…'}</h2>
                    <p className="text-xs mt-0.5 font-mono" style={{ color:'#64748b' }}>{stage}</p>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full overflow-hidden mb-1.5" style={{ background:'rgba(255,255,255,0.08)' }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background:'linear-gradient(90deg,#6366f1,#818cf8)' }}
                    animate={{ width:`${progress}%` }} transition={{ duration:0.3 }} />
                </div>
                <div className="flex justify-between text-xs mb-5" style={{ color:'#475569' }}>
                  <span className="font-mono">RunAnywhere WASM</span>
                  <span className="font-mono" style={{ color:'#818cf8' }}>{progress}%</span>
                </div>

                <div className="space-y-2.5">
                  {steps.map(s => (
                    <div key={s.label} className="flex items-center gap-2.5 text-xs transition-all"
                      style={{ color: progress>=s.at ? '#e2e8f0' : '#475569' }}>
                      {progress>=s.at
                        ? <CheckCircle size={13} style={{ color:'#34d399', flexShrink:0 }} />
                        : <div className="w-3 h-3 rounded-full border flex-shrink-0"
                            style={{ borderColor: progress>s.at-20 ? '#818cf8' : '#1e3050' }} />
                      }
                      {s.label}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] mt-4 font-mono" style={{ color:'#334155' }}>
          Powered by{' '}
          <a href="https://docs.runanywhere.ai" target="_blank" rel="noopener noreferrer" style={{ color:'#818cf8' }}>
            RunAnywhere Web SDK
          </a>
          {' '}· LlamaCPP WASM · GGUF models
        </p>
      </motion.div>
    </div>
  )
}
