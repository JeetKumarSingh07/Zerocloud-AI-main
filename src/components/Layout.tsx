import { motion } from 'framer-motion'
import {
  FileText, MessageSquare, PenLine, Mic, BookOpen, Brain, Shield, ChevronLeft
} from 'lucide-react'
import type { Page } from '../App'

const NAV = [
  { id: 'notes'   as Page, icon: FileText,       label: 'Notes'     },
  { id: 'chat'    as Page, icon: MessageSquare,  label: 'Chat'      },
  { id: 'writing' as Page, icon: PenLine,        label: 'Writing'   },
  { id: 'voice'   as Page, icon: Mic,            label: 'Voice'     },
  { id: 'docs'    as Page, icon: BookOpen,       label: 'Docs'      },
  { id: 'memory'  as Page, icon: Brain,          label: 'Memory'    },
  { id: 'privacy' as Page, icon: Shield,         label: 'Settings'  },
]

const PAGE_TITLES: Record<Page, string> = {
  home: 'Home', search: 'Universal Search', focus: 'Focus Mode',
  notes: 'Smart Notes', chat: 'AI Chat',
  writing: 'Writing Assistant', voice: 'Voice AI',
  docs: 'Documents', memory: 'Memory', privacy: 'Settings',
  tasks: 'Tasks', meeting: 'Meetings', language: 'Languages',
  codedocs: 'Code Docs', analytics: 'Analytics', tutor: 'AI Tutor',
}

interface Props {
  page: Page
  onNavigate: (p: Page) => void
  children: React.ReactNode
}

export default function Layout({ page, onNavigate, children }: Props) {
  const title  = PAGE_TITLES[page]

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0a0a0f' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => onNavigate('notes')}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <ChevronLeft size={16} className="text-white/60" />
        </button>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {/* Offline badge */}
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="live-dot" />
          <span className="text-[10px] font-semibold text-green-400">OFFLINE</span>
        </div>
      </div>

      {/* Page content */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>

      {/* Bottom nav */}
      <div className="flex-shrink-0 px-3 pb-safe"
        style={{
          background: 'rgba(10,10,15,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}>
        <div className="flex items-center justify-around py-2">
          {NAV.map(({ id, icon: Icon, label }) => {
            const active = page === id
            return (
              <button key={id} onClick={() => onNavigate(id)}
                className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-150 active:scale-90 min-w-[48px]">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  active ? 'bg-violet' : ''
                }`}
                  style={active ? {
                    background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                    boxShadow: '0 2px 12px rgba(124,58,237,0.4)'
                  } : {}}>
                  <Icon size={15} className={active ? 'text-white' : 'text-white/40'} />
                </div>
                <span className={`text-[9px] font-medium leading-none ${active ? 'text-violet-light' : 'text-white/30'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
