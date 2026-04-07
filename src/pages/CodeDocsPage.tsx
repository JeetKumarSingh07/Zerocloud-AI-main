import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2, Sparkles, Copy, CheckCheck, Trash2,
  FileCode, Loader, StopCircle, ChevronDown, ChevronUp,
  Play, BookOpen, Wand2
} from 'lucide-react'
import { generateText, cancelGeneration, isModelReady } from '../lib/runanywhere'

type DocMode = 'explain' | 'document' | 'readme' | 'review' | 'convert'

const MODES: { id: DocMode; label: string; icon: any; desc: string; color: string }[] = [
  { id: 'explain',  label: 'Explain Code', icon: BookOpen, desc: 'Plain-English explanation', color: 'text-iris'         },
  { id: 'document', label: 'Add Docs',     icon: FileCode, desc: 'Generate JSDoc/comments',   color: 'text-accent'       },
  { id: 'readme',   label: 'README',       icon: FileCode, desc: 'Write project README',      color: 'text-amber'        },
  { id: 'review',   label: 'Code Review',  icon: Wand2,    desc: 'Find bugs & improvements',  color: 'text-rose'         },
  { id: 'convert',  label: 'Convert',      icon: Play,     desc: 'Translate to another lang',  color: 'text-green-400'   },
]

const SYSTEM_PROMPTS: Record<DocMode, string> = {
  explain:  'You are a senior developer. Explain what this code does in simple, clear English. Be concise.',
  document: 'You are a technical writer. Add JSDoc/inline documentation comments to the code. Return documented code.',
  readme:   'You are a documentation expert. Write a concise README.md with description, usage, and examples.',
  review:   'You are a code reviewer. List bugs, security issues, and improvements. Be specific.',
  convert:  'You are a polyglot programmer. Convert the given code to the requested target language.',
}

const USER_PROMPTS: Record<DocMode, string> = {
  explain:  'Explain this code in plain English:',
  document: 'Add documentation comments to this code and return it:',
  readme:   'Write a README.md for this code:',
  review:   'Review this code and list all issues:',
  convert:  'Convert this code to [target language — edit me]:',
}

const EXAMPLES: Record<string, string> = {
  JavaScript: `function debounce(func, wait) {\n  let timeout;\n  return function(...args) {\n    clearTimeout(timeout);\n    timeout = setTimeout(() => func(...args), wait);\n  };\n}`,
  Python: `def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1`,
  React: `const useLocalStorage = (key, defaultValue) => {\n  const [value, setValue] = useState(() => {\n    try { return JSON.parse(localStorage.getItem(key)) ?? defaultValue }\n    catch { return defaultValue }\n  });\n  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)) }, [key, value]);\n  return [value, setValue];\n};`,
}

