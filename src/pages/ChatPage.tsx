
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Bot, RefreshCw, Copy, CheckCheck, Sparkles, StopCircle, Zap, Cpu, Mic, MicOff, Volume2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { ChatDB, type ChatMessage } from '../lib/storage'
import { generateText, cancelGeneration, isModelReady, activeModel, startSpeechRecognition, speakText, stopSpeaking } from '../lib/runanywhere'

const SESSION = 'main'

function quickReply(text: string): string | null {
  const t = text.trim().toLowerCase()

  if (/^(hi|hii|hello|hey|yo|namaste|hola)[!. ]*$/.test(t)) {
    return 'Hi! How can I help you today?'
  }

  if (/^(thanks|thank you|thx|ty)[!. ]*$/.test(t)) {
    return 'You are welcome.'
  }

  if (/^(ok|okay|cool|great|nice)[!. ]*$/.test(t)) {
    return 'Great. What should we do next?'
  }

  return null
}

function tryMathReply(text: string): string | null {
  let normalized = text
    .toLowerCase()
    .replace(/,/g, '')
    .replace(/×|x/g, '*')
    .replace(/÷/g, '/')
    .replace(/\bplus\b/g, '+')
    .replace(/\bminus\b/g, '-')
    .replace(/\b(times|multiplied by)\b/g, '*')
    .replace(/\b(divided by|over)\b/g, '/')
    .replace(/\bwhat is\b/g, '')
    .replace(/\bcalculate\b/g, '')
    .replace(/\bevaluate\b/g, '')
    .replace(/[=?]/g, ' ')
    .trim()

  // Keep only arithmetic-safe characters.
  normalized = normalized.replace(/[^0-9+\-*/().\s]/g, '').trim()
  if (!normalized) return null
  if (!/\d/.test(normalized) || !/[+\-*/]/.test(normalized)) return null
  if (!/^[0-9+\-*/().\s]+$/.test(normalized)) return null

  const tokens = normalized.match(/\d*\.?\d+|[()+\-*/]/g)
  if (!tokens || tokens.length === 0) return null

  let i = 0

  function parseExpression(): number {
    let value = parseTerm()
    while (i < tokens.length) {
      const op = tokens[i]
      if (op !== '+' && op !== '-') break
      i++
      const rhs = parseTerm()
      value = op === '+' ? value + rhs : value - rhs
    }
    return value
  }

  function parseTerm(): number {
    let value = parseFactor()
    while (i < tokens.length) {
      const op = tokens[i]
      if (op !== '*' && op !== '/') break
      i++
      const rhs = parseFactor()
      value = op === '*' ? value * rhs : value / rhs
    }
    return value
  }

  function parseFactor(): number {
    const tok = tokens[i]
    if (!tok) throw new Error('Unexpected end')

    if (tok === '+') {
      i++
      return parseFactor()
    }
    if (tok === '-') {
      i++
      return -parseFactor()
    }
    if (tok === '(') {
      i++
      const v = parseExpression()
      if (tokens[i] !== ')') throw new Error('Missing closing parenthesis')
      i++
      return v
    }

    i++
    const n = Number(tok)
    if (!Number.isFinite(n)) throw new Error('Invalid number')
    return n
  }

  try {
    const result = parseExpression()
    if (i !== tokens.length || !Number.isFinite(result)) return null

    const pretty = Number.isInteger(result)
      ? String(result)
      : String(Number(result.toFixed(6)))

    return pretty
  } catch {
    return null
  }
}

