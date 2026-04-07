import { motion } from 'framer-motion'
import { FileText, MessageSquare, PenLine, Brain, BookOpen, Database, Shield, Zap, CheckSquare, Mic, Globe, Code2, Users, WifiOff, BarChart3, Lightbulb, Home, Search, Target } from 'lucide-react'
import type { Page } from '../App'

const NAV_GROUPS = [
  { label: 'Productivity', items: [
    { id: 'search'   as Page, label: 'Search',     icon: Search,        badge: null,                color: '#22d3ee' },
    { id: 'focus'    as Page, label: 'Focus Mode', icon: Target,        badge: null,                color: '#fb923c' },
  ]},
  { label: 'Create', items: [
    { id: 'notes'    as Page, label: 'Notes',      icon: FileText,      badge: (s:any)=>s.notes,    color: '#60a5fa' },
    { id: 'writing'  as Page, label: 'Writing',    icon: PenLine,       badge: null,                color: '#f472b6' },
    { id: 'tasks'    as Page, label: 'Tasks',      icon: CheckSquare,   badge: (s:any)=>s.tasks,    color: '#34d399' },
  ]},
  { label: 'AI Tools', items: [
    { id: 'chat'     as Page, label: 'AI Chat',    icon: MessageSquare, badge: null,                color: '#818cf8' },
    { id: 'docs'     as Page, label: 'Documents',  icon: BookOpen,      badge: null,                color: '#fb923c' },
    { id: 'tutor'    as Page, label: 'AI Tutor',   icon: Lightbulb,     badge: null,                color: '#fbbf24' },
    { id: 'codedocs' as Page, label: 'Code Docs',  icon: Code2,         badge: null,                color: '#4ade80' },
    { id: 'meeting'  as Page, label: 'Meetings',   icon: Users,         badge: null,                color: '#f87171' },
  ]},
  { label: 'Learn', items: [
    { id: 'language' as Page, label: 'Languages',  icon: Globe,         badge: null,                color: '#fbbf24' },
    { id: 'voice'    as Page, label: 'Study AI',   icon: Brain,         badge: null,                color: '#2dd4bf' },
  ]},
  { label: 'Personal', items: [
    { id: 'memory'   as Page, label: 'Memory',     icon: Database,      badge: (s:any)=>s.memories, color: '#22d3ee' },
    { id: 'analytics' as Page, label: 'Analytics', icon: BarChart3,     badge: null,                color: '#818cf8' },
    { id: 'privacy'  as Page, label: 'Privacy',    icon: Shield,        badge: null,                color: '#94a3b8' },
  ]},
]

interface Props {
  page: Page; onNavigate: (p: Page) => void
  stats: { notes: number; tasks: number; memories: number }
}

export default function Sidebar({ page, onNavigate, stats }: Props) {
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: '#0a1020', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Logo */}
      <div className="px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ boxShadow: ['0 0 12px rgba(99,102,241,0.5)','0 0 28px rgba(99,102,241,0.85)','0 0 12px rgba(99,102,241,0.5)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
          >
            <Zap size={17} className="text-white" />
          </motion.div>
          <div>
            <div className="font-bold text-sm leading-none" style={{ color: '#f1f5f9' }}>ZeroCloud AI</div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="live-dot" style={{ width:5, height:5 }} />
              <span className="text-[9px] font-mono font-bold tracking-widest" style={{ color:'#34d399' }}>OFFLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2.5 overflow-y-auto space-y-4">
        {/* Home Button */}
        <div className="px-0.5">
          <motion.button onClick={() => onNavigate('home')} whileTap={{ scale:0.97 }}
            className={`nav-item ${page === 'home' ? 'nav-item-active' : 'nav-item-idle'}`}>
            {page === 'home' && (
              <motion.div layoutId="sidebar-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                style={{ background: '#6366f1' }} />
            )}
            <Home size={14} style={{ color: page === 'home' ? '#6366f1' : undefined }} />
            <span className="flex-1 text-left font-semibold">Home</span>
          </motion.button>
        </div>

        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="section-label px-2 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ id, label, icon: Icon, badge, color }) => {
                const isActive = page === id
                const count = badge ? badge(stats) : 0
                return (
                  <motion.button key={id} onClick={() => onNavigate(id)} whileTap={{ scale:0.97 }}
                    className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-idle'}`}>
                    {isActive && (
                      <motion.div layoutId="sidebar-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                        style={{ background: color }} />
                    )}
                    <Icon size={14} style={{ color: isActive ? color : undefined }} />
                    <span className="flex-1 text-left">{label}</span>
                    {count > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: isActive ? `${color}25` : 'rgba(255,255,255,0.06)', color: isActive ? color : '#64748b' }}>
                        {count}
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-3 py-2.5 rounded-xl" style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <WifiOff size={10} style={{ color:'#818cf8' }} />
            <span className="text-[10px] font-mono font-bold" style={{ color:'#818cf8' }}>RunAnywhere SDK</span>
          </div>
          <p className="text-[9px] leading-relaxed" style={{ color:'#475569' }}>WebAssembly LLM · Zero cloud · $0 cost</p>
        </div>
      </div>
    </aside>
  )
}
