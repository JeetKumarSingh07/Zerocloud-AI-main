import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, TrendingUp, Zap, Clock, Target, Award, Brain,
  Calendar, Star, CheckCircle, BookOpen, FileText, MessageSquare,
  Flame, Trophy, Activity, BarChart3, ArrowRight, Lightbulb,
  Coffee, Sun, Moon, ChevronRight, Plus, Search
} from 'lucide-react'
import { generateText, isModelReady } from '../lib/runanywhere'
import { NotesDB, TasksDB, MemoryDB, ChatDB } from '../lib/storage'
import type { Page } from '../App'

interface DailyInsight {
  icon: any
  title: string
  message: string
  color: string
}

interface QuickStat {
  label: string
  value: string
  icon: any
  color: string
  trend?: string
}

interface AutopilotPlan {
  focus: string
  top3: string[]
  blocks: string[]
  risks: string[]
  nextStep: string
}

function parseLines(raw: string): string[] {
  return raw
    .split('\n')
    .map(line => line.replace(/^[\s\-\*\d\.)]+/, '').trim())
    .filter(Boolean)
}

function parseAutopilot(raw: string): AutopilotPlan {
  const focus = raw.match(/FOCUS:\s*(.+?)(?=TOP_3:|$)/is)?.[1]?.trim() ?? ''
  const top3Block = raw.match(/TOP_3:\s*(.+?)(?=TIME_BLOCKS:|$)/is)?.[1]?.trim() ?? ''
  const blocksBlock = raw.match(/TIME_BLOCKS:\s*(.+?)(?=RISKS:|$)/is)?.[1]?.trim() ?? ''
  const risksBlock = raw.match(/RISKS:\s*(.+?)(?=NEXT_STEP:|$)/is)?.[1]?.trim() ?? ''
  const nextStep = raw.match(/NEXT_STEP:\s*(.+?)$/is)?.[1]?.trim() ?? ''

  const top3 = parseLines(top3Block).slice(0, 3)
  const blocks = parseLines(blocksBlock).slice(0, 4)
  const risks = parseLines(risksBlock).slice(0, 3)

  return {
    focus: focus || 'Complete the highest-impact task first and protect deep-work time.',
    top3: top3.length ? top3 : [
      'Finish your highest-priority pending task.',
      'Review one important note and convert it to actions.',
      'Close one quick follow-up from recent work.',
    ],
    blocks: blocks.length ? blocks : [
      '09:00-10:00 Deep Work: top task',
      '11:00-11:30 Review notes and extract action items',
      '14:00-15:00 Execution sprint',
      '17:00-17:15 Wrap-up and plan tomorrow',
    ],
    risks: risks.length ? risks : [
      'Context switching can reduce focus.',
      'Unplanned interruptions may delay progress.',
      'Large tasks may need smaller sub-steps.',
    ],
    nextStep: nextStep || 'Start the first time block now and complete one concrete outcome.',
  }
}

