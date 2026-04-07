import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Search, Play, CheckCircle, ChevronRight, Sparkles, Lightbulb, Target, Lock, Unlock, ArrowLeft } from 'lucide-react'
import { generateText, isModelReady } from '../lib/runanywhere'

interface Lesson {
  id: string
  number: number
  title: string
  description: string
  overview: string
  objectives: string[]
  keyPoints: string[]
  content: string
  example: string
  recap: string
  quiz: { q: string; a: string }
  completed: boolean
}

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

const DIFFICULTIES: { id: DifficultyLevel; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

function parseList(raw: string): string[] {
  return raw
    .split('\n')
    .map(line => line.replace(/^[\s\-\*\d\.\)]+/, '').trim())
    .filter(Boolean)
    .slice(0, 4)
}

const TOPICS = [
  { id: 'python', name: '🐍 Python Programming', desc: '5 lessons • Beginner', color: '#60a5fa' },
  { id: 'javascript', name: '📱 JavaScript Basics', desc: '4 lessons • Beginner', color: '#fbbf24' },
  { id: 'react', name: '⚛️ React & Hooks', desc: '6 lessons • Intermediate', color: '#4ade80' },
  { id: 'web', name: '🌐 Web Development', desc: '7 lessons • Intermediate', color: '#818cf8' },
  { id: 'ml', name: '🤖 Machine Learning', desc: '5 lessons • Advanced', color: '#fb923c' },
  { id: 'data', name: '📊 Data Structures', desc: '6 lessons • Intermediate', color: '#f472b6' },
]

