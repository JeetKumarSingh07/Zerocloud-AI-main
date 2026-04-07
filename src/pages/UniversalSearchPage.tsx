import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Sparkles, FileText, MessageSquare, CheckSquare, BookOpen,
  Brain, Clock, TrendingUp, Zap, Target, ChevronRight, Loader,
  Filter, Calendar, Hash, X, ArrowRight
} from 'lucide-react'
import { generateText, isModelReady } from '../lib/runanywhere'
import { NotesDB, TasksDB, ChatDB, MemoryDB } from '../lib/storage'
import type { Page } from '../App'

interface SearchResult {
  id: string
  type: 'note' | 'task' | 'chat' | 'memory' | 'doc'
  title: string
  content: string
  snippet: string
  relevance: number
  timestamp: number
  icon: any
  color: string
}

export default function UniversalSearchPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [aiInsight, setAiInsight] = useState('')
  const [filter, setFilter] = useState<'all' | 'note' | 'task' | 'chat' | 'memory'>('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'recent'>('relevance')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function search() {
    if (!query.trim()) return

    setSearching(true)
    setResults([])
    setAiInsight('')

    try {
      const [notes, tasks, chats, memories] = await Promise.all([
        NotesDB.getAll(),
        TasksDB.getAll(),
        ChatDB.getSession('main'),
        MemoryDB.getAll()
      ])

      const searchLower = query.toLowerCase()
      const allResults: SearchResult[] = []

      // Search notes
      notes.forEach(note => {
        const titleMatch = note.title.toLowerCase().includes(searchLower)
        const contentMatch = note.content.toLowerCase().includes(searchLower)
        if (titleMatch || contentMatch) {
          const relevance = titleMatch ? 100 : 50
          allResults.push({
            id: note.id,
            type: 'note',
            title: note.title,
            content: note.content,
            snippet: note.content.slice(0, 120) + '...',
            relevance,
            timestamp: note.createdAt,
            icon: FileText,
            color: 'text-iris'
          })
        }
      })

      // Search tasks
      tasks.forEach(task => {
        if (task.title.toLowerCase().includes(searchLower)) {
          allResults.push({
            id: task.id,
            type: 'task',
            title: task.title,
            content: task.title,
            snippet: `${task.status} • ${task.priority} priority`,
            relevance: 80,
            timestamp: task.createdAt,
            icon: CheckSquare,
            color: 'text-accent'
          })
        }
      })

      // Search chats
      chats.filter((c: any) => c.role === 'user').forEach((chat: any) => {
        if (chat.content.toLowerCase().includes(searchLower)) {
          allResults.push({
            id: chat.id,
            type: 'chat',
            title: 'Chat Message',
            content: chat.content,
            snippet: chat.content.slice(0, 120) + '...',
            relevance: 60,
            timestamp: chat.timestamp,
            icon: MessageSquare,
            color: 'text-amber'
          })
        }
      })

      // Search memories
      memories.forEach(mem => {
        if (mem.content.toLowerCase().includes(searchLower)) {
          allResults.push({
            id: mem.id,
            type: 'memory',
            title: 'Memory',
            content: mem.content,
            snippet: mem.content,
            relevance: 70,
            timestamp: mem.createdAt,
            icon: Brain,
            color: 'text-rose'
          })
        }
      })

      // Filter by type
      const filtered = filter === 'all' ? allResults : allResults.filter(r => r.type === filter)

      // Sort
      const sorted = sortBy === 'relevance'
        ? filtered.sort((a, b) => b.relevance - a.relevance)
        : filtered.sort((a, b) => b.timestamp - a.timestamp)

      setResults(sorted)

      // Generate AI insight if model ready
      if (sorted.length > 0 && isModelReady()) {
        let insight = ''
        await generateText(
          `Search: "${query}"\nFound ${sorted.length} results: ${sorted.slice(0, 3).map(r => r.title).join(', ')}\n\nOne insight (15 words):`,
          { maxTokens: 30, temperature: 0.2, onToken: (_, a) => { insight = a } }
        )
        setAiInsight(insight || `Found ${sorted.length} relevant items across your workspace.`)
      }
    } catch (e) {
      console.error('Search error:', e)
    } finally {
      setSearching(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') search()
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-br from-void via-void to-iris/5">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/50 backdrop-blur-sm flex-shrink-0">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-iris/20 to-accent/10 border border-iris/30 flex items-center justify-center">
              <Search size={20} className="text-iris" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-bright">🔍 Universal AI Search</h1>
              <p className="text-xs text-dim">Search everything • AI-powered insights</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search notes, tasks, chats, memories..."
                className="input w-full pl-10 pr-4 py-3 text-sm"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-text">
                  <X size={16} />
                </button>
              )}
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={search} disabled={!query.trim() || searching}
              className="px-6 py-3 rounded-xl bg-iris text-void font-bold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-iris/20 transition-all">
              {searching ? <Loader size={16} className="animate-spin" /> : 'Search'}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border/50 bg-surface/20 flex items-center gap-3 overflow-x-auto">
        <span className="text-xs font-semibold text-dim whitespace-nowrap">Filter:</span>
        {(['all', 'note', 'task', 'chat', 'memory'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f ? 'bg-iris text-void' : 'bg-card border border-border text-dim hover:text-text'
            }`}>
            {f === 'all' ? '🌐 All' : f === 'note' ? '📝 Notes' : f === 'task' ? '✅ Tasks' : f === 'chat' ? '💬 Chats' : '🧠 Memories'}
          </button>
        ))}
        <div className="w-px h-6 bg-border mx-2" />
        <span className="text-xs font-semibold text-dim whitespace-nowrap">Sort:</span>
        {(['relevance', 'recent'] as const).map(s => (
          <button key={s} onClick={() => setSortBy(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              sortBy === s ? 'bg-accent/15 text-accent' : 'bg-card border border-border text-dim hover:text-text'
            }`}>
            {s === 'relevance' ? '🎯 Relevance' : '🕒 Recent'}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* AI Insight */}
        {aiInsight && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Sparkles size={16} className="text-accent mt-1" />
              <div>
                <p className="text-xs font-bold text-bright mb-1">AI Insight</p>
                <p className="text-sm text-text">{aiInsight}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Count */}
        {results.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-dim">
              Found <span className="font-bold text-bright">{results.length}</span> results for "<span className="text-iris">{query}</span>"
            </p>
          </div>
        )}

        {/* Results List */}
        <AnimatePresence>
          {results.map((result, i) => (
            <motion.div key={result.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-card/50 border border-border hover:border-iris/30 backdrop-blur-sm transition-all cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${result.color.split('-')[1]}/10 flex items-center justify-center flex-shrink-0`}>
                  <result.icon size={16} className={result.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-bright truncate">{result.title}</h3>
                    <span className="text-[9px] uppercase font-bold tracking-wide text-dim">{result.type}</span>
                  </div>
                  <p className="text-xs text-text mb-2">{result.snippet}</p>
                  <div className="flex items-center gap-2 text-[10px] text-dim">
                    <Clock size={10} />
                    <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                    {sortBy === 'relevance' && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Target size={10} className="text-accent" />
                          <span>{result.relevance}% match</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-dim group-hover:text-iris transition-colors flex-shrink-0" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {!searching && results.length === 0 && query && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-dim" />
            </div>
            <h3 className="text-lg font-bold text-bright mb-2">No results found</h3>
            <p className="text-sm text-dim">Try different keywords or adjust your filters</p>
          </motion.div>
        )}

        {/* Initial State */}
        {!searching && results.length === 0 && !query && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-12">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-iris/20 to-accent/10 border border-iris/30 flex items-center justify-center mx-auto mb-4">
              <Search size={40} className="text-iris" />
            </motion.div>
            <h3 className="text-lg font-bold text-bright mb-2">Search Everywhere</h3>
            <p className="text-sm text-dim mb-6">Find anything across notes, tasks, chats, and memories</p>

            {/* Quick Search Suggestions */}
            <div className="max-w-lg mx-auto">
              <p className="text-xs font-bold text-dim uppercase tracking-wide mb-3">Try searching for:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: FileText, label: 'Recent notes', query: 'note' },
                  { icon: CheckSquare, label: 'Tasks to do', query: 'task' },
                  { icon: MessageSquare, label: 'AI conversations', query: 'chat' },
                  { icon: Brain, label: 'Saved memories', query: 'memory' },
                ].map((item, i) => (
                  <motion.button key={i} whileTap={{ scale: 0.95 }}
                    onClick={() => { setQuery(item.query); setTimeout(search, 100) }}
                    className="p-3 rounded-xl bg-card/50 border border-border hover:border-iris/30 transition-all text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon size={14} className="text-iris" />
                      <span className="text-xs font-semibold text-bright">{item.label}</span>
                    </div>
                    <ArrowRight size={10} className="text-dim" />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Searching State */}
        {searching && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full border-4 border-iris/20 border-t-iris mx-auto mb-4" />
            <p className="text-sm text-dim">Searching across all your data...</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
