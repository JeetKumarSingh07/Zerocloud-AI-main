import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, ChevronRight, ChevronLeft, CheckCircle, XCircle, RefreshCw, Trophy, BookOpen, Target, Loader } from 'lucide-react'
import { generateText, isModelReady } from '../lib/runanywhere'

interface Card { q: string; a: string }
interface Lecture {
  overview: string
  objectives: string[]
  keyPoints: string[]
  recap: string
}

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

const DIFFICULTIES: { id: DifficultyLevel; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

const HINTS = ['World War 2','Python basics','Newton laws','French Revolution','Machine Learning','Solar System','DNA','Climate Change']

// Parse whatever the model gives us into Q/A pairs
function parseCards(raw: string): Card[] {
  const cards: Card[] = []
  const lines = raw.split('\n').map(l => l.replace(/^[\d\.\-\*\•]+\s*/, '').trim()).filter(l => l.length > 4)
  
  // Try "Q: ... A: ..." pattern
  for (let i = 0; i < lines.length - 1; i++) {
    const qm = lines[i].match(/^Q[:\s]+(.+)/i)
    const am = lines[i+1].match(/^A[:\s]+(.+)/i)
    if (qm && am) { cards.push({ q: qm[1].trim(), a: am[1].trim() }); i++ }
  }
  if (cards.length >= 2) return cards.slice(0, 5)

  // Try "Term: Definition" on same line
  for (const line of lines) {
    const m = line.match(/^(.{4,40})[:\-–]\s*(.{5,})$/)
    if (m) cards.push({ q: m[1].trim() + '?', a: m[2].trim() })
  }
  if (cards.length >= 2) return cards.slice(0, 5)

  // Last resort: pair lines
  for (let i = 0; i + 1 < lines.length && cards.length < 5; i += 2) {
    if (lines[i].length > 4 && lines[i+1].length > 4)
      cards.push({ q: lines[i], a: lines[i+1] })
  }
  return cards.slice(0, 5)
}

function parseLecture(raw: string): Lecture {
  const overview = raw.match(/OVERVIEW:\s*(.+?)(?=OBJECTIVES:|$)/is)?.[1]?.trim() ?? ''
  const objectivesBlock = raw.match(/OBJECTIVES:\s*(.+?)(?=KEY_POINTS:|$)/is)?.[1]?.trim() ?? ''
  const keyPointsBlock = raw.match(/KEY_POINTS:\s*(.+?)(?=FLASHCARDS:|$)/is)?.[1]?.trim() ?? ''
  const recap = raw.match(/RECAP:\s*(.+?)$/is)?.[1]?.trim() ?? ''

  const cleanList = (block: string) => block
    .split('\n')
    .map(line => line.replace(/^[\s\-\*\d\.\)]+/, '').trim())
    .filter(Boolean)
    .slice(0, 4)

  const objectives = cleanList(objectivesBlock)
  const keyPoints = cleanList(keyPointsBlock)

  return {
    overview: overview || 'This topic is explained in a short lecture for fast learning.',
    objectives: objectives.length ? objectives : [
      'Understand the main concept.',
      'Identify where to apply it.',
      'Recall one practical takeaway.',
    ],
    keyPoints: keyPoints.length ? keyPoints : [
      'Core definition and purpose.',
      'Common use case in practice.',
      'One key caution to remember.',
    ],
    recap: recap || 'Recap: focus on the core idea, then reinforce with flashcards and quiz.',
  }
}

