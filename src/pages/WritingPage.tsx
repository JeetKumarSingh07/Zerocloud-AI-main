import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PenLine, Sparkles, Copy, CheckCheck, Trash2,
  Mail, FileText, Lightbulb, Code, RefreshCw,
  StopCircle, Wand2, CheckSquare, AlignLeft,
  ArrowRight, Zap
} from 'lucide-react'
import { generateText, cancelGeneration, isModelReady } from '../lib/runanywhere'

const MODES = [
  { id:'email',    icon:Mail,        label:'Email',            color:'text-iris',   bg:'bg-iris/10 border-iris/25'    },
  { id:'essay',    icon:FileText,    label:'Essay / Article',  color:'text-accent', bg:'bg-accent/10 border-accent/25'},
  { id:'creative', icon:PenLine,     label:'Creative Writing', color:'text-amber',  bg:'bg-amber/10 border-amber/25'  },
  { id:'ideas',    icon:Lightbulb,   label:'Brainstorm Ideas', color:'text-rose',   bg:'bg-rose/10 border-rose/25'    },
  { id:'rewrite',  icon:RefreshCw,   label:'Rewrite / Improve',color:'text-iris',   bg:'bg-iris/10 border-iris/25'    },
  { id:'summarize',icon:AlignLeft,   label:'Summarize',        color:'text-accent', bg:'bg-accent/10 border-accent/25'},
  { id:'grammar',  icon:CheckSquare, label:'Grammar Check',    color:'text-amber',  bg:'bg-amber/10 border-amber/25'  },
  { id:'code_docs',icon:Code,        label:'Code Docs',        color:'text-soft',   bg:'bg-muted/10 border-muted/25'  },
]

const QUICK_PROMPTS: Record<string, string[]> = {
  email:     ['Follow-up after meeting', 'Job application', 'Thank you email', 'Project update'],
  essay:     ['Why offline AI matters', 'Benefits of data privacy', 'Future of local AI', 'Impact of technology'],
  creative:  ['Story about a robot', 'Poem about technology', 'Sci-fi opening scene', 'Product tagline'],
  ideas:     ['Productivity app features', 'Privacy improvements', 'Hackathon ideas', 'App monetization'],
  rewrite:   ['Make this more professional', 'Make this shorter', 'Make this friendlier', 'Make this stronger'],
  summarize: ['Summarize in 3 bullet points', 'One sentence summary', 'Key takeaways', 'Executive summary'],
  grammar:   ['Fix grammar errors', 'Improve punctuation', 'Check spelling', 'Fix sentence structure'],
  code_docs: ['Document useState hook', 'Explain async/await', 'Write API docs', 'README introduction'],
}

const PROMPTS: Record<string, (input: string, tone: string) => string> = {
  email:     (i,t) => `Write a ${t} email about: ${i}. Include Subject:, greeting, body, sign-off.`,
  essay:     (i,t) => `Write a ${t} essay/article about: ${i}. Use clear paragraphs.`,
  creative:  (i,t) => `Write a creative piece: ${i}. Be vivid and engaging.`,
  ideas:     (i,t) => `Generate 5 practical ideas for: ${i}. Number each with a brief explanation.`,
  rewrite:   (i,t) => `Rewrite this text to be ${t} and clearer:\n\n${i}`,
  summarize: (i,t) => `Summarize this text concisely:\n\n${i}`,
  grammar:   (i,t) => `Fix all grammar, spelling and punctuation errors. Return only the corrected text:\n\n${i}`,
  code_docs: (i,t) => `Write clear technical documentation for: ${i}. Be precise and developer-friendly.`,
}

const TONES = ['professional','friendly','casual','formal','persuasive','concise']

