import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SetupScreen from './components/SetupScreen'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import UniversalSearchPage from './pages/UniversalSearchPage'
import FocusModePage from './pages/FocusModePage'
import NotesPage from './pages/NotesPage'
import ChatPage from './pages/ChatPage'
import WritingPage from './pages/WritingPage'
import VoicePage from './pages/VoicePage'
import DocsPage from './pages/DocsPage'
import MemoryPage from './pages/MemoryPage'
import PrivacyPage from './pages/PrivacyPage'
import TasksPage from './pages/TasksPage'
import MeetingPage from './pages/MeetingPage'
import LanguagePage from './pages/LanguagePage'
import CodeDocsPage from './pages/CodeDocsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AITutorPage from './pages/AITutorPage'
import { getStorageStats } from './lib/storage'

export type Page = 'home' | 'search' | 'focus' | 'notes' | 'chat' | 'writing' | 'voice' | 'docs' | 'memory' | 'privacy' | 'tasks' | 'meeting' | 'language' | 'codedocs' | 'analytics' | 'tutor'

export const MODEL_KEY = 'sb_model_v4'

export default function App() {
  const [ready,  setReady]  = useState(false)
  const [page,   setPage]   = useState<Page>('home')
  const [stats,  setStats]  = useState({ notes: 0, tasks: 0, memories: 0 })

  useEffect(() => {
    ;['sb_setup_v2','sb_setup_v1','ra_setup_done','sb_model_id','sb_model_id_v3']
      .forEach(k => localStorage.removeItem(k))
  }, [])

  function onReady(modelId: string) {
    localStorage.setItem(MODEL_KEY, modelId)
    setReady(true)
  }

  function refreshStats() {
    getStorageStats().then(s =>
      setStats({ notes: s.notes, tasks: s.tasks, memories: s.memories })
    )
  }

  useEffect(() => {
    if (ready) refreshStats()
  }, [ready, page])

  if (!ready) {
    return <SetupScreen onReady={onReady} />
  }

  const PAGES: Record<Page, React.ReactNode> = {
    home:     <HomePage    onNavigate={setPage} />,
    search:   <UniversalSearchPage onNavigate={setPage} />,
    focus:    <FocusModePage />,
    notes:    <NotesPage   onStatsChange={refreshStats} />,
    chat:     <ChatPage />,
    writing:  <WritingPage />,
    voice:    <VoicePage />,
    docs:     <DocsPage   onStatsChange={refreshStats} />,
    memory:   <MemoryPage  onStatsChange={refreshStats} />,
    privacy:  <PrivacyPage />,
    tasks:    <TasksPage   onStatsChange={refreshStats} />,
    meeting:  <MeetingPage />,
    language: <LanguagePage />,
    codedocs: <CodeDocsPage />,
    analytics: <AnalyticsPage />,
    tutor:    <AITutorPage />,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-void">
      <Sidebar page={page} onNavigate={setPage} stats={stats} />
      <main className="flex flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="flex flex-1 overflow-hidden"
          >
            {PAGES[page]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
