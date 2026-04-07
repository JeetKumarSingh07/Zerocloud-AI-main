import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Star, Sparkles, Brain, Loader } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { MemoryDB, type Memory } from '../lib/storage'
import { generateText, isModelReady } from '../lib/runanywhere'

interface Props { onStatsChange: () => void }

const T_STYLE: Record<Memory['type'], { label: string; cls: string }> = {
  goal:       { label: '🎯 Goal',       cls: 'text-rose   bg-rose/10   border-rose/25'   },
  preference: { label: '⚡ Preference', cls: 'text-iris   bg-iris/10   border-iris/25'   },
  context:    { label: '🌐 Context',    cls: 'text-amber  bg-amber/10  border-amber/25'  },
  fact:       { label: '📌 Fact',       cls: 'text-accent bg-accent/10 border-accent/25' },
}

export default function MemoryPage({ onStatsChange }: Props) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [type, setType] = useState<Memory['type']>('fact')
  const [importance, setImportance] = useState(3)
  const [extractInput, setExtractInput] = useState('')
  const [extracting, setExtracting] = useState(false)

  useEffect(() => { load() }, [])
  async function load() { setMemories(await MemoryDB.getAll()); onStatsChange() }

  async function add() {
    if (!content.trim()) return
    await MemoryDB.put({ id: uuidv4(), content: content.trim(), type, importance, createdAt: Date.now() })
    setContent(''); setShowForm(false); await load()
  }

  async function del(id: string) { await MemoryDB.delete(id); await load() }

  async function extract() {
    if (!extractInput.trim() || !isModelReady()) { if (!isModelReady()) alert('Model not loaded.'); return }
    setExtracting(true)
    try {
      let raw = ''
      await generateText(
        `Extract memories as JSON:\n[{"content":"...","type":"preference|fact|context|goal","importance":1-5}]\n\nText: "${extractInput}"\n\nJSON:`,
        { systemPrompt: 'Extract memories. JSON only.', maxTokens: 60, temperature: 0, onToken: (_, a) => { raw = a } }
      )
      const arr = JSON.parse(raw.replace(/```json|```/g, '').trim())
      for (const item of arr) {
        await MemoryDB.put({ id: uuidv4(), content: item.content, type: item.type ?? 'fact', importance: item.importance ?? 3, createdAt: Date.now() })
      }
      setExtractInput(''); await load()
    } catch (e) { console.error(e) } finally { setExtracting(false) }
  }

  const grouped = (['goal','preference','context','fact'] as Memory['type'][])
    .map(t => ({ type: t, items: memories.filter(m => m.type === t) }))
    .filter(g => g.items.length > 0)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div>
          <p className="text-bright font-semibold text-sm">Persistent Memory</p>
          <p className="text-[10px] text-dim font-mono">Injected into every AI response · Stored locally</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-accent text-xs">
          <Plus size={12} />Remember This
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <textarea autoFocus value={content} onChange={e => setContent(e.target.value)}
                placeholder="What should I remember? e.g. 'I prefer concise answers' or 'My deadline is Friday'"
                className="input resize-none" rows={2} />
              <div className="flex items-center gap-2 flex-wrap">
                {(Object.keys(T_STYLE) as Memory['type'][]).map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${type === t ? T_STYLE[t].cls : 'text-dim border-border hover:border-muted'}`}>
                    {T_STYLE[t].label}
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-auto">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setImportance(n)} className={`transition-colors ${n <= importance ? 'text-amber' : 'text-muted'}`}>
                      <Star size={13} fill={n <= importance ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="btn-ghost text-xs">Cancel</button>
                <button onClick={add} className="btn-accent text-xs">Save</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Extract */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={12} className="text-iris" />
            <span className="text-xs font-semibold text-iris">AI Memory Extraction</span>
            <span className="text-[10px] text-dim font-mono ml-auto">local LLM</span>
          </div>
          <textarea value={extractInput} onChange={e => setExtractInput(e.target.value)}
            placeholder="Paste text and let AI extract memorable facts automatically…"
            className="input resize-none mb-2" rows={2} />
          <button onClick={extract} disabled={!extractInput.trim() || extracting} className="btn-accent text-xs disabled:opacity-40">
            {extracting ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Extract Memories
          </button>
        </div>

        {/* Grouped memories */}
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-dim gap-2">
            <Brain size={32} className="opacity-25" />
            <p className="text-sm">No memories yet</p>
            <p className="text-xs">Add memories to personalize AI responses</p>
          </div>
        ) : grouped.map(({ type: t, items }) => (
          <div key={t}>
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs mb-3 ${T_STYLE[t].cls}`}>
              {T_STYLE[t].label}
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {items.map(m => (
                  <motion.div key={m.id} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className="group flex items-start gap-3 p-3 rounded-xl bg-card border border-border hover:border-muted transition-all">
                    <div className="flex-1">
                      <p className="text-sm text-text leading-relaxed">{m.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} size={9} className={n <= m.importance ? 'text-amber' : 'text-muted'} fill={n <= m.importance ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                        <span className="text-[10px] text-dim font-mono">{new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button onClick={() => del(m.id)} className="opacity-0 group-hover:opacity-100 text-dim hover:text-rose transition-all flex-shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