export default function WritingPage() {
  const [mode,       setMode]       = useState(MODES[0].id)
  const [userInput,  setUserInput]  = useState('')
  const [output,     setOutput]     = useState('')
  const [streaming,  setStreaming]  = useState(false)
  const [streamText, setStreamText] = useState('')
  const [copied,     setCopied]     = useState(false)
  const [tone,       setTone]       = useState('professional')
  const [wordCount,  setWordCount]  = useState(0)
  const abortRef  = useRef<AbortController | null>(null)
  const streamRef = useRef('')
  const currentMode = MODES.find(m => m.id === mode)!

  function stop() { abortRef.current?.abort(); cancelGeneration() }

  async function generate() {
    const trimmed = userInput.trim()
    if (!trimmed) return
    if (!isModelReady()) { alert('Model not loaded — complete setup first.'); return }
    setStreaming(true); setOutput(''); setStreamText(''); streamRef.current = ''
    abortRef.current = new AbortController()
    try {
      const prompt = PROMPTS[mode]?.(trimmed, tone) ?? `Write about: ${trimmed}`
      const result = await generateText(prompt, {
        maxTokens: mode === 'grammar' || mode === 'rewrite' || mode === 'summarize' ? 72 : 60,
        temperature: mode === 'creative' ? 0.5 : 0,
        timeoutMs: 6500,
        signal: abortRef.current.signal,
        onToken: (_, acc) => { streamRef.current = acc; setStreamText(acc) },
      })
      setOutput(result || streamRef.current)
      setWordCount((result || streamRef.current).split(/\s+/).filter(Boolean).length)
    } catch (e: any) {
      if (!abortRef.current?.signal.aborted) setOutput(`⚠️ ${e?.message}`)
      else if (streamRef.current.trim()) { setOutput(streamRef.current.trim()); setWordCount(streamRef.current.split(/\s+/).filter(Boolean).length) }
    } finally { setStreaming(false); setStreamText(''); abortRef.current = null }
  }

  async function copyOut() {
    await navigator.clipboard.writeText(output)
    setCopied(true); setTimeout(()=>setCopied(false), 2000)
  }

  const displayText = streaming ? streamText : output

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
            <PenLine size={14} className="text-accent"/>
          </div>
          <div>
            <p className="text-bright font-semibold text-sm">Writing Assistant</p>
            <p className="text-[10px] text-dim font-mono">8 modes · Tone control · Local AI</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/8 border border-accent/20">
          <Zap size={9} className="text-accent"/>
          <span className="text-[10px] text-accent font-mono">OFFLINE</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-48 flex-shrink-0 border-r border-border flex flex-col overflow-y-auto bg-surface/30">
          <div className="p-3 space-y-4">
            <div>
              <p className="section-label mb-2">Mode</p>
              <div className="space-y-1">
                {MODES.map(m => {
                  const Icon = m.icon
                  return (
                    <button key={m.id} onClick={()=>setMode(m.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        mode===m.id ? `${m.bg} ${m.color}` : 'text-dim hover:text-bright hover:bg-card border border-transparent'
                      }`}>
                      <Icon size={12}/>{m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="section-label mb-2">Tone</p>
              <div className="flex flex-wrap gap-1">
                {TONES.map(t=>(
                  <button key={t} onClick={()=>setTone(t)}
                    className={`px-2 py-1 rounded-md text-[10px] border capitalize transition-all ${
                      tone===t ? 'bg-iris/10 border-iris/30 text-iris' : 'border-border text-dim hover:border-muted hover:text-bright'
                    }`}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="section-label mb-2">Quick Start</p>
              <div className="space-y-1">
                {QUICK_PROMPTS[mode]?.map(p=>(
                  <button key={p} onClick={()=>setUserInput(p)}
                    className="w-full text-left text-[10px] px-2.5 py-2 rounded-lg bg-card border border-border hover:border-muted text-dim hover:text-bright transition-all leading-snug">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className={`flex items-center gap-2 mb-2 ${currentMode.color}`}>
              <currentMode.icon size={13}/>
              <span className="text-xs font-semibold uppercase tracking-wide">{currentMode.label}</span>
            </div>
            <textarea value={userInput} onChange={e=>setUserInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&e.ctrlKey)generate()}}
              placeholder={
                mode==='grammar'   ? 'Paste text to check grammar…' :
                mode==='rewrite'   ? 'Paste text to improve / rewrite…' :
                mode==='summarize' ? 'Paste long text to summarize…' :
                `Describe what you want to ${currentMode.label.toLowerCase()}… (Ctrl+Enter)`
              }
              className="input resize-none w-full text-sm" rows={4} disabled={streaming}/>
            <div className="flex items-center gap-2 mt-2">
              {streaming ? (
                <button onClick={stop} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-rose/15 border border-rose/40 text-rose transition-all">
                  <StopCircle size={14}/> Stop
                </button>
              ) : (
                <button onClick={generate} disabled={!userInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-void text-sm font-bold hover:bg-accent/90 disabled:opacity-40 transition-all">
                  <Wand2 size={14}/> Generate
                </button>
              )}
              {output && !streaming && (
                <>
                  <button onClick={copyOut} className="btn-ghost text-xs">
                    {copied ? <CheckCheck size={12} className="text-accent"/> : <Copy size={12}/>}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={()=>{setOutput('');setUserInput('')}} className="btn-ghost text-xs">
                    <Trash2 size={12}/> Clear
                  </button>
                </>
              )}
              {output && !streaming && <span className="text-[10px] text-dim font-mono ml-auto">{wordCount} words</span>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!displayText && !streaming ? (
              <div className="flex flex-col items-center justify-center h-full text-dim gap-3">
                <motion.div animate={{y:[0,-5,0]}} transition={{duration:3,repeat:Infinity}}
                  className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center">
                  <PenLine size={22} className="opacity-30"/>
                </motion.div>
                <p className="text-sm">Your generated content appears here</p>
                <p className="text-xs text-center max-w-xs opacity-60">Pick a mode, describe what you need, and click Generate.</p>
              </div>
            ) : (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                {output && !streaming && (
                  <div className={`flex items-center gap-1.5 text-xs font-medium mb-3 ${currentMode.color}`}>
                    <Sparkles size={11}/> AI Generated · {currentMode.label} · {tone}
                  </div>
                )}
                <div className="p-4 rounded-2xl bg-card border border-border text-sm text-bright leading-relaxed whitespace-pre-wrap min-h-[100px]">
                  {displayText}{streaming && <span className="ai-cursor"/>}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