export default function VoicePage() {
  const [topic,   setTopic]   = useState('')
  const [cards,   setCards]   = useState<Card[]>([])
  const [loading, setLoading] = useState(false)
  const [stream,  setStream]  = useState('')
  const [view,    setView]    = useState<'home'|'study'|'quiz'|'done'>('home')
  const [idx,     setIdx]     = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [qIdx,    setQIdx]    = useState(0)
  const [ans,     setAns]     = useState('')
  const [scores,  setScores]  = useState<boolean[]>([])
  const [showA,   setShowA]   = useState(false)
  const [err,     setErr]     = useState('')
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner')
  const abort = useRef<AbortController|null>(null)

  async function make() {
    if (!topic.trim() || loading) return
    if (!isModelReady()) { setErr('Load a model first.'); return }
    setLoading(true); setStream(''); setCards([]); setErr(''); setLecture(null)
    abort.current = new AbortController()
    try {
      let raw = ''
      await generateText(
        `Create a concise study lecture for "${topic.trim()}" at ${difficulty} level in this exact format:\nOVERVIEW: <2 short sentences>\nOBJECTIVES:\n- <objective 1>\n- <objective 2>\n- <objective 3>\nKEY_POINTS:\n- <point 1>\n- <point 2>\n- <point 3>\nFLASHCARDS:\nQ: <question 1>\nA: <answer 1>\nQ: <question 2>\nA: <answer 2>\nQ: <question 3>\nA: <answer 3>\nQ: <question 4>\nA: <answer 4>\nQ: <question 5>\nA: <answer 5>\nRECAP: <1 sentence recap>`,
        {
          systemPrompt: `You are a study coach. Provide accurate, clear, structured lecture notes and quiz-ready flashcards for ${difficulty} learners.`,
          maxTokens: 72,
          temperature: 0.15,
          timeoutMs: 7000,
          signal: abort.current.signal,
          onToken: (_,a) => { raw=a; setStream(a) },
        }
      )
      setLecture(parseLecture(raw))
      const parsed = parseCards(raw)
      if (parsed.length >= 1) {
        setCards(parsed); setView('study'); setIdx(0); setFlipped(false)
      } else {
        setErr('Could not parse cards. Try a simpler topic.')
      }
    } catch(e:any) {
      if (!abort.current?.signal.aborted) setErr(`Error: ${e?.message}`)
    } finally { setLoading(false); setStream(''); abort.current=null }
  }

  function quiz() { setView('quiz'); setQIdx(0); setScores([]); setAns(''); setShowA(false) }

  function submit() {
    if (!ans.trim()) return
    const ok = cards[qIdx].a.toLowerCase().split(/\s+/).filter(w=>w.length>3)
      .some(w => ans.toLowerCase().includes(w))
    const next = [...scores, ok]
    setScores(next); setShowA(true)
    setTimeout(() => {
      if (qIdx+1 < cards.length) { setQIdx(i=>i+1); setAns(''); setShowA(false) }
      else setView('done')
    }, 1500)
  }

  const score = scores.filter(Boolean).length

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <Brain size={15} className="text-teal-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">AI Study Buddy</p>
            <p className="text-[10px] text-slate-400 font-mono">Flashcards + Quiz · 100% offline</p>
          </div>
        </div>
        {view !== 'home' && (
          <button onClick={() => { setView('home'); setCards([]); setTopic(''); setErr(''); setLecture(null) }} className="btn-ghost text-xs">
            <RefreshCw size={11} /> New Topic
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* HOME */}
        {view === 'home' && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-4 max-w-lg mx-auto">
            <div className="text-center pt-4 pb-2">
              <motion.div animate={{ y:[0,-5,0] }} transition={{ duration:3, repeat:Infinity }}
                className="w-16 h-16 rounded-2xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center mx-auto mb-4">
                <Brain size={28} className="text-teal-400" />
              </motion.div>
              <h2 className="text-white font-bold text-xl">AI Study Buddy</h2>
              <p className="text-slate-400 text-sm mt-1">Any topic → flashcards → quiz yourself</p>
            </div>

            <div className="flex gap-2">
              <input value={topic} onChange={e=>setTopic(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&make()}
                placeholder="Enter any topic to study…"
                className="input flex-1" disabled={loading} />
              <button onClick={make} disabled={!topic.trim()||loading}
                className="px-5 py-2 rounded-xl font-bold text-sm text-void bg-teal-400 hover:bg-teal-300 disabled:opacity-40 transition-all flex-shrink-0 flex items-center gap-2"
                style={{ color: '#04060d' }}>
                {loading ? <Loader size={14} className="animate-spin text-black" /> : <Sparkles size={14} />}
                {loading ? '…' : 'Go'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide mb-2">Difficulty</p>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setDifficulty(level.id)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      difficulty === level.id
                        ? 'bg-teal-500/20 border-teal-400/40 text-teal-300'
                        : 'bg-white/5 border-white/15 text-slate-300 hover:border-teal-400/30'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {HINTS.map(h => (
                <button key={h} onClick={() => setTopic(h)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 transition-all">
                  {h}
                </button>
              ))}
            </div>

            {loading && (
              <div className="p-4 rounded-xl bg-white/5 border border-teal-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Loader size={12} className="text-teal-400 animate-spin" />
                  <span className="text-xs text-teal-400">Generating cards for: {topic}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono line-clamp-3 leading-relaxed">{stream || 'Thinking…'}</p>
              </div>
            )}

            {err && <p className="text-xs text-red-400 text-center">{err}</p>}

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[{i:Sparkles,t:'Generate',d:'AI makes cards'},{i:BookOpen,t:'Study',d:'Flip & learn'},{i:Target,t:'Quiz',d:'Test yourself'}]
                .map(({i:I,t,d}) => (
                <div key={t} className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <I size={18} className="text-teal-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-white">{t}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{d}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* STUDY */}
        {view === 'study' && cards.length > 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">{topic}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-teal-300 font-mono uppercase">{DIFFICULTIES.find(d => d.id === difficulty)?.label}</span>
                <span className="text-xs text-slate-400">{idx+1}/{cards.length}</span>
                <button onClick={quiz} className="btn-accent text-xs py-1"><Target size={11} /> Quiz</button>
              </div>
            </div>

            {lecture && (
              <div className="p-4 rounded-xl bg-white/5 border border-teal-500/20 space-y-3">
                <div>
                  <p className="text-[10px] text-teal-400 font-mono uppercase mb-1">Lecture Overview</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{lecture.overview}</p>
                </div>
                <div>
                  <p className="text-[10px] text-teal-400 font-mono uppercase mb-1">Objectives</p>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {lecture.objectives.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-teal-300">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] text-teal-400 font-mono uppercase mb-1">Key Points</p>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {lecture.keyPoints.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-teal-300">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] text-teal-400 font-mono uppercase mb-1">Recap</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{lecture.recap}</p>
                </div>
              </div>
            )}

            <div className="flex gap-1 justify-center">
              {cards.map((_,i) => (
                <button key={i} onClick={()=>{setIdx(i);setFlipped(false)}}
                  className={`w-2 h-2 rounded-full transition-all ${i===idx?'bg-teal-400':'bg-white/20'}`} />
              ))}
            </div>
            <div onClick={()=>setFlipped(f=>!f)} className="cursor-pointer" style={{ perspective:'800px', height:'200px' }}>
              <motion.div animate={{ rotateY: flipped?180:0 }} transition={{ duration:0.35 }}
                style={{ transformStyle:'preserve-3d', position:'relative', height:'100%' }}>
                <div className="absolute inset-0 rounded-2xl bg-white/5 border-2 border-teal-500/25 flex flex-col items-center justify-center p-6 text-center"
                  style={{ backfaceVisibility:'hidden' }}>
                  <p className="text-[10px] text-teal-400 font-mono uppercase tracking-wide mb-3">Question</p>
                  <p className="text-white font-semibold leading-relaxed text-base">{cards[idx].q}</p>
                  <p className="text-[10px] text-slate-500 mt-3">tap to flip</p>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-teal-500/10 border-2 border-teal-500/40 flex flex-col items-center justify-center p-6 text-center"
                  style={{ backfaceVisibility:'hidden', transform:'rotateY(180deg)' }}>
                  <p className="text-[10px] text-green-400 font-mono uppercase tracking-wide mb-3">Answer</p>
                  <p className="text-white font-bold leading-relaxed text-base">{cards[idx].a}</p>
                  <p className="text-[10px] text-slate-500 mt-3">tap to flip back</p>
                </div>
              </motion.div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>{setIdx(i=>Math.max(0,i-1));setFlipped(false)}} disabled={idx===0}
                className="btn-ghost flex-1 disabled:opacity-30"><ChevronLeft size={14}/> Prev</button>
              <button onClick={()=>{setIdx(i=>Math.min(cards.length-1,i+1));setFlipped(false)}} disabled={idx===cards.length-1}
                className="btn-ghost flex-1 disabled:opacity-30">Next <ChevronRight size={14}/></button>
            </div>
            <button onClick={quiz}
              className="w-full py-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 font-bold text-sm hover:bg-teal-500/25 transition-all flex items-center justify-center gap-2">
              <Target size={14}/> Start Quiz
            </button>
          </motion.div>
        )}

        {/* QUIZ */}
        {view === 'quiz' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">Quiz: {topic}</p>
              <span className="text-xs text-slate-400 font-mono">{qIdx+1}/{cards.length}</span>
            </div>
            <div className="flex gap-1">
              {cards.map((_,i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${i<scores.length?(scores[i]?'bg-green-400':'bg-red-400'):'bg-white/10'}`} />
              ))}
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-teal-400 font-mono mb-1 uppercase">Q{qIdx+1}</p>
              <p className="text-white text-sm leading-relaxed">{cards[qIdx].q}</p>
            </div>
            <textarea value={ans} onChange={e=>setAns(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit()}}}
              placeholder="Your answer… (Enter to submit)" rows={3}
              className="input w-full resize-none" disabled={showA} />
            {!showA
              ? <button onClick={submit} disabled={!ans.trim()}
                  className="w-full py-3 rounded-xl bg-teal-400 font-bold text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  style={{ color:'#04060d' }}>
                  <ChevronRight size={14}/> Submit
                </button>
              : <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                  className={`p-3 rounded-xl border ${scores[scores.length-1]?'bg-green-500/10 border-green-500/25':'bg-red-500/10 border-red-500/25'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {scores[scores.length-1]?<CheckCircle size={13} className="text-green-400"/>:<XCircle size={13} className="text-red-400"/>}
                    <span className={`text-xs font-bold ${scores[scores.length-1]?'text-green-400':'text-red-400'}`}>
                      {scores[scores.length-1]?'Correct!':'Not quite'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Answer: <span className="text-white">{cards[qIdx].a}</span></p>
                </motion.div>
            }
          </motion.div>
        )}

        {/* DONE */}
        {view === 'done' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col items-center py-10 gap-4 text-center max-w-lg mx-auto">
            <Trophy size={48} className={score>=cards.length*0.8?'text-yellow-400':'text-orange-400'} />
            <div>
              <p className="text-white font-bold text-4xl">{score}/{cards.length}</p>
              <p className="text-slate-400 text-sm mt-1">
                {score===cards.length?'Perfect! 🎉':score>=cards.length*0.8?'Great job! 🌟':score>=cards.length*0.5?'Good effort 📚':'Keep practising 💪'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              {scores.map((ok,i) => (
                <div key={i} className={`p-3 rounded-xl border text-left text-xs ${ok?'bg-green-500/8 border-green-500/20':'bg-red-500/8 border-red-500/20'}`}>
                  <div className="flex items-center gap-1 mb-1">
                    {ok?<CheckCircle size={10} className="text-green-400"/>:<XCircle size={10} className="text-red-400"/>}
                    <span className={ok?'text-green-400':'text-red-400'}>Q{i+1}</span>
                  </div>
                  <p className="text-slate-400 line-clamp-1">{cards[i].q}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 w-full">
              <button onClick={quiz} className="btn-ghost flex-1 text-xs"><RefreshCw size={12}/> Retry</button>
              <button onClick={()=>setView('study')} className="btn-accent flex-1 text-xs"><BookOpen size={12}/> Review</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
