import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, RefreshCw, Target, Coffee, Zap, Clock,
  CheckCircle, Brain, TrendingUp, Award, Sparkles, Volume2, VolumeX
} from 'lucide-react'
import { generateText, isModelReady } from '../lib/runanywhere'
import { TasksDB } from '../lib/storage'

type FocusMode = 'idle' | 'focus' | 'break' | 'completed'

interface FocusSession {
  startTime: number
  duration: number
  tasksCompleted: number
  mode: 'focus' | 'break'
}

export default function FocusModePage() {
  const [mode, setMode] = useState<FocusMode>('idle')
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes default
  const [focusDuration, setFocusDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [currentTask, setCurrentTask] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [totalFocusTime, setTotalFocusTime] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (mode === 'focus' || mode === 'break') {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [mode])

  function handleTimerComplete() {
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (mode === 'focus') {
      // Focus session completed
      setSessions(prev => [...prev, {
        startTime: Date.now() - focusDuration * 60 * 1000,
        duration: focusDuration,
        tasksCompleted: 1,
        mode: 'focus'
      }])
      setTotalFocusTime(prev => prev + focusDuration)
      setMode('completed')
      if (soundEnabled) playSound('complete')
    } else if (mode === 'break') {
      // Break completed
      setMode('idle')
      if (soundEnabled) playSound('break-end')
    }
  }

  function playSound(type: 'complete' | 'break-end') {
    const audio = new Audio()
    audio.src = type === 'complete'
      ? 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjRMRUxHc19OWmt7j5eXlZaNhHuHhoyTkY+Kh4OAf39+fn54d3J0b2tfYmZqbWtsaGVkZHN/jpOPg3hvcm5rbnN6g4uQlZmbnJyalZWUlZeYmZubm5qZmJiXl5SSkJCOj5CRkZCPj5CRkpOTk5SSj4uHg4B+fXx9'
      : 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBf3l2c3BrbGtra2xub3J4fYWMkpean6Kloqekp6enoJ2aj5OYnaCipKOioqGhoJ+enZybl5WRjYd+eXR1eX+Gg4F+fHp5eXl5eXp7fX+AgYGBgoSGiYyQkZKSk5KRkI+Oj42MiomHhYKAfXt5eHh5en1+f39/fn59fX19'
    audio.play().catch(() => {})
  }

  function startFocus() {
    setTimeLeft(focusDuration * 60)
    setMode('focus')
    if (soundEnabled) playSound('break-end')
  }

  function startBreak() {
    setTimeLeft(breakDuration * 60)
    setMode('break')
  }

  function pauseTimer() {
    setMode('idle')
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  function resetTimer() {
    setMode('idle')
    setTimeLeft(focusDuration * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  async function generateTaskSuggestions() {
    if (!isModelReady()) {
      alert('AI model not loaded. Go to Privacy settings.')
      return
    }

    setLoadingSuggestions(true)
    try {
      const tasks = await TasksDB.getAll()
      const pending = tasks.filter(t => t.status !== 'done').slice(0, 5)

      let suggestions = ''
      await generateText(
        `My tasks: ${pending.map(t => t.title).join(', ')}\n\n3 focus task ideas (short):`,
        { maxTokens: 50, temperature: 0.3, onToken: (_, a) => { suggestions = a } }
      )

      const lines = suggestions.split('\n').filter(l => l.trim()).slice(0, 3)
      setAiSuggestions(lines.map(l => l.replace(/^[•\-\d.]\s*/, '').trim()))
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = mode === 'focus'
    ? ((focusDuration * 60 - timeLeft) / (focusDuration * 60)) * 100
    : mode === 'break'
      ? ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100
      : 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-br from-void via-void to-iris/5">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 0 rgba(99,102,241,0)', '0 0 20px rgba(99,102,241,0.3)', '0 0 0 rgba(99,102,241,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-iris/20 to-accent/10 border border-iris/30 flex items-center justify-center">
              <Target size={20} className="text-iris" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-bright">🎯 Smart Focus Mode</h1>
              <p className="text-xs text-dim">Pomodoro • AI tasks • Deep work</p>
            </div>
          </div>
          <button onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-card border border-border hover:border-iris/30 transition-all">
            {soundEnabled ? <Volume2 size={16} className="text-iris" /> : <VolumeX size={16} className="text-dim" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Main Timer */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative p-12 rounded-3xl bg-gradient-to-br from-iris/10 via-iris/5 to-transparent border border-iris/20 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-iris/5 to-transparent" />

          {/* Progress Ring */}
          <div className="relative">
            <svg className="w-64 h-64 mx-auto transform -rotate-90">
              <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <motion.circle initial={{ strokeDashoffset: 754 }} animate={{ strokeDashoffset: 754 - (754 * progress / 100) }}
                transition={{ duration: 0.5 }}
                cx="128" cy="128" r="120" fill="none"
                stroke={mode === 'focus' ? '#6366f1' : mode === 'break' ? '#22d3ee' : '#475569'}
                strokeWidth="8" strokeDasharray="754" strokeLinecap="round" />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div key={`${minutes}-${seconds}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-7xl font-bold text-bright mb-2">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </motion.div>
              <p className="text-sm font-semibold text-dim uppercase tracking-wide">
                {mode === 'focus' ? '🎯 Focus Time' : mode === 'break' ? '☕ Break Time' : mode === 'completed' ? '✨ Completed!' : '⏸️ Ready'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex gap-3">
          {mode === 'idle' && (
            <>
              <motion.button whileTap={{ scale: 0.95 }} onClick={startFocus}
                className="flex-1 py-4 rounded-2xl bg-iris text-void font-bold text-sm hover:shadow-lg hover:shadow-iris/20 transition-all flex items-center justify-center gap-2">
                <Play size={18} />
                Start Focus
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={startBreak}
                className="px-6 py-4 rounded-2xl bg-accent/15 border border-accent/30 text-accent font-bold text-sm hover:bg-accent/20 transition-all">
                <Coffee size={18} />
              </motion.button>
            </>
          )}
          {(mode === 'focus' || mode === 'break') && (
            <>
              <motion.button whileTap={{ scale: 0.95 }} onClick={pauseTimer}
                className="flex-1 py-4 rounded-2xl bg-amber/15 border border-amber/30 text-amber font-bold text-sm hover:bg-amber/20 transition-all flex items-center justify-center gap-2">
                <Pause size={18} />
                Pause
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={resetTimer}
                className="px-6 py-4 rounded-2xl bg-card border border-border text-text font-bold text-sm hover:border-iris/30 transition-all">
                <RefreshCw size={18} />
              </motion.button>
            </>
          )}
          {mode === 'completed' && (
            <>
              <motion.button whileTap={{ scale: 0.95 }} onClick={startBreak}
                className="flex-1 py-4 rounded-2xl bg-accent text-void font-bold text-sm hover:shadow-lg hover:shadow-accent/20 transition-all flex items-center justify-center gap-2">
                <Coffee size={18} />
                Take Break
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={resetTimer}
                className="flex-1 py-4 rounded-2xl bg-iris/15 border border-iris/30 text-iris font-bold text-sm hover:bg-iris/20 transition-all flex items-center justify-center gap-2">
                <RefreshCw size={18} />
                New Session
              </motion.button>
            </>
          )}
        </div>

        {/* Settings */}
        {mode === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
              <label className="text-xs font-bold text-dim uppercase tracking-wide mb-2 block">Focus Duration</label>
              <div className="flex items-center gap-2">
                <input type="range" min="5" max="60" step="5" value={focusDuration}
                  onChange={e => { setFocusDuration(Number(e.target.value)); setTimeLeft(Number(e.target.value) * 60) }}
                  className="flex-1" />
                <span className="text-sm font-bold text-bright w-12">{focusDuration}min</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
              <label className="text-xs font-bold text-dim uppercase tracking-wide mb-2 block">Break Duration</label>
              <div className="flex items-center gap-2">
                <input type="range" min="5" max="30" step="5" value={breakDuration}
                  onChange={e => setBreakDuration(Number(e.target.value))}
                  className="flex-1" />
                <span className="text-sm font-bold text-bright w-12">{breakDuration}min</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Current Task */}
        {(mode === 'focus' || mode === 'break') && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
            <label className="text-xs font-bold text-dim uppercase tracking-wide mb-2 block">Current Task</label>
            <input value={currentTask} onChange={e => setCurrentTask(e.target.value)}
              placeholder="What are you working on?"
              className="input w-full text-sm" />
          </motion.div>
        )}

        {/* AI Task Suggestions */}
        {mode === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-bright flex items-center gap-2">
                <Brain size={14} className="text-iris" />
                AI Task Suggestions
              </h3>
              <motion.button whileTap={{ scale: 0.95 }} onClick={generateTaskSuggestions} disabled={loadingSuggestions}
                className="text-xs font-semibold text-iris hover:text-iris/80 disabled:opacity-40 flex items-center gap-1">
                {loadingSuggestions ? <Sparkles size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Generate
              </motion.button>
            </div>
            {aiSuggestions.length > 0 ? (
              <div className="space-y-2">
                {aiSuggestions.map((task, i) => (
                  <motion.button key={i} whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentTask(task)}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-iris/5 to-transparent border border-iris/20 hover:border-iris/40 transition-all group">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-iris" />
                      <span className="text-sm text-text flex-1">{task}</span>
                      <Zap size={12} className="text-dim group-hover:text-iris transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-card/30 border border-border text-center">
                <p className="text-xs text-dim">Click Generate to get AI-powered focus task suggestions</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Target, label: 'Sessions', value: sessions.length.toString(), color: 'text-iris' },
            { icon: Clock, label: 'Focus Time', value: `${totalFocusTime}min`, color: 'text-accent' },
            { icon: Award, label: 'Tasks Done', value: sessions.filter(s => s.mode === 'focus').length.toString(), color: 'text-amber' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
              className="p-4 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={12} className={stat.color} />
                <span className="text-[10px] text-dim uppercase font-bold tracking-wide">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