export default function HomePage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [greeting, setGreeting] = useState('')
  const [dailyInsight, setDailyInsight] = useState<string>('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [stats, setStats] = useState<QuickStat[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [streak, setStreak] = useState(0)
  const [achievements, setAchievements] = useState<any[]>([])
  const [productivityScore, setProductivityScore] = useState(0)
  const [autopilotLoading, setAutopilotLoading] = useState(false)
  const [autopilotPlan, setAutopilotPlan] = useState<AutopilotPlan | null>(null)
  const [autopilotError, setAutopilotError] = useState('')
  const [taskCreatedCount, setTaskCreatedCount] = useState(0)

  useEffect(() => {
    loadDashboard()
    setGreetingMessage()
  }, [])

  function setGreetingMessage() {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 18) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')
  }

  async function loadDashboard() {
    try {
      const [notes, tasks, memories, chats] = await Promise.all([
        NotesDB.getAll(),
        TasksDB.getAll(),
        MemoryDB.getAll(),
        ChatDB.getSession('main')
      ])

      // Calculate stats
      const completedTasks = tasks.filter(t => t.status === 'done').length
      const pendingTasks = tasks.filter(t => t.status !== 'done').length

      setStats([
        { label: 'Notes', value: notes.length.toString(), icon: FileText, color: 'text-iris', trend: '+' + notes.filter(n => Date.now() - n.createdAt < 86400000).length },
        { label: 'Tasks Done', value: completedTasks.toString(), icon: CheckCircle, color: 'text-accent', trend: `${pendingTasks} pending` },
        { label: 'AI Chats', value: chats.length.toString(), icon: MessageSquare, color: 'text-amber', trend: '+' + chats.filter((c: any) => Date.now() - c.timestamp < 86400000).length },
        { label: 'Memories', value: memories.length.toString(), icon: Brain, color: 'text-rose', trend: 'active' },
      ])

      // Calculate productivity score (0-100)
      const score = Math.min(100, Math.round(
        (notes.length * 5) +
        (completedTasks * 10) +
        (chats.length * 2) +
        (memories.length * 3)
      ))
      setProductivityScore(score)

      // Calculate streak (days with activity)
      const today = new Date().setHours(0, 0, 0, 0)
      const yesterday = today - 86400000
      const hasToday = [...notes, ...tasks, ...chats].some((item: any) =>
        item.createdAt >= today || item.timestamp >= today
      )
      const hasYesterday = [...notes, ...tasks, ...chats].some((item: any) =>
        (item.createdAt >= yesterday && item.createdAt < today) ||
        (item.timestamp >= yesterday && item.timestamp < today)
      )
      setStreak(hasToday ? (hasYesterday ? 2 : 1) : 0)

      // Recent activity
      const allItems = [
        ...notes.map(n => ({ type: 'note', title: n.title, time: n.createdAt, icon: FileText })),
        ...tasks.map(t => ({ type: 'task', title: t.title, time: t.createdAt, icon: CheckCircle })),
        ...chats.filter((c: any) => c.role === 'user').slice(0, 5).map((c: any) => ({
          type: 'chat',
          title: c.content.slice(0, 50) + '...',
          time: c.timestamp,
          icon: MessageSquare
        }))
      ].sort((a, b) => b.time - a.time).slice(0, 5)

      setRecentActivity(allItems)

      // Unlock achievements
      const unlocked = []
      if (notes.length >= 5) unlocked.push({ icon: '📝', title: 'Note Taker', desc: '5 notes created' })
      if (completedTasks >= 10) unlocked.push({ icon: '✅', title: 'Task Master', desc: '10 tasks completed' })
      if (chats.length >= 20) unlocked.push({ icon: '💬', title: 'Chat Champion', desc: '20 conversations' })
      if (streak >= 2) unlocked.push({ icon: '🔥', title: 'Streak Keeper', desc: '2 day streak' })
      if (score >= 50) unlocked.push({ icon: '⭐', title: 'Rising Star', desc: 'Score 50+' })
      if (score >= 100) unlocked.push({ icon: '🏆', title: 'Productivity King', desc: 'Score 100+' })
      setAchievements(unlocked)

      // Generate AI insight
      if (notes.length > 0 && isModelReady()) {
        generateDailyInsight(notes, tasks, completedTasks)
      }
    } catch (e) {
      console.error('Dashboard load error:', e)
    }
  }

  async function generateDailyInsight(notes: any[], tasks: any[], completedTasks: number) {
    setInsightLoading(true)
    try {
      const recentNotes = notes.slice(0, 3).map(n => n.title).join(', ')
      let insight = ''
      await generateText(
        `Based on activity: ${notes.length} notes (${recentNotes}), ${completedTasks} tasks done.\n\nOne motivational insight (15 words):`,
        { maxTokens: 35, temperature: 0.3, onToken: (_, a) => { insight = a } }
      )
      setDailyInsight(insight || 'Keep building your knowledge base! Every note brings you closer to your goals.')
    } catch (e) {
      console.error(e)
    } finally {
      setInsightLoading(false)
    }
  }

  async function runAutopilotPlanner() {
    if (!isModelReady()) {
      setAutopilotError('Model not loaded — complete setup first.')
      return
    }

    setAutopilotLoading(true)
    setAutopilotError('')
    setTaskCreatedCount(0)

    try {
      const [notes, tasks, memories, chats] = await Promise.all([
        NotesDB.getAll(),
        TasksDB.getAll(),
        MemoryDB.getAll(),
        ChatDB.getSession('main'),
      ])

      const meetings = (() => {
        try {
          return JSON.parse(localStorage.getItem('sb_meetings_v1') ?? '[]') as any[]
        } catch {
          return []
        }
      })()

      const noteTitles = notes.slice(0, 5).map(n => n.title).join(', ') || 'No notes yet'
      const pendingTasks = tasks.filter(t => t.status !== 'done').slice(0, 6).map(t => `[${t.priority}] ${t.title}`).join('; ') || 'No pending tasks'
      const memoryHints = memories.slice(0, 4).map(m => m.content).join('; ') || 'No memory context'
      const meetingActions = meetings.slice(0, 3).flatMap((m: any) => m.actionItems ?? []).slice(0, 4).join('; ') || 'No meeting actions'
      const recentChatTopics = chats.filter((c: any) => c.role === 'user').slice(-4).map((c: any) => c.content).join('; ') || 'No recent chats'

      let raw = ''
      await generateText(
        `Create an execution-ready day plan from this context.\nNotes: ${noteTitles}\nPending Tasks: ${pendingTasks}\nMemories: ${memoryHints}\nMeeting Actions: ${meetingActions}\nRecent Chat Topics: ${recentChatTopics}\n\nRespond in this exact format:\nFOCUS: <1 sentence>\nTOP_3:\n- <priority 1>\n- <priority 2>\n- <priority 3>\nTIME_BLOCKS:\n- <time block 1>\n- <time block 2>\n- <time block 3>\n- <time block 4>\nRISKS:\n- <risk 1>\n- <risk 2>\n- <risk 3>\nNEXT_STEP: <single immediate action>`,
        {
          systemPrompt: 'You are an executive productivity strategist. Be concrete, specific, and practical.',
          maxTokens: 72,
          temperature: 0.2,
          timeoutMs: 8000,
          onToken: (_, acc) => { raw = acc },
        }
      )

      setAutopilotPlan(parseAutopilot(raw))
    } catch (e: any) {
      setAutopilotError(e?.message ?? 'Autopilot planning failed.')
    } finally {
      setAutopilotLoading(false)
    }
  }

  async function createTasksFromAutopilot() {
    if (!autopilotPlan) return
    try {
      const now = Date.now()
      const toCreate = autopilotPlan.top3.slice(0, 3)
      for (let i = 0; i < toCreate.length; i++) {
        await TasksDB.put({
          id: `autoplan-${now}-${i}`,
          title: toCreate[i],
          priority: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
          status: 'todo',
          createdAt: now,
          updatedAt: now,
        })
      }
      setTaskCreatedCount(toCreate.length)
      await loadDashboard()
    } catch {
      setAutopilotError('Could not create tasks from plan.')
    }
  }

  function getTimeIcon() {
    const hour = new Date().getHours()
    if (hour < 12) return Sun
    if (hour < 18) return Coffee
    return Moon
  }

  const TimeIcon = getTimeIcon()

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-br from-void via-void to-iris/5">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/50 backdrop-blur-sm flex-shrink-0">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <motion.div animate={{ rotate: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <TimeIcon size={24} className="text-amber" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-bright">{greeting}!</h1>
              <p className="text-xs text-dim">Welcome to your AI-powered productivity hub</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Productivity Score & Streak */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="relative p-6 rounded-3xl bg-gradient-to-br from-iris/20 via-iris/10 to-transparent border border-iris/30 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-iris/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dim uppercase tracking-wide">Score</span>
                <Trophy size={16} className="text-iris" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-iris">{productivityScore}</span>
                <span className="text-sm text-dim mb-1">/100</span>
              </div>
              <div className="mt-3 h-2 bg-muted/20 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${productivityScore}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-iris to-accent rounded-full" />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="relative p-6 rounded-3xl bg-gradient-to-br from-amber/20 via-amber/10 to-transparent border border-amber/30 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dim uppercase tracking-wide">Streak</span>
                <Flame size={16} className="text-amber" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-amber">{streak}</span>
                <span className="text-sm text-dim mb-1">days</span>
              </div>
              <p className="text-xs text-dim mt-2">
                {streak === 0 ? 'Start your journey!' : streak === 1 ? 'Keep it going!' : '🔥 On fire!'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* AI Daily Insight */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center flex-shrink-0">
              <Lightbulb size={20} className="text-accent" />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-bright mb-2">💡 AI Daily Insight</h3>
              {insightLoading ? (
                <div className="flex items-center gap-2 text-xs text-dim">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles size={12} className="text-accent" />
                  </motion.div>
                  Generating personalized insight...
                </div>
              ) : (
                <p className="text-sm text-text leading-relaxed">{dailyInsight || 'Start creating notes and tasks to get AI-powered insights!'}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* AI Autopilot Planner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-amber/10 to-iris/10 border border-amber/25 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-sm text-bright mb-1 flex items-center gap-2">
                <Calendar size={14} className="text-amber" />
                AI Autopilot Day Planner
              </h3>
              <p className="text-xs text-dim">One-click strategy from your notes, tasks, chats, memories, and meetings.</p>
            </div>
            <button
              onClick={runAutopilotPlanner}
              disabled={autopilotLoading}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber/15 border border-amber/35 text-amber hover:bg-amber/25 disabled:opacity-50 transition-all"
            >
              {autopilotLoading ? 'Planning…' : 'Run Autopilot'}
            </button>
          </div>

          {autopilotError && (
            <p className="text-xs text-rose mb-3">{autopilotError}</p>
          )}

          {autopilotPlan && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-card/40 border border-border">
                <p className="text-[10px] text-amber font-mono uppercase tracking-wide mb-1">Focus</p>
                <p className="text-sm text-text leading-relaxed">{autopilotPlan.focus}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-card/40 border border-border">
                  <p className="text-[10px] text-iris font-mono uppercase tracking-wide mb-1">Top 3 Priorities</p>
                  <ul className="space-y-1 text-xs text-text">
                    {autopilotPlan.top3.map((item, i) => <li key={i}>• {item}</li>)}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-card/40 border border-border">
                  <p className="text-[10px] text-accent font-mono uppercase tracking-wide mb-1">Time Blocks</p>
                  <ul className="space-y-1 text-xs text-text">
                    {autopilotPlan.blocks.map((item, i) => <li key={i}>• {item}</li>)}
                  </ul>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card/40 border border-border">
                <p className="text-[10px] text-rose font-mono uppercase tracking-wide mb-1">Risks To Watch</p>
                <ul className="space-y-1 text-xs text-text">
                  {autopilotPlan.risks.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-accent/10 border border-accent/25">
                <p className="text-[10px] text-accent font-mono uppercase tracking-wide mb-1">Immediate Next Step</p>
                <p className="text-sm text-text leading-relaxed">{autopilotPlan.nextStep}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={createTasksFromAutopilot}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-iris/15 border border-iris/35 text-iris hover:bg-iris/25 transition-all"
                >
                  Create Tasks From Top 3
                </button>
                {taskCreatedCount > 0 && (
                  <span className="text-xs text-accent">Created {taskCreatedCount} tasks.</span>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
              className="p-4 rounded-2xl bg-card/50 border border-border backdrop-blur-sm hover:border-iris/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={14} className={stat.color} />
                {stat.trend && (
                  <span className="text-[9px] font-mono text-dim">{stat.trend}</span>
                )}
              </div>
              <p className={`text-2xl font-bold ${stat.color} mb-0.5`}>{stat.value}</p>
              <p className="text-[10px] text-dim uppercase tracking-wide">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-bright flex items-center gap-2">
                <Award size={14} className="text-amber" />
                Achievements
              </h3>
              <span className="text-xs text-dim">{achievements.length} unlocked</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {achievements.map((ach, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.1 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-amber/10 to-amber/5 border border-amber/20 text-center">
                  <div className="text-2xl mb-1">{ach.icon}</div>
                  <p className="text-[10px] font-bold text-bright mb-0.5">{ach.title}</p>
                  <p className="text-[8px] text-dim">{ach.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-bright flex items-center gap-2">
                <Activity size={14} className="text-iris" />
                Recent Activity
              </h3>
            </div>
            <div className="space-y-2">
              {recentActivity.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card/30 border border-border hover:border-iris/30 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-iris/10 flex items-center justify-center flex-shrink-0">
                    <item.icon size={12} className="text-iris" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text truncate">{item.title}</p>
                    <p className="text-[9px] text-dim">
                      {new Date(item.time).toLocaleDateString()} • {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
          <h3 className="font-bold text-sm text-bright mb-3 flex items-center gap-2">
            <Zap size={14} className="text-accent" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: FileText, label: 'New Note', page: 'notes' as Page, color: 'iris' },
              { icon: MessageSquare, label: 'AI Chat', page: 'chat' as Page, color: 'accent' },
              { icon: CheckCircle, label: 'Add Task', page: 'tasks' as Page, color: 'amber' },
              { icon: BookOpen, label: 'Upload Doc', page: 'docs' as Page, color: 'rose' },
            ].map((action, i) => (
              <motion.button key={action.label} whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1 + i * 0.05 }}
                onClick={() => onNavigate(action.page)}
                className={`p-4 rounded-2xl bg-${action.color}/10 border border-${action.color}/20 hover:border-${action.color}/40 transition-all group`}>
                <div className="flex items-center gap-2">
                  <action.icon size={16} className={`text-${action.color}`} />
                  <span className="text-sm font-semibold text-bright">{action.label}</span>
                </div>
                <ChevronRight size={12} className={`text-${action.color} opacity-0 group-hover:opacity-100 transition-opacity mt-1`} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