export default function AITutorPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner')
  const [quizAnswer, setQuizAnswer] = useState('')
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  async function selectTopic(topicId: string) {
    const topic = TOPICS.find(t => t.id === topicId)
    if (!topic) return

    setSelectedTopic(topicId)
    setLoading(true)

    try {
      // Generate 5 lesson titles
      const lessonTitles = [
        `${topic.name.split(' ')[1]} - Basics & Setup`,
        `${topic.name.split(' ')[1]} - Core Concepts`,
        `${topic.name.split(' ')[1]} - Practical Examples`,
        `${topic.name.split(' ')[1]} - Advanced Techniques`,
        `${topic.name.split(' ')[1]} - Real Projects`,
      ]

      const generateLessons: Lesson[] = lessonTitles.map((title, i) => ({
        id: `${topicId}-${i}`,
        number: i + 1,
        title,
        description: ['Learn basics', 'Understand concepts', 'Practice with code', 'Master advanced skills', 'Build real projects'][i],
        overview: '',
        objectives: [],
        keyPoints: [],
        content: '',
        example: '',
        recap: '',
        quiz: { q: '', a: '' },
        completed: false
      }))

      setLessons(generateLessons)
    } finally {
      setLoading(false)
    }
  }

  async function openLesson(lesson: Lesson) {
    if (!isModelReady()) {
      alert('AI model not loaded. Go to Privacy settings.')
      return
    }

    setCurrentLesson(lesson)
    setLoading(true)

    try {
      let raw = ''
      await generateText(
        `Create a well-structured mini lecture for "${lesson.title}" at ${difficulty} level in this exact format:\nOVERVIEW: <2 short sentences>\nOBJECTIVES:\n- <objective 1>\n- <objective 2>\n- <objective 3>\nKEY_POINTS:\n- <key point 1>\n- <key point 2>\n- <key point 3>\nCONTENT: <clear explanation in 3 to 5 short sentences>\nEXAMPLE: <short practical example>\nRECAP: <1 sentence summary>\nQUIZ_Q: <1 clear question>\nQUIZ_A: <short correct answer>`,
        {
          systemPrompt: `You are an expert tutor. Write precise, well-defined teaching content with clear structure for ${difficulty} learners.`,
          maxTokens: 72,
          temperature: 0.1,
          timeoutMs: 7000,
          onToken: (_, a) => { raw = a },
        }
      )

      const overview = raw.match(/OVERVIEW:\s*(.+?)(?=OBJECTIVES:|$)/is)?.[1]?.trim() ?? ''
      const objectivesBlock = raw.match(/OBJECTIVES:\s*(.+?)(?=KEY_POINTS:|$)/is)?.[1]?.trim() ?? ''
      const keyPointsBlock = raw.match(/KEY_POINTS:\s*(.+?)(?=CONTENT:|$)/is)?.[1]?.trim() ?? ''
      const content = raw.match(/CONTENT:\s*(.+?)(?=EXAMPLE:|$)/is)?.[1]?.trim() ?? ''
      const example = raw.match(/EXAMPLE:\s*(.+?)(?=QUIZ_Q:|$)/is)?.[1]?.trim() ?? ''
      const recap = raw.match(/RECAP:\s*(.+?)(?=QUIZ_Q:|$)/is)?.[1]?.trim() ?? ''
      const q = raw.match(/QUIZ_Q:\s*(.+?)(?=QUIZ_A:|$)/is)?.[1]?.trim() ?? ''
      const a = raw.match(/QUIZ_A:\s*(.+?)$/is)?.[1]?.trim() ?? ''
      const objectives = parseList(objectivesBlock)
      const keyPoints = parseList(keyPointsBlock)

      setCurrentLesson({
        ...lesson,
        overview: overview || 'This lesson introduces the topic and how it is used in real scenarios.',
        objectives: objectives.length ? objectives : [
          'Understand the core idea.',
          'Identify common usage patterns.',
          'Apply the concept in a small task.',
        ],
        keyPoints: keyPoints.length ? keyPoints : [
          'Know the definition and purpose.',
          'Recognize where this concept fits.',
          'Avoid common beginner mistakes.',
        ],
        content: content || 'This topic explains core ideas and when to use them.',
        example: example || 'Try a tiny example first, then expand it step by step.',
        recap: recap || 'Recap: Learn the concept, practice with one example, and verify understanding with a quiz.',
        quiz: {
          q: q || 'What is the key concept in this lesson?',
          a: a || 'The key concept is applying the core idea correctly.'
        }
      })
    } catch (e) {
      console.error('Error loading lesson:', e)
    } finally {
      setLoading(false)
    }
  }

  function completeLesson() {
    if (currentLesson) {
      setLessons(prev =>
        prev.map(l => l.id === currentLesson.id ? { ...l, completed: true } : l)
      )
      setCurrentLesson(null)
      setQuizAnswer('')
      setQuizSubmitted(false)
    }
  }

  function checkAnswer() {
    if (!quizAnswer.trim() || !currentLesson) return
    setQuizSubmitted(true)
  }

  const filtered = TOPICS.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const completedCount = lessons.filter(l => l.completed).length

  // Lesson View
  if (currentLesson) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setCurrentLesson(null)} className="text-dim hover:text-bright">
              <ArrowLeft size={14} />
            </button>
            <div>
              <p className="text-bright font-semibold text-sm">{currentLesson.title}</p>
              <p className="text-[10px] text-dim font-mono">Lesson {currentLesson.number}/5</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-iris/30 border-t-iris rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-iris" />
                  <h3 className="font-semibold text-sm text-bright">Lecture Overview</h3>
                </div>
                <p className="text-sm text-text leading-relaxed">{currentLesson.overview}</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="font-semibold text-sm text-bright mb-2">Learning Objectives</h3>
                <ul className="space-y-1 text-sm text-text">
                  {currentLesson.objectives.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-iris mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="font-semibold text-sm text-bright mb-2">Lecture Notes</h3>
                <p className="text-sm text-text leading-relaxed">{currentLesson.content}</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="font-semibold text-sm text-bright mb-2">Key Points</h3>
                <ul className="space-y-1 text-sm text-text">
                  {currentLesson.keyPoints.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} className="text-accent" />
                  <h3 className="font-semibold text-sm text-bright">Practical Example</h3>
                </div>
                <pre className="text-xs text-text font-mono bg-surface/50 p-3 rounded overflow-x-auto">
                  {currentLesson.example}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="font-semibold text-sm text-bright mb-2">Recap</h3>
                <p className="text-sm text-text leading-relaxed">{currentLesson.recap}</p>
              </div>

              <div className="p-4 rounded-xl bg-iris/5 border border-iris/20">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={14} className="text-iris" />
                  <h3 className="font-semibold text-sm text-bright">Quiz</h3>
                </div>
                <p className="text-sm font-medium text-bright mb-3">{currentLesson.quiz.q}</p>
                <input value={quizAnswer} onChange={e => { setQuizAnswer(e.target.value); setQuizSubmitted(false) }}
                  placeholder="Your answer..." className="input w-full mb-3 text-sm"/>
                {!quizSubmitted ? (
                  <button onClick={checkAnswer} disabled={!quizAnswer.trim()}
                    className="w-full py-2 rounded-lg bg-iris/15 border border-iris/30 text-iris font-semibold text-sm disabled:opacity-40">
                    Check Answer
                  </button>
                ) : (
                  <>
                    <div className={`p-3 rounded-lg text-sm mb-3 ${
                      quizAnswer.toLowerCase().includes(currentLesson.quiz.a.split(' ')[0].toLowerCase())
                        ? 'bg-accent/10 text-text'
                        : 'bg-rose/10 text-text'
                    }`}>
                      {quizAnswer.toLowerCase().includes(currentLesson.quiz.a.split(' ')[0].toLowerCase())
                        ? '✅ Good! '
                        : '💡 The answer is: '}
                      {currentLesson.quiz.a}
                    </div>
                    <button onClick={completeLesson}
                      className="w-full py-2 rounded-lg bg-accent/15 border border-accent/30 text-accent font-semibold text-sm">
                      Mark Complete ✓
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Lessons List View
  if (selectedTopic) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border flex-shrink-0">
          <button onClick={() => setSelectedTopic(null)} className="text-dim hover:text-bright">
            <ArrowLeft size={14} />
          </button>
          <div>
            <p className="text-bright font-semibold text-sm">{TOPICS.find(t => t.id === selectedTopic)?.name}</p>
            <p className="text-[10px] text-dim">{completedCount}/{lessons.length} completed · {DIFFICULTIES.find(d => d.id === difficulty)?.label}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {lessons.map((lesson, i) => (
            <motion.button key={lesson.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => openLesson(lesson)} disabled={loading}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                lesson.completed
                  ? 'bg-accent/10 border-accent/20 opacity-60'
                  : 'bg-card border-border hover:border-iris/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-dim">L{lesson.number}</span>
                    <p className="font-semibold text-bright text-sm">{lesson.title}</p>
                    {lesson.completed && <CheckCircle size={12} className="text-accent" />}
                  </div>
                  <p className="text-[10px] text-dim">{lesson.description}</p>
                </div>
                <ChevronRight size={14} className="text-dim" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  // Topics View
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-iris/15 border border-iris/30 flex items-center justify-center">
          <BookOpen size={14} className="text-iris"/>
        </div>
        <div>
          <p className="text-bright font-semibold text-sm">AI Tutor 🎓</p>
          <p className="text-[10px] text-dim">Learn with AI mentor</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-[10px] text-dim font-mono uppercase tracking-wide mb-2">Difficulty</p>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map(level => (
              <button
                key={level.id}
                onClick={() => setDifficulty(level.id)}
                className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  difficulty === level.id
                    ? 'bg-iris/15 border-iris/40 text-iris'
                    : 'bg-surface/40 border-border text-dim hover:border-iris/30 hover:text-bright'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim"/>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search topics..." className="input w-full pl-9 text-sm"/>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {filtered.map((topic, i) => (
            <motion.button key={topic.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              onClick={() => selectTopic(topic.id)} disabled={loading}
              className="p-3 rounded-lg bg-card border border-border hover:border-iris/40 text-left transition-all group"
            >
              <p className="font-semibold text-bright text-sm mb-1">{topic.name}</p>
              <p className="text-[10px] text-dim mb-2">{topic.desc}</p>
              <ChevronRight size={11} className="text-dim group-hover:text-iris transition-colors" />
            </motion.button>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-iris/5 border border-iris/20 mt-4">
          <div className="flex items-start gap-2">
            <Lightbulb size={14} className="text-iris flex-shrink-0 mt-0.5" />
            <div className="text-xs text-dim">
              <p className="font-semibold text-bright mb-1">How It Works</p>
              <p>Select a topic → Study 5 structured lessons → Answer quizzes → Complete & track progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