export default function ChatPage() {
  const [messages,    setMessages]    = useState<ChatMessage[]>([])
  const [input,       setInput]       = useState('')
  const [generating,  setGenerating]  = useState(false)
  const [streamText,  setStreamText]  = useState('')
  const [copied,      setCopied]      = useState<string | null>(null)
  const [tps,         setTps]         = useState<number | null>(null)
  const [firstTokMs,  setFirstTokMs]  = useState<number | null>(null)
  const abortRef   = useRef<AbortController | null>(null)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const t0         = useRef(0)
  const gotFirst   = useRef(false)
  const tokCount   = useRef(0)
  const micStopRef = useRef<(() => void) | null>(null)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl+/ or Cmd+/ for quick commands
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      // Ctrl+Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && input.trim() && !generating) {
        e.preventDefault()
        send()
      }
      // Ctrl+L to clear chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault()
        clear()
      }
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [input, generating])

  useEffect(() => { ChatDB.getSession(SESSION).then(setMessages) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streamText])

  function stop() { abortRef.current?.abort(); cancelGeneration() }

  function toggleMic() {
    if (listening) {
      micStopRef.current?.()
      micStopRef.current = null
      setListening(false)
    } else {
      setListening(true)
      micStopRef.current = startSpeechRecognition('en-US',
        (interim) => setInput(interim),
        (final) => {
          if (final.trim()) {
            setInput(final)
            setListening(false)
            micStopRef.current = null
          }
        },
        () => setListening(false)
      )
    }
  }

  async function send() {
    const text = input.trim()
    if (!text || generating) return
    if (!isModelReady()) { alert('Model not loaded — complete setup first.'); return }

    setInput('')
    setTps(null)
    setFirstTokMs(null)
    tokCount.current = 0

    const userMsg: ChatMessage = {
      id: uuidv4(), sessionId: SESSION, role: 'user', content: text, timestamp: Date.now(),
    }
    await ChatDB.put(userMsg)
    setMessages(prev => [...prev, userMsg])

    const instant = quickReply(text)
    if (instant) {
      const aMsg: ChatMessage = {
        id: uuidv4(), sessionId: SESSION, role: 'assistant', content: instant, timestamp: Date.now(),
      }
      await ChatDB.put(aMsg)
      setMessages(prev => [...prev, aMsg])
      inputRef.current?.focus()
      return
    }

    const math = tryMathReply(text)
    if (math !== null) {
      const aMsg: ChatMessage = {
        id: uuidv4(), sessionId: SESSION, role: 'assistant', content: math, timestamp: Date.now(),
      }
      await ChatDB.put(aMsg)
      setMessages(prev => [...prev, aMsg])
      inputRef.current?.focus()
      return
    }

    setGenerating(true)
    setStreamText('')
    abortRef.current = new AbortController()
    t0.current = Date.now()
    gotFirst.current = false

    try {
      // NO notes context — it causes wrong answers by confusing small models
      // Only use memories if explicitly set by user
      // const memories = await MemoryDB.getContextString(1)

      let full = ''
      full = await generateText(text, {
        systemPrompt: 'Answer directly. Do not explain your reasoning process. Do not offer multiple possible responses unless asked. No meta commentary. Keep it concise and useful.',
        maxTokens: 56,
        temperature: 0.2,
        timeoutMs: 5500,
        signal: abortRef.current.signal,
        onToken: (_, acc) => {
          tokCount.current++
          full = acc
          setStreamText(acc)
          if (!gotFirst.current) {
            gotFirst.current = true
            setFirstTokMs(Date.now() - t0.current)
          }
          if (tokCount.current % 8 === 0) {
            setTps(tokCount.current / ((Date.now() - t0.current) / 1000))
          }
        },
      })

      // Strip any "Assistant:" prefix the model might still echo
      full = full
        .replace(/^Assistant:\s*/i, '')
        .replace(/^A:\s*/i, '')
        .trim()

      const elapsed  = (Date.now() - t0.current) / 1000
      const finalTps = tokCount.current / elapsed
      setTps(finalTps)

      const aMsg: ChatMessage = {
        id: uuidv4(), sessionId: SESSION, role: 'assistant',
        content: full, timestamp: Date.now(), tokensPerSec: finalTps,
      }
      await ChatDB.put(aMsg)
      setMessages(prev => [...prev, aMsg])
    } catch (e: any) {
      if (!abortRef.current?.signal.aborted) {
        const errMsg: ChatMessage = {
          id: uuidv4(), sessionId: SESSION, role: 'assistant',
          content: `⚠️ ${e?.message ?? 'Generation failed'}`, timestamp: Date.now(),
        }
        await ChatDB.put(errMsg)
        setMessages(prev => [...prev, errMsg])
      } else if (streamText.trim()) {
        const clean = streamText.replace(/^Assistant:\s*/i, '').trim()
        if (clean) {
          const partial: ChatMessage = {
            id: uuidv4(), sessionId: SESSION, role: 'assistant',
            content: clean + ' [stopped]', timestamp: Date.now(),
          }
          await ChatDB.put(partial)
          setMessages(prev => [...prev, partial])
        }
      }
    } finally {
      setGenerating(false)
      setStreamText('')
      abortRef.current = null
      inputRef.current?.focus()
    }
  }

  async function copyMsg(id: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1800)
  }

  async function clear() {
    await ChatDB.clearSession(SESSION)
    setMessages([])
    setTps(null)
    setFirstTokMs(null)
  }

  const model = activeModel()

  const PROMPTS = [
    'What is 2 + 2?',
    'Who is the prime minister of India?',
    'Summarize my recent notes',
    'Give me 3 productivity tips',
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-iris/15 border border-iris/30 flex items-center justify-center">
            <Bot size={13} className="text-iris" />
          </div>
          <div>
            <p className="text-bright font-semibold text-sm">AI Chat</p>
            <p className="text-[10px] text-dim font-mono">
              {model ? model.name : 'ZeroCloud AI — Local LLM'} · offline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tps !== null && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/8 border border-accent/20">
              <Zap size={9} className="text-accent" />
              <span className="text-[10px] text-accent font-mono">{tps.toFixed(1)} tok/s</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-iris/8 border border-iris/20">
            <div className="live-dot" style={{ width: 6, height: 6 }} />
            <span className="text-[10px] text-iris font-mono">LOCAL</span>
          </div>
          <button onClick={clear} className="btn-ghost text-xs py-1">
            <RefreshCw size={12} />Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && !generating ? (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity }}
              className="w-14 h-14 rounded-2xl bg-iris/10 border border-iris/20 flex items-center justify-center mb-4"
            >
              <Sparkles size={20} className="text-iris" />
            </motion.div>
            <h3 className="text-bright font-semibold text-base mb-1">Your Private AI</h3>
            {model && (
              <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-full bg-card border border-border">
                <Cpu size={11} className="text-dim" />
                <span className="text-[11px] text-dim font-mono">{model.name}</span>
              </div>
            )}
            <p className="text-dim text-xs text-center max-w-xs mb-5 leading-relaxed">
              100% offline via RunAnywhere SDK. Ask anything — answers run entirely on your device.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => { setInput(p); inputRef.current?.focus() }}
                  className="text-left text-xs px-3 py-2.5 rounded-xl bg-card border border-border hover:border-iris/30 hover:bg-iris/5 text-dim hover:text-text transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'gap-2.5'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-iris/15 border border-iris/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={12} className="text-iris" />
                  </div>
                )}
                <div className={`group ${msg.role === 'user' ? 'max-w-[70%]' : 'flex-1 max-w-[88%]'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-iris">ZeroCloud AI</span>
                      {msg.tokensPerSec && (
                        <span className="text-[10px] text-dim font-mono flex items-center gap-0.5">
                          <Zap size={8} />{msg.tokensPerSec.toFixed(1)} tok/s
                        </span>
                      )}
                    </div>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-accent/12 border border-accent/20 text-text rounded-tr-sm'
                      : 'bg-card border border-border text-text rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="mt-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => copyMsg(msg.id, msg.content)}
                        className="flex items-center gap-1 text-[10px] text-dim hover:text-text"
                      >
                        {copied === msg.id
                          ? <CheckCheck size={10} className="text-accent" />
                          : <Copy size={10} />}
                        {copied === msg.id ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() => speakText(msg.content)}
                        className="flex items-center gap-1 text-[10px] text-dim hover:text-iris"
                      >
                        <Volume2 size={10} /> Speak
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Streaming bubble */}
            {generating && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-iris/15 border border-iris/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={12} className="text-iris" />
                </div>
                <div className="flex-1 max-w-[88%]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-iris">ZeroCloud AI</span>
                    {!streamText
                      ? <span className="text-[10px] text-dim font-mono animate-pulse">thinking…</span>
                      : tps
                        ? <span className="text-[10px] text-dim font-mono flex items-center gap-0.5">
                            <Zap size={8} className="text-accent" />{tps.toFixed(1)} tok/s
                          </span>
                        : null
                    }
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-card border border-iris/20 text-sm leading-relaxed text-text rounded-tl-sm min-h-[42px]">
                    {streamText
                      ? <>{streamText}<span className="ai-cursor" /></>
                      : (
                        <div className="space-y-2 py-1">
                          <div className="h-3 rounded shimmer w-3/4" />
                          <div className="h-3 rounded shimmer w-1/2" />
                        </div>
                      )
                    }
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <button
            onClick={toggleMic}
            title={listening ? 'Stop listening' : 'Voice input'}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all ${
              listening
                ? 'bg-rose/20 border-rose/40 text-rose animate-pulse'
                : 'bg-card border-border text-dim hover:text-text hover:border-muted'
            }`}
          >
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask anything… (Enter to send)"
            rows={1}
            disabled={generating}
            className="input flex-1 resize-none leading-relaxed py-2.5 disabled:opacity-60"
            style={{ minHeight: 44, maxHeight: 120 }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          {generating ? (
            <button
              onClick={stop}
              title="Stop generating"
              className="w-10 h-10 rounded-xl bg-rose/15 hover:bg-rose/25 border border-rose/40 flex items-center justify-center text-rose transition-all flex-shrink-0"
            >
              <StopCircle size={16} />
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-iris/15 hover:bg-iris/25 border border-iris/30 hover:border-iris/50 flex items-center justify-center text-iris disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Send size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[10px] text-dim font-mono">offline · no network calls</p>
          {firstTokMs && !generating && (
            <p className="text-[10px] text-dim font-mono">first token: {firstTokMs}ms</p>
          )}
        </div>
      </div>
    </div>
  )
}
