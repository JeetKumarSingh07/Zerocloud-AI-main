import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles, Trash2, Pin, PinOff, Search, Loader, Clock } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { NotesDB, type Note } from '../lib/storage'
import { generateText, isModelReady } from '../lib/runanywhere'

const SUMMARIZE_SYS = `Analyze the given note. Respond in exactly this format:

SUMMARY: [2 sentence summary]

BULLETS:
• [key insight 1]
• [key insight 2]
• [key insight 3]

Be brief and extract the most valuable information.`

interface Props { onStatsChange: () => void }

function timeAgo(ts: number) {
  const d = Date.now() - ts
  if (d < 60000) return 'just now'
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`
  return new Date(ts).toLocaleDateString()
}

export default function NotesPage({ onStatsChange }: Props) {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [search, setSearch] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [stream, setStream] = useState('')
  const saveTimer = useRef<any>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const all = await NotesDB.getAll()
    setNotes(all)
    onStatsChange()
  }

  async function save(id: string, t: string, c: string) {
    const existing = await NotesDB.get(id)
    if (!existing) return
    await NotesDB.put({ ...existing, title: t, content: c, updatedAt: Date.now() })
    const all = await NotesDB.getAll()
    setNotes(all)
  }

  function onTitleChange(v: string) {
    setTitle(v)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (selectedId) saveTimer.current = setTimeout(() => save(selectedId, v, content), 700)
  }

  function onContentChange(v: string) {
    setContent(v)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (selectedId) saveTimer.current = setTimeout(() => save(selectedId, title, v), 700)
  }

  async function newNote() {
    const note: Note = {
      id: uuidv4(), title: 'Untitled Note', content: '',
      tags: [], pinned: false, createdAt: Date.now(), updatedAt: Date.now(),
    }
    await NotesDB.put(note)
    await load()
    setSelectedId(note.id); setTitle(note.title); setContent(note.content); setStream('')
  }

  function selectNote(n: Note) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSelectedId(n.id); setTitle(n.title); setContent(n.content); setStream('')
  }

  async function deleteNote(id: string) {
    await NotesDB.delete(id)
    if (selectedId === id) { setSelectedId(null); setTitle(''); setContent('') }
    await load()
  }

  async function togglePin(n: Note) {
    await NotesDB.put({ ...n, pinned: !n.pinned, updatedAt: Date.now() })
    await load()
  }

  async function summarize() {
    const note = notes.find(n => n.id === selectedId)
    if (!note || !content.trim()) return
    if (!isModelReady()) { alert('AI model not loaded — please complete setup first.'); return }
    setSummarizing(true); setStream('')
    try {
      let full = ''
      await generateText(
        `Title: ${title}\n\nContent:\n${content}`,
        {
          systemPrompt: SUMMARIZE_SYS, maxTokens: 50, temperature: 0,
          onToken: (_, acc) => { full = acc; setStream(acc) },
        }
      )
      const summaryM = full.match(/SUMMARY:\s*(.+?)(?=BULLETS:|$)/s)
      const bulletsM = [...full.matchAll(/•\s*(.+)/g)]
      await NotesDB.put({
        ...note,
        title, content,
        summary: summaryM?.[1]?.trim(),
        bullets: bulletsM.map(m => m[1].trim()),
        updatedAt: Date.now(),
      })
      await load()
    } finally { setSummarizing(false); setStream('') }
  }

  const filtered = notes.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  )
  const selected = notes.find(n => n.id === selectedId)

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* List panel */}
      <div className="w-64 flex-shrink-0 border-r border-border flex flex-col bg-surface/30">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-bright font-semibold text-sm">Notes</span>
            <button onClick={newNote} className="btn-accent py-1 px-2 text-xs"><Plus size={12} />New</button>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…" className="input pl-7 py-1.5 text-xs" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-dim text-xs gap-2">
              <p>No notes yet</p>
              <button onClick={newNote} className="text-accent hover:underline text-xs">Create one →</button>
            </div>
          ) : filtered.map(n => (
            <motion.div key={n.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => selectNote(n)}
              className={`group relative px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                selectedId === n.id ? 'bg-accent/10 border border-accent/20' : 'hover:bg-card border border-transparent hover:border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-0.5">
                <p className="text-sm font-medium text-text truncate">{n.title}</p>
                {n.pinned && <Pin size={9} className="text-accent flex-shrink-0 mt-0.5" />}
              </div>
              <p className="text-xs text-dim line-clamp-2 leading-relaxed">
                {n.content || <span className="italic">Empty…</span>}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <Clock size={9} className="text-dim" />
                <span className="text-[10px] text-dim">{timeAgo(n.updatedAt)}</span>
                {n.summary && <span className="ml-auto text-[10px] text-iris">✦ AI</span>}
              </div>
              {/* hover actions */}
              <div className="absolute right-2 top-2 hidden group-hover:flex gap-1">
                <button onClick={e => { e.stopPropagation(); togglePin(n) }}
                  className="p-1 rounded hover:bg-muted/30 text-dim hover:text-accent">
                  {n.pinned ? <PinOff size={10} /> : <Pin size={10} />}
                </button>
                <button onClick={e => { e.stopPropagation(); deleteNote(n.id) }}
                  className="p-1 rounded hover:bg-rose/20 text-dim hover:text-rose">
                  <Trash2 size={10} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="flex items-center justify-between px-6 py-3 border-b border-border">
              <input value={title} onChange={e => onTitleChange(e.target.value)}
                className="flex-1 bg-transparent text-bright font-semibold text-lg focus:outline-none placeholder-dim"
                placeholder="Note title…" />
              <button onClick={summarize} disabled={!content.trim() || summarizing}
                className="btn-accent disabled:opacity-40 disabled:cursor-not-allowed">
                {summarizing ? <Loader size={13} className="animate-spin" /> : <Sparkles size={13} />}
                AI Summarize
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <textarea value={content} onChange={e => onContentChange(e.target.value)}
                className="w-full h-64 bg-transparent text-text text-sm leading-7 px-6 py-4 focus:outline-none resize-none placeholder-dim"
                placeholder="Start writing… stored locally, never leaves your device." />

              {/* AI insights */}
              <AnimatePresence>
                {(summarizing || selected.summary) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mx-6 mb-6 rounded-2xl bg-iris/5 border border-iris/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={12} className="text-iris" />
                      <span className="text-xs font-semibold text-iris uppercase tracking-wide">
                        AI Insights · Local LLM via RunAnywhere
                      </span>
                    </div>
                    {summarizing ? (
                      <p className={`text-sm text-text leading-relaxed ${stream ? '' : 'ai-cursor'}`}>
                        {stream || ' '}{stream && <span className="ai-cursor" />}
                      </p>
                    ) : (
                      <>
                        {selected.summary && <p className="text-sm text-text leading-relaxed mb-3">{selected.summary}</p>}
                        {selected.bullets?.length ? (
                          <ul className="space-y-1.5">
                            {selected.bullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-dim">
                                <span className="text-iris mt-0.5">•</span>{b}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-dim gap-3">
            <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center">
              <FileText size={22} className="opacity-30" />
            </div>
            <p className="text-sm">Select a note or create a new one</p>
            <button onClick={newNote} className="btn-accent"><Plus size={13} />New Note</button>
          </div>
        )}
      </div>
    </div>
  )
}

function FileText({ size, className }: any) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
}