export default function CodeDocsPage() {
  const [mode,       setMode]       = useState<DocMode>('explain')
  const [code,       setCode]       = useState('')
  const [output,     setOutput]     = useState('')
  const [isRunning,  setIsRunning]  = useState(false)   // renamed to avoid confusion
  const [liveText,   setLiveText]   = useState('')      // streamed text shown live
  const [copied,     setCopied]     = useState(false)
  const [showEx,     setShowEx]     = useState(false)
  const abortRef  = useRef<AbortController | null>(null)
  const liveRef   = useRef('')  // avoid stale closure

  function stop() {
    abortRef.current?.abort()
    cancelGeneration()
  }

  async function generate() {
    if (!code.trim()) return
    if (!isModelReady()) { alert('Model not loaded — complete setup first.'); return }

    setIsRunning(true)
    setOutput('')
    setLiveText('')
    liveRef.current = ''
    abortRef.current = new AbortController()

    try {
      const result = await generateText(
        `${USER_PROMPTS[mode]}\n\`\`\`\n${code.trim().slice(0, 500)}\n\`\`\``,
        {
          systemPrompt: SYSTEM_PROMPTS[mode],
          maxTokens: 45,
          temperature: 0,
          signal: abortRef.current.signal,
          onToken: (_, acc) => {
            liveRef.current = acc
            setLiveText(acc)   // update live display every token
          },
        }
      )
      setOutput(result)        // set final cleaned result
      setLiveText('')          // clear live text — output takes over
    } catch (e: any) {
      if (!abortRef.current?.signal.aborted) {
        setOutput(`⚠️ Error: ${e?.message ?? 'Generation failed'}`)
      } else {
        // User stopped — save whatever we streamed
        if (liveRef.current.trim()) {
          setOutput(liveRef.current.trim())
        }
      }
      setLiveText('')
    } finally {
      setIsRunning(false)
      liveRef.current = ''
      abortRef.current = null
    }
  }

  // What to display: live stream while running, final output when done
  const displayText = isRunning ? liveText : output

  const currentMode = MODES.find(m => m.id === mode)!

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center">
            <Code2 size={14} className="text-green-400" />
          </div>
          <div>
            <p className="text-bright font-semibold text-sm">Code Docs Generator</p>
            <p className="text-[10px] text-dim font-mono">Explain · Document · Review · Convert</p>
          </div>
        </div>
        {(output || code) && (
          <button onClick={() => { setOutput(''); setCode(''); setLiveText('') }} className="btn-ghost text-xs">
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — input */}
        <div className="w-1/2 flex flex-col border-r border-border overflow-hidden">
          {/* Mode tabs */}
          <div className="flex gap-1 p-3 border-b border-border overflow-x-auto scrollbar-none flex-shrink-0">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 border transition-all ${
                  mode === m.id
                    ? `${m.color} bg-card border-current/30 border-opacity-30`
                    : 'text-dim border-transparent hover:border-border hover:text-text'
                }`}>
                <m.icon size={11} />{m.label}
              </button>
            ))}
          </div>

          {/* Mode desc */}
          <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-shrink-0">
            <currentMode.icon size={11} className={currentMode.color} />
            <p className="text-[11px] text-dim">{currentMode.desc}</p>
          </div>

          {/* Code textarea */}
          <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={`Paste your code here…\n\nSelected mode: ${currentMode.label}`}
              className="flex-1 w-full bg-void border border-border rounded-xl px-4 py-3 text-xs text-text font-mono leading-relaxed focus:outline-none focus:border-green-500/40 resize-none placeholder-dim"
              spellCheck={false}
            />

            {/* Examples */}
            <div>
              <button onClick={() => setShowEx(e => !e)}
                className="flex items-center gap-1.5 text-[11px] text-dim hover:text-text mb-1.5">
                {showEx ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                Load example code
              </button>
              <AnimatePresence>
                {showEx && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="flex flex-wrap gap-1.5 overflow-hidden">
                    {Object.entries(EXAMPLES).map(([lang, snippet]) => (
                      <button key={lang} onClick={() => { setCode(snippet); setShowEx(false) }}
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-card border border-border text-dim hover:text-text hover:border-green-500/30 transition-all">
                        {lang}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Generate / Stop button */}
            {isRunning ? (
              <button onClick={stop}
                className="py-2.5 rounded-xl bg-rose/15 border border-rose/30 text-rose font-semibold text-xs flex items-center justify-center gap-2 hover:bg-rose/25 transition-all">
                <StopCircle size={13} /> Stop
              </button>
            ) : (
              <button onClick={generate} disabled={!code.trim()}
                className="py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-green-500/25 disabled:opacity-40 transition-all">
                <Sparkles size={13} /> {currentMode.label}
              </button>
            )}
          </div>
        </div>

        {/* Right — output */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={11} className="text-green-400" />
              <span className="text-xs font-semibold text-dim uppercase tracking-wide">AI Output</span>
              {isRunning && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <Loader size={9} className="text-green-400 animate-spin" />
                  <span className="text-[9px] text-green-400 font-mono">generating…</span>
                </div>
              )}
            </div>
            {output && !isRunning && (
              <button
                onClick={async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
                className="flex items-center gap-1 text-[11px] text-dim hover:text-text transition-colors">
                {copied ? <CheckCheck size={11} className="text-accent" /> : <Copy size={11} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {displayText ? (
              <pre className="text-xs text-text font-mono leading-relaxed whitespace-pre-wrap break-words">
                {displayText}{isRunning && <span className="ai-cursor" />}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-dim gap-3">
                <Code2 size={28} className="opacity-20" />
                <p className="text-sm">Output will appear here</p>
                <p className="text-[11px] opacity-60">Paste code on the left → click generate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
