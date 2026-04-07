import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Sparkles, Copy, CheckCheck, Trash2,
  FileText, Play, Square, Download, Clock, Users,
  ChevronDown, ChevronUp, Loader, AlertCircle
} from 'lucide-react'
import { generateText, isModelReady, startSpeechRecognition } from '../lib/runanywhere'

interface Meeting {
  id: string
  title: string
  transcript: string
  summary: string
  actionItems: string[]
  duration: number
  createdAt: number
}

const STORAGE_KEY = 'sb_meetings_v1'
function saveMeetings(m: Meeting[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)) } catch {} }
function loadMeetings(): Meeting[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] } }

// Robust parser — works on whatever the model outputs
function parseMeetingOutput(raw: string): { summary: string; actionItems: string[] } {
  // Try to find SUMMARY block
  const summaryM =
    raw.match(/SUMMARY[:\s]+(.+?)(?=ACTION_ITEMS|ACTION ITEMS|ACTIONS|Tasks:|$)/is) ??
    raw.match(/^(.{20,200})/s)   // fallback: first 200 chars

  // Try to find bullet items
  const bullets = [...raw.matchAll(/(?:^|\n)\s*[-•*\d.]+\s*(.{5,})/gm)]
    .map(m => m[1].trim())
    .filter(s => s.length > 4 && !s.toLowerCase().startsWith('summary'))

  // If no bullets, split by sentence and use last portion as actions
  const fallbackActions = raw
    .split(/[.\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && (s.toLowerCase().includes('should') || s.toLowerCase().includes('need') || s.toLowerCase().includes('will') || s.toLowerCase().includes('follow')))
    .slice(0, 4)

  return {
    summary: summaryM?.[1]?.trim().slice(0, 400) ?? raw.slice(0, 200),
    actionItems: bullets.length > 0 ? bullets.slice(0, 5) : fallbackActions.slice(0, 4),
  }
}

export default function MeetingPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(loadMeetings)
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [stream, setStream] = useState('')
  const [title, setTitle] = useState('')
  const [selected, setSelected] = useState<Meeting | null>(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const stopRecRef = useRef<(() => void) | null>(null)
  const timerRef = useRef<any>(null)
  const startTime = useRef(0)
  const transcriptRef = useRef('')

  useEffect(() => { transcriptRef.current = transcript }, [transcript])

  function startRec() {
    setError('')
    setTranscript('')
    setInterimText('')

    // Browser SpeechRecognition usually requires internet for recognition service.
    if (!navigator.onLine) {
      setError('You are offline. Voice transcription is unavailable right now. Paste or type meeting notes below, then click AI Analyze & Save.')
      return
    }

    setElapsed(0)
    startTime.current = Date.now()
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)

    stopRecRef.current = startSpeechRecognition('en-US',
      (interim) => setInterimText(interim),
      (final) => {
        if (final.trim()) {
          setTranscript(prev => prev ? prev + ' ' + final : final)
          setInterimText('')
        }
      },
      (err) => {
        const normalized = (err ?? '').toString().toLowerCase()
        if (normalized.includes('internet') || normalized.includes('network')) {
          setError('Speech-to-text requires internet in this browser. Use the manual transcript box below when offline, then click AI Analyze & Save.')
        } else if (normalized.includes('not-allowed') || normalized.includes('blocked') || normalized.includes('microphone')) {
          setError('Microphone permission is blocked. Allow microphone access in your browser and retry.')
        } else if (normalized.includes('browser-unsupported')) {
          setError('Speech recognition is not supported in this browser. Use Chrome or Edge, or type transcript manually below.')
        } else {
          setError(err || 'Speech recognition failed. You can still paste notes manually below.')
        }
        stopRec()
      }
    )
    setRecording(true)
  }

  function stopRec() {
    stopRecRef.current?.()
    stopRecRef.current = null
    clearInterval(timerRef.current)
    setRecording(false)
    setInterimText('')
  }

  async function analyze() {
    const text = transcriptRef.current.trim()
    if (!text) { setError('No transcript to analyze. Record or type something first.'); return }
    if (!isModelReady()) { setError('Model not loaded — complete setup first.'); return }

    setProcessing(true)
    setStream('')
    setError('')

    try {
      let raw = ''
      // Simple prompt — works well with small models
      await generateText(
        `Summarize meeting & action items:\n\n"${text.slice(0, 500)}"\n\n2 sentence summary, 3 actions:`,
        {
          systemPrompt: 'Meeting assistant. Brief summary + actions.',
          maxTokens: 45,
          temperature: 0,
          onToken: (_, acc) => { raw = acc; setStream(acc) },
        }
      )

      const { summary, actionItems } = parseMeetingOutput(raw)

      const meeting: Meeting = {
        id: Date.now().toString(),
        title: title.trim() || `Meeting — ${new Date().toLocaleDateString()}`,
        transcript: transcriptRef.current,
        summary,
        actionItems: actionItems.length > 0 ? actionItems : ['Review meeting notes', 'Follow up with attendees'],
        duration: elapsed,
        createdAt: Date.now(),
      }

      const updated = [meeting, ...meetings]
      setMeetings(updated)
      saveMeetings(updated)
      setSelected(meeting)
      setTranscript('')
      setTitle('')
      setElapsed(0)
    } catch (e: any) {
      setError(e?.message ?? 'Analysis failed — check that the model is loaded.')
    } finally {
      setProcessing(false)
      setStream('')
    }
  }

  function deleteMeeting(id: string) {
    const updated = meetings.filter(m => m.id !== id)
    setMeetings(updated)
    saveMeetings(updated)
    if (selected?.id === id) setSelected(null)
  }

  function exportMeeting(m: Meeting) {
    const text = `# ${m.title}\n${new Date(m.createdAt).toLocaleString()}\n\n## Summary\n${m.summary}\n\n## Action Items\n${m.actionItems.map(a => `- ${a}`).join('\n')}\n\n## Full Transcript\n${m.transcript}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${m.title.replace(/\s+/g, '_')}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  function fmt(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel */}
      <div className="w-80 flex-shrink-0 border-r border-white/5 flex flex-col bg-surface/50">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose/15 border border-rose/30 flex items-center justify-center">
              <Mic size={14} className="text-rose" />
            </div>
            <div>
              <p className="text-bright font-semibold text-sm">Meeting Recorder</p>
              <p className="text-[10px] text-dim font-mono">Local speech · AI summary</p>
            </div>
          </div>

          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Meeting title (optional)…" className="input text-xs" />

          <motion.button whileTap={{ scale: 0.96 }}
            onClick={recording ? stopRec : startRec}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              recording ? 'bg-rose text-white border border-rose/60 animate-pulse' : 'bg-rose/10 text-rose border border-rose/30 hover:bg-rose/20'
            }`}>
            {recording ? <><Square size={14} /> Stop · {fmt(elapsed)}</> : <><Mic size={14} /> Start Recording</>}
          </motion.button>

          {/* Manual transcript entry - always shown when not recording */}
          {!recording && (
            <div>
              <p className="text-[10px] text-dim mb-1">Or type/paste transcript manually:</p>
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Type or paste meeting notes here…"
                className="input text-xs resize-none w-full"
                rows={3}
              />
            </div>
          )}

          {/* Live transcript */}
          {recording && (transcript || interimText) && (
            <div className="p-3 rounded-xl bg-card border border-rose/20 text-xs text-text leading-relaxed max-h-24 overflow-y-auto">
              <span className="text-dim">{transcript}</span>
              {interimText && <span className="text-muted italic"> {interimText}</span>}
              <span className="ai-cursor ml-1" />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-rose/10 border border-rose/20 text-rose text-[10px]">
              <AlertCircle size={10} className="mt-0.5 flex-shrink-0" />{error}
            </div>
          )}

          {transcript && !recording && (
            <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              onClick={analyze} disabled={processing}
              className="w-full py-2.5 rounded-xl bg-accent/15 text-accent border border-accent/30 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-accent/25 transition-all disabled:opacity-50">
              {processing ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {processing ? 'Analyzing…' : 'AI Analyze & Save'}
            </motion.button>
          )}

          {processing && stream && (
            <p className="text-[10px] text-dim font-mono line-clamp-3 leading-relaxed">{stream}<span className="ai-cursor" /></p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="text-[10px] text-dim uppercase tracking-wide font-semibold px-1 mb-2">Past Meetings ({meetings.length})</p>
          {meetings.length === 0 ? (
            <div className="text-center py-8 text-dim text-xs"><Users size={24} className="mx-auto mb-2 opacity-30" />No meetings yet</div>
          ) : meetings.map(m => (
            <motion.div key={m.id} layout onClick={() => setSelected(m)}
              className={`p-3 rounded-xl cursor-pointer border transition-all ${
                selected?.id === m.id ? 'bg-accent/10 border-accent/25' : 'bg-card border-border hover:border-muted'}`}>
              <p className="text-xs font-semibold text-text truncate">{m.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={9} className="text-dim" />
                <span className="text-[10px] text-dim">{new Date(m.createdAt).toLocaleDateString()}</span>
                {m.duration > 0 && <span className="text-[10px] text-dim">· {fmt(m.duration)}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <div>
                <p className="text-bright font-semibold">{selected.title}</p>
                <p className="text-[10px] text-dim font-mono mt-0.5">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={async () => {
                  await navigator.clipboard.writeText(`${selected.summary}\n\nAction Items:\n${selected.actionItems.map(a => `• ${a}`).join('\n')}`)
                  setCopied(true); setTimeout(() => setCopied(false), 1800)
                }} className="btn-ghost text-xs">
                  {copied ? <CheckCheck size={12} className="text-accent" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={() => exportMeeting(selected)} className="btn-ghost text-xs"><Download size={12} /> Export</button>
                <button onClick={() => deleteMeeting(selected.id)} className="btn-ghost text-xs text-rose/70 hover:text-rose"><Trash2 size={12} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="p-4 rounded-2xl bg-iris/5 border border-iris/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={12} className="text-iris" />
                  <span className="text-xs font-semibold text-iris uppercase tracking-wide">AI Summary</span>
                </div>
                <p className="text-sm text-text leading-relaxed">{selected.summary}</p>
              </div>

              {selected.actionItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Play size={12} className="text-accent" />
                    <span className="text-xs font-semibold text-accent uppercase tracking-wide">Action Items ({selected.actionItems.length})</span>
                  </div>
                  <ul className="space-y-2">
                    {selected.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-text">
                        <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[9px] font-bold text-accent">{i + 1}</span>
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl bg-card border border-border overflow-hidden">
                <button onClick={() => setExpanded(expanded === 'tr' ? null : 'tr')}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-text">
                  <div className="flex items-center gap-2"><FileText size={13} className="text-dim" />Full Transcript</div>
                  {expanded === 'tr' ? <ChevronUp size={13} className="text-dim" /> : <ChevronDown size={13} className="text-dim" />}
                </button>
                <AnimatePresence>
                  {expanded === 'tr' && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <p className="px-4 pb-4 text-xs text-dim leading-relaxed border-t border-border pt-3">{selected.transcript}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl bg-rose/10 border border-rose/20 flex items-center justify-center mb-4">
              <Mic size={24} className="text-rose" />
            </motion.div>
            <h3 className="text-bright font-bold text-lg mb-2">Meeting Transcription</h3>
            <p className="text-dim text-sm max-w-sm leading-relaxed mb-2">
              Record any meeting or lecture — AI will summarize and extract action items.
            </p>
            <p className="text-[11px] text-dim/60 font-mono mb-1">Speech recognition uses browser API (needs internet)</p>
            <p className="text-[11px] text-dim/60 font-mono">AI analysis is 100% on-device · nothing uploaded</p>
          </div>
        )}
      </div>
    </div>
  )
}
