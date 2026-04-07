import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles, Trash2, CheckSquare, Square, Loader } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { TasksDB, NotesDB, type Task } from '../lib/storage'
import { generateText, isModelReady } from '../lib/runanywhere'

interface Props { onStatsChange: () => void }

const P_STYLE: Record<Task['priority'], string> = {
  high:   'text-rose bg-rose/10 border-rose/25',
  medium: 'text-amber bg-amber/10 border-amber/25',
  low:    'text-dim  bg-muted/10 border-muted/25',
}
const COLS: { id: Task['status']; label: string; color: string }[] = [
  { id: 'todo',        label: 'To Do',       color: 'text-soft'   },
  { id: 'in-progress', label: 'In Progress', color: 'text-iris'   },
  { id: 'done',        label: 'Done',        color: 'text-accent' },
]

export default function TasksPage({ onStatsChange }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPrio, setNewPrio] = useState<Task['priority']>('medium')
  const [extracting, setExtracting] = useState(false)
  const [planning, setPlanning] = useState(false)
  const [plan, setPlan] = useState(''); const [planStream, setPlanStream] = useState('')

  useEffect(() => { load() }, [])
  async function load() { setTasks(await TasksDB.getAll()); onStatsChange() }

  async function addTask() {
    if (!newTitle.trim()) return
    await TasksDB.put({ id: uuidv4(), title: newTitle.trim(), priority: newPrio, status: 'todo', createdAt: Date.now(), updatedAt: Date.now() })
    setNewTitle(''); setShowForm(false); await load()
  }

  async function cycleStatus(t: Task) {
    const next: Task['status'] = t.status === 'todo' ? 'in-progress' : t.status === 'in-progress' ? 'done' : 'todo'
    await TasksDB.put({ ...t, status: next, updatedAt: Date.now() }); await load()
  }

  async function del(id: string) { await TasksDB.delete(id); await load() }

  async function extractFromNotes() {
    if (!isModelReady()) { alert('Model not loaded.'); return }
    setExtracting(true)
    try {
      const notes = await NotesDB.getAll()
      if (!notes.length) { alert('Add some notes first!'); return }
      const txt = notes.slice(0, 5).map(n => `"${n.title}": ${n.content.slice(0, 300)}`).join('\n\n')
      let raw = ''
      await generateText(
        `Extract tasks from notes as JSON:\n[{"title":"...","priority":"high|medium|low"}]\n\nNotes:\n${txt}\n\nJSON:`,
        { systemPrompt: 'Extract tasks. JSON only.', maxTokens: 60, temperature: 0, onToken: (_, a) => { raw = a } }
      )
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const arr = JSON.parse(cleaned)
      for (const item of arr) {
        await TasksDB.put({ id: uuidv4(), title: item.title, priority: item.priority ?? 'medium', status: 'todo', createdAt: Date.now(), updatedAt: Date.now() })
      }
      await load()
    } catch (e) { console.error(e) } finally { setExtracting(false) }
  }

  async function generatePlan() {
    if (!isModelReady()) { alert('Model not loaded.'); return }
    setPlanning(true); setPlan(''); setPlanStream('')
    try {
      const pending = tasks.filter(t => t.status !== 'done')
      if (!pending.length) { setPlan('No pending tasks! Add some tasks first.'); return }
      const list = pending.map(t => `[${t.priority.toUpperCase()}] ${t.title}`).join('\n')
      let full = ''
      await generateText(
        `Tasks:\n${list}\n\nDaily plan with order & tips:`,
        { systemPrompt: 'Brief plan, bullet points.', maxTokens: 60, temperature: 0, onToken: (_, a) => { full = a; setPlanStream(a) } }
      )
      setPlan(full)
    } finally { setPlanning(false); setPlanStream('') }
  }

  const col = (s: Task['status']) => tasks.filter(t => t.status === s)

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-bright font-semibold text-sm">Tasks</span>
          <div className="flex gap-2">
            <button onClick={extractFromNotes} disabled={extracting} className="btn-ghost text-xs">
              {extracting ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
              From Notes
            </button>
            <button onClick={generatePlan} disabled={planning} className="btn-accent text-xs">
              {planning ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AI Plan
            </button>
            <button onClick={() => setShowForm(v => !v)} className="btn-accent text-xs">
              <Plus size={12} />Add
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* New task form */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-4 rounded-2xl bg-card border border-border space-y-3">
                <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="Task title…" className="input" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dim">Priority:</span>
                  {(['low','medium','high'] as Task['priority'][]).map(p => (
                    <button key={p} onClick={() => setNewPrio(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs border capitalize transition-all ${newPrio === p ? P_STYLE[p] : 'text-dim border-border hover:border-muted'}`}>
                      {p}
                    </button>
                  ))}
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => setShowForm(false)} className="btn-ghost text-xs">Cancel</button>
                    <button onClick={addTask} className="btn-accent text-xs">Add</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Kanban */}
          <div className="grid grid-cols-3 gap-4">
            {COLS.map(col_ => (
              <div key={col_.id}>
                <div className={`flex items-center gap-2 mb-3 ${col_.color}`}>
                  <span className="text-xs font-semibold uppercase tracking-wide">{col_.label}</span>
                  <span className="text-[10px] bg-card border border-border px-1.5 py-0.5 rounded-full text-dim font-mono">{col(col_.id).length}</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {col(col_.id).map(task => (
                      <motion.div key={task.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="group p-3 rounded-xl bg-card border border-border hover:border-muted transition-all">
                        <div className="flex items-start gap-2">
                          <button onClick={() => cycleStatus(task)} className="mt-0.5 flex-shrink-0 text-dim hover:text-accent transition-colors">
                            {task.status === 'done' ? <CheckSquare size={14} className="text-accent" /> : <Square size={14} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-snug ${task.status === 'done' ? 'line-through text-dim' : 'text-text'}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${P_STYLE[task.priority]}`}>{task.priority}</span>
                            </div>
                          </div>
                          <button onClick={() => del(task.id)} className="opacity-0 group-hover:opacity-100 text-dim hover:text-rose transition-all flex-shrink-0">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {col(col_.id).length === 0 && (
                    <div className="h-14 rounded-xl border border-dashed border-border flex items-center justify-center">
                      <span className="text-xs text-dim">Empty</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan sidebar */}
      <AnimatePresence>
        {(planning || plan || planStream) && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="border-l border-border flex-shrink-0 overflow-hidden">
            <div className="w-[280px] h-full flex flex-col p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={12} className="text-iris" />
                <span className="text-xs font-semibold text-iris uppercase tracking-wide">AI Daily Plan</span>
                <span className="text-[10px] text-dim font-mono ml-auto">local LLM</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                  {planStream || plan}
                  {planning && <span className="ai-cursor" />}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
