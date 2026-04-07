import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Sparkles, Copy, CheckCheck, BookOpen, Lightbulb, Send,
  ChevronRight, ArrowLeft, Brain, Target, Zap, TrendingUp, Award,
  Clock, FileText, Layers, BarChart3, Star, Download, Eye,
  CheckCircle, XCircle, Hash, Bookmark, AlertTriangle, Cpu, MessageSquare
} from 'lucide-react'
import { generateText, isModelReady } from '../lib/runanywhere'

interface DocResult {
  id: string
  name: string
  sizeFmt: string
  wordCount: number
  rawText: string
  summary: string
  keyPoints: string[]
  keyTerms: { term: string; def: string }[]
  difficulty: 'Easy' | 'Medium' | 'Hard'
  readingTime: number
  studyProgress: number
  processTime: number
  uploadedAt: number
}

export default function DocsPage({ onStatsChange }: { onStatsChange?: () => void }) {
  const [docs, setDocs] = useState<DocResult[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [tab, setTab] = useState<'overview'|'study'|'quiz'|'insights'>('overview')

  // Study features
  const [chatInput, setChatInput] = useState('')
  const [chatMsgs, setChatMsgs] = useState<{role:'user'|'ai', text:string}[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [quiz, setQuiz] = useState<{q:string,options:string[],correct:number,userAnswer?:number}[]>([])
  const [quizIdx, setQuizIdx] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [quizMode, setQuizMode] = useState<'notStarted'|'active'|'completed'>('notStarted')
  const [quizLoading, setQuizLoading] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [copied, setCopied] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (docs.length > 0 && !selectedDocId) setSelectedDocId(docs[0].id)
  }, [docs])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMsgs, chatLoading])

  function fmtSize(b: number) {
    if (b < 1024) return `${b}B`
    if (b < 1048576) return `${(b/1024).toFixed(1)}KB`
    return `${(b/1048576).toFixed(1)}MB`
  }

  async function extractText(file: File): Promise<string> {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        if (!(window as any).pdfjsLib) {
          setProgress('⚡ Loading PDF engine...')
          await new Promise<void>((res, rej) => {
            const s = document.createElement('script')
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
            s.onload = () => {
              ;(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
              res()
            }
            s.onerror = rej
            document.head.appendChild(s)
          })
        }
        const lib = (window as any).pdfjsLib
        const buf = await file.arrayBuffer()
        const pdf = await lib.getDocument({ data: buf }).promise
        let out = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          setProgress(`📄 Page ${i}/${pdf.numPages}`)
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          out += content.items.map((x: any) => x.str).join(' ') + '\n'
        }
        return out.trim()
      } catch (e: any) {
        throw new Error('PDF extraction failed')
      }
    }
    return file.text()
  }

  function calculateDifficulty(text: string): 'Easy' | 'Medium' | 'Hard' {
    const words = text.split(/\s+/)
    const avgWordLen = words.reduce((sum, w) => sum + w.length, 0) / words.length
    const longWords = words.filter(w => w.length > 8).length / words.length
    if (avgWordLen < 5 && longWords < 0.15) return 'Easy'
    if (avgWordLen < 6 && longWords < 0.25) return 'Medium'
    return 'Hard'
  }

  async function analyzeDocument(file: File) {
    if (!isModelReady()) {
      setError('⚠️ AI model not loaded. Go to Privacy & Settings to load a model.')
      return
    }

    setError(null)
    setLoading(true)
    setProgress('🚀 Starting analysis...')

    try {
      const t0 = Date.now()
      const raw = await extractText(file)
      if (!raw.trim()) throw new Error('No text found')

      setProgress('🧠 AI analyzing document...')
      const chunk = raw.slice(0, 1200)

      // Generate summary + key points
      let fullResponse = ''
      await generateText(
        `Analyze:\n${chunk}\n\nSUMMARY: 2 sentences\nKEY POINTS: 3 insights\nKEY TERMS: 3 important terms`,
        { maxTokens: 60, temperature: 0.1, timeoutMs: 6500, onToken: (_, a) => { fullResponse = a } }
      )

      const sumMatch = fullResponse.match(/SUMMARY[:\s]*(.+?)(?=KEY POINTS|KEY TERMS|$)/is)
      const keyMatch = fullResponse.match(/KEY POINTS[:\s]*(.+?)(?=KEY TERMS|$)/is)
      const termsMatch = fullResponse.match(/KEY TERMS[:\s]*(.+?)$/is)

      const summary = sumMatch?.[1]?.trim() || 'Document analyzed successfully'
      const keyPoints = keyMatch
        ? keyMatch[1].split('\n').filter(l => l.trim() && (l.includes('•') || l.match(/^\d+\./))).slice(0, 3)
            .map(l => l.replace(/^[•\-\d.]\s*/, '').trim()).filter(Boolean)
        : ['Main concept', 'Key finding', 'Important detail']

      const keyTerms = termsMatch
        ? termsMatch[1].split('\n').filter(l => l.trim() && l.includes(':')).slice(0, 3)
            .map(l => {
              const [term, ...rest] = l.split(':')
              return { term: term.replace(/^[•\-\d.]\s*/, '').trim(), def: rest.join(':').trim() }
            })
        : []

      const difficulty = calculateDifficulty(raw)
      const readingTime = Math.ceil(raw.split(/\s+/).length / 200)

      const newDoc: DocResult = {
        id: Date.now().toString(),
        name: file.name,
        sizeFmt: fmtSize(file.size),
        wordCount: raw.split(/\s+/).length,
        rawText: raw,
        summary,
        keyPoints,
        keyTerms,
        difficulty,
        readingTime,
        studyProgress: 0,
        processTime: Date.now() - t0,
        uploadedAt: Date.now()
      }

      setDocs(prev => [newDoc, ...prev])
      setSelectedDocId(newDoc.id)
      setChatMsgs([])
      setQuiz([])
      setQuizMode('notStarted')
      setTab('overview')
      setProgress('')
      onStatsChange?.()
    } catch (e: any) {
      setError(e?.message || 'Analysis failed. Try a smaller file.')
      setProgress('')
    } finally {
      setLoading(false)
    }
  }

  async function askDoc(q: string) {
    const doc = docs.find(d => d.id === selectedDocId)
    if (!q.trim() || !doc) return

    setChatMsgs(prev => [...prev, { role: 'user', text: q }])
    setChatInput('')
    setChatLoading(true)

    try {
      let answer = ''
      await generateText(
        `Doc: ${doc.rawText.slice(0, 900)}\n\nQ: ${q}\nA:`,
        { maxTokens: 40, temperature: 0.1, timeoutMs: 4500, onToken: (_, a) => { answer = a } }
      )
      setChatMsgs(prev => [...prev, { role: 'ai', text: answer || 'No answer found' }])
    } catch (e) {
      setChatMsgs(prev => [...prev, { role: 'ai', text: '❌ Error' }])
    } finally {
      setChatLoading(false)
    }
  }

  async function generateQuiz() {
    const doc = docs.find(d => d.id === selectedDocId)
    if (!doc) return

    setQuizLoading(true)
    setQuiz([])
    setQuizIdx(0)
    setQuizScore(0)

    try {
      let response = ''
      await generateText(
        `5 multiple choice questions:\n${doc.rawText.slice(0, 900)}\n\nQ1:\nA) B) C) D)\nCorrect:\nQ2:\nA) B) C) D)\nCorrect:`,
        { maxTokens: 72, temperature: 0.2, timeoutMs: 7000, onToken: (_, a) => { response = a } }
      )

      // Parse MCQ format
      const questions = response.match(/Q\d+[:\s](.+?)(?=Q\d+|$)/gs) || []
      const parsed = questions.slice(0, 5).map(block => {
        const lines = block.split('\n').filter(l => l.trim())
        const q = lines[0]?.replace(/^Q\d+[:\s]*/, '').trim() || 'Question'
        const opts = lines.filter(l => /^[A-D][\):\.]/.test(l.trim())).map(l => l.replace(/^[A-D][\):\.]/, '').trim())
        const correctMatch = block.match(/Correct[:\s]*([A-D])/i)
        const correct = correctMatch ? correctMatch[1].charCodeAt(0) - 65 : 0
        return {
          q: q.length > 100 ? q.slice(0, 100) + '...' : q,
          options: opts.length === 4 ? opts : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correct: Math.min(correct, 3),
          userAnswer: undefined
        }
      })

      setQuiz(parsed.length > 0 ? parsed : [{
        q: `What is the main topic of ${doc.name}?`,
        options: ['Topic A', 'Topic B', 'Topic C', 'Topic D'],
        correct: 0
      }])
      setQuizMode('active')
    } catch (e) {
      console.error(e)
    } finally {
      setQuizLoading(false)
    }
  }

  function answerQuiz(optionIdx: number) {
    const updated = [...quiz]
    updated[quizIdx].userAnswer = optionIdx
    setQuiz(updated)
    if (optionIdx === updated[quizIdx].correct) setQuizScore(s => s + 1)

    setTimeout(() => {
      if (quizIdx < quiz.length - 1) setQuizIdx(i => i + 1)
      else {
        setQuizMode('completed')
        // Update study progress
        const doc = docs.find(d => d.id === selectedDocId)
        if (doc) {
          const progress = Math.min(100, doc.studyProgress + 20)
          setDocs(prev => prev.map(d => d.id === selectedDocId ? { ...d, studyProgress: progress } : d))
        }
      }
    }, 1200)
  }

  async function exportSummary() {
    const doc = docs.find(d => d.id === selectedDocId)
    if (!doc) return
    const content = `# ${doc.name}\n\n## Summary\n${doc.summary}\n\n## Key Points\n${doc.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n## Key Terms\n${doc.keyTerms.map(t => `**${t.term}**: ${t.def}`).join('\n\n')}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.name.replace(/\..+$/, '')}_summary.md`
    a.click()
  }

  async function copy() {
    const doc = docs.find(d => d.id === selectedDocId)
    if (!doc) return
    await navigator.clipboard.writeText(`${doc.name}\n\n${doc.summary}\n\n${doc.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedDoc = docs.find(d => d.id === selectedDocId)

  // Document Detail View
  if (selectedDoc && !loading) {
    const diffColor = selectedDoc.difficulty === 'Easy' ? 'text-accent' : selectedDoc.difficulty === 'Medium' ? 'text-amber' : 'text-rose'
    const progressPercent = selectedDoc.studyProgress

    return (
      <div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-br from-void via-void to-iris/5">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSelectedDocId(null)}
              className="w-8 h-8 rounded-xl bg-surface/50 border border-border hover:border-iris/40 flex items-center justify-center transition-all">
              <ArrowLeft size={14} className="text-dim" />
            </motion.button>
            <div>
              <p className="text-bright font-semibold text-sm line-clamp-1">{selectedDoc.name}</p>
              <div className="flex items-center gap-2 text-[10px] text-dim">
                <span className="flex items-center gap-1"><FileText size={9} />{selectedDoc.wordCount} words</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock size={9} />{selectedDoc.readingTime}min read</span>
                <span>•</span>
                <span className={`flex items-center gap-1 ${diffColor}`}>
                  <Target size={9} />{selectedDoc.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Study Progress Bar */}
        {progressPercent > 0 && (
          <div className="px-5 py-2 border-b border-border/50 bg-surface/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-dim font-medium">Study Progress</span>
              <span className="text-[10px] text-accent font-bold">{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-iris to-accent rounded-full" />
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 px-5 py-3 border-b border-border/50 bg-surface/20 overflow-x-auto">
          {[
            { id: 'overview' as const, icon: Eye, label: 'Overview' },
            { id: 'study' as const, icon: Brain, label: 'Study' },
            { id: 'quiz' as const, icon: Target, label: 'Quiz' },
            { id: 'insights' as const, icon: Sparkles, label: 'Insights' },
          ].map(t => (
            <motion.button key={t.id} whileTap={{ scale: 0.95 }} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'bg-iris text-void shadow-lg shadow-iris/20'
                  : 'bg-card/50 border border-border text-dim hover:text-text hover:border-iris/30'
              }`}>
              <t.icon size={12} />
              {t.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-4 max-w-3xl mx-auto">

                {/* Summary Card */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-iris/10 to-accent/5 border border-iris/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-iris/15 flex items-center justify-center">
                      <Sparkles size={14} className="text-iris" />
                    </div>
                    <h3 className="font-bold text-sm text-bright">AI Summary</h3>
                  </div>
                  <p className="text-sm text-text leading-relaxed">{selectedDoc.summary}</p>
                </motion.div>

                {/* Key Points */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                  className="p-5 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={14} className="text-accent" />
                    <h3 className="font-bold text-sm text-bright">Key Points</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedDoc.keyPoints.map((p, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex gap-3">
                        <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-accent">{i + 1}</span>
                        </div>
                        <p className="text-sm text-text flex-1">{p}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Key Terms */}
                {selectedDoc.keyTerms.length > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                    className="p-5 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash size={14} className="text-iris" />
                      <h3 className="font-bold text-sm text-bright">Key Terms</h3>
                    </div>
                    <div className="space-y-3">
                      {selectedDoc.keyTerms.map((t, i) => (
                        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }}>
                          <p className="text-sm font-semibold text-bright">{t.term}</p>
                          <p className="text-xs text-dim mt-0.5">{t.def}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={copy}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-iris/10 border border-iris/30 text-iris font-semibold text-xs hover:bg-iris/20 transition-all">
                    {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={exportSummary}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/10 border border-accent/30 text-accent font-semibold text-xs hover:bg-accent/20 transition-all">
                    <Download size={14} />
                    Export
                  </motion.button>
                </div>
              </motion.div>
            )}

            {tab === 'study' && (
              <motion.div key="study" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-4 max-w-3xl mx-auto">

                {/* Q&A Chat */}
                <div className="p-5 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-iris" />
                    <h3 className="font-bold text-sm text-bright">Ask Questions</h3>
                  </div>

                  <div className="bg-surface/50 rounded-xl border border-border p-3 max-h-80 overflow-y-auto space-y-3 mb-3">
                    {chatMsgs.length === 0 ? (
                      <p className="text-xs text-dim text-center py-8">Ask anything about this document...</p>
                    ) : (
                      chatMsgs.map((m, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                            m.role === 'user'
                              ? 'bg-iris text-void'
                              : 'bg-muted/20 text-text border border-border'
                          }`}>
                            {m.text}
                          </div>
                        </motion.div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex items-center gap-2 text-xs text-dim">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <Cpu size={12} className="text-iris" />
                        </motion.div>
                        Thinking...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="flex gap-2">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && askDoc(chatInput)}
                      placeholder="Type your question..."
                      className="input flex-1 text-xs" />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => askDoc(chatInput)}
                      disabled={!chatInput.trim() || chatLoading}
                      className="px-4 py-2 rounded-xl bg-iris/15 border border-iris/30 text-iris font-semibold text-xs disabled:opacity-40 hover:bg-iris/20 transition-all">
                      <Send size={14} />
                    </motion.button>
                  </div>
                </div>

                {/* Study Tips */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-accent" />
                    <h3 className="font-bold text-sm text-bright">Pro Study Tips</h3>
                  </div>
                  <ul className="space-y-1.5 text-xs text-text">
                    <li>✓ Read the summary first to get context</li>
                    <li>✓ Focus on key terms and their definitions</li>
                    <li>✓ Take the quiz to test your knowledge</li>
                    <li>✓ Review wrong answers to learn better</li>
                  </ul>
                </motion.div>
              </motion.div>
            )}

            {tab === 'quiz' && (
              <motion.div key="quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-4 max-w-2xl mx-auto">

                {quizMode === 'notStarted' && (
                  <div className="text-center py-12">
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                      className="w-20 h-20 rounded-3xl bg-gradient-to-br from-iris/20 to-accent/20 border border-iris/30 flex items-center justify-center mx-auto mb-4">
                      <Target size={32} className="text-iris" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-bright mb-2">Test Your Knowledge</h3>
                    <p className="text-sm text-dim mb-6">AI will generate 5 questions based on the document</p>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={generateQuiz} disabled={quizLoading}
                      className="px-6 py-3 rounded-xl bg-iris text-void font-bold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-iris/20 transition-all">
                      {quizLoading ? 'Generating...' : '🚀 Start Quiz'}
                    </motion.button>
                  </div>
                )}

                {quizMode === 'active' && quiz[quizIdx] && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono text-dim">Question {quizIdx + 1}/{quiz.length}</span>
                      <span className="text-xs font-bold text-iris">Score: {quizScore}/{quizIdx}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-bright mb-4">{quiz[quizIdx].q}</h3>

                    <div className="space-y-2">
                      {quiz[quizIdx].options.map((opt, i) => {
                        const isSelected = quiz[quizIdx].userAnswer === i
                        const isCorrect = i === quiz[quizIdx].correct
                        const showResult = quiz[quizIdx].userAnswer !== undefined

                        return (
                          <motion.button key={i} whileTap={{ scale: 0.98 }}
                            onClick={() => !showResult && answerQuiz(i)}
                            disabled={showResult}
                            className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                              showResult
                                ? isSelected
                                  ? isCorrect
                                    ? 'bg-accent/10 border-accent text-accent'
                                    : 'bg-rose/10 border-rose text-rose'
                                  : isCorrect
                                    ? 'bg-accent/10 border-accent text-accent'
                                    : 'bg-surface/50 border-border text-dim'
                                : 'bg-surface/50 border-border text-text hover:border-iris/40 hover:bg-iris/5'
                            }`}>
                            <div className="flex items-center justify-between">
                              <span>{String.fromCharCode(65 + i)}. {opt}</span>
                              {showResult && (isCorrect ? <CheckCircle size={14} /> : isSelected && <XCircle size={14} />)}
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {quizMode === 'completed' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12">
                    <motion.div initial={{ rotate: -10 }} animate={{ rotate: 0 }} transition={{ type: 'spring' }}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-iris/20 border-4 border-accent/30 flex items-center justify-center mx-auto mb-4">
                      <Award size={40} className="text-accent" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-bright mb-2">Quiz Complete!</h3>
                    <p className="text-3xl font-bold text-accent mb-4">{quizScore}/{quiz.length}</p>
                    <p className="text-sm text-dim mb-6">
                      {quizScore === quiz.length ? '🎉 Perfect score!' : quizScore >= quiz.length * 0.7 ? '✨ Great job!' : '💪 Keep practicing!'}
                    </p>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setQuizMode('notStarted'); setQuizIdx(0); setQuizScore(0) }}
                      className="px-6 py-3 rounded-xl bg-iris/15 border border-iris/30 text-iris font-bold text-sm hover:bg-iris/20 transition-all">
                      Try Again
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {tab === 'insights' && (
              <motion.div key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-4 max-w-3xl mx-auto">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: FileText, label: 'Words', value: selectedDoc.wordCount.toLocaleString(), color: 'text-iris' },
                    { icon: Clock, label: 'Reading Time', value: `${selectedDoc.readingTime}min`, color: 'text-accent' },
                    { icon: Zap, label: 'Processed', value: `${(selectedDoc.processTime / 1000).toFixed(1)}s`, color: 'text-amber' },
                    { icon: TrendingUp, label: 'Progress', value: `${selectedDoc.studyProgress}%`, color: 'text-rose' },
                  ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon size={14} className={stat.color} />
                        <span className="text-[10px] text-dim uppercase font-bold tracking-wide">{stat.label}</span>
                      </div>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Document Info */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="p-5 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
                  <h3 className="font-bold text-sm text-bright mb-3 flex items-center gap-2">
                    <BarChart3 size={14} className="text-iris" />
                    Document Analysis
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-dim">Difficulty Level</span>
                      <span className={`font-bold ${diffColor}`}>{selectedDoc.difficulty}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-dim">File Size</span>
                      <span className="text-text font-medium">{selectedDoc.sizeFmt}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-dim">Uploaded</span>
                      <span className="text-text font-medium">{new Date(selectedDoc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Learning Recommendations */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-iris/10 to-accent/5 border border-iris/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Bookmark size={14} className="text-iris" />
                    <h3 className="font-bold text-sm text-bright">Study Recommendations</h3>
                  </div>
                  <div className="space-y-2 text-xs text-text">
                    {selectedDoc.studyProgress < 30 && <p>📚 Start with the Overview tab to understand key concepts</p>}
                    {selectedDoc.studyProgress >= 30 && selectedDoc.studyProgress < 60 && <p>💬 Use the Study tab to ask specific questions</p>}
                    {selectedDoc.studyProgress >= 60 && selectedDoc.studyProgress < 100 && <p>🎯 Take the Quiz to solidify your knowledge</p>}
                    {selectedDoc.studyProgress === 100 && <p>🌟 Perfect! You've mastered this document!</p>}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Upload View
  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-br from-void via-void to-iris/5">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/50 backdrop-blur-sm flex-shrink-0">
        <motion.div animate={{ boxShadow: ['0 0 0 rgba(99,102,241,0)', '0 0 20px rgba(99,102,241,0.3)', '0 0 0 rgba(99,102,241,0)'] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-iris/20 to-accent/10 border border-iris/30 flex items-center justify-center">
          <BookOpen size={18} className="text-iris" />
        </motion.div>
        <div>
          <p className="text-bright font-bold text-sm">📚 Smart Document Analyzer</p>
          <p className="text-[10px] text-dim">AI-powered learning • {docs.length} documents</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-rose/10 border border-rose/25 text-rose text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Area */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) analyzeDocument(f) }}
          onClick={() => !loading && fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-iris bg-iris/10 scale-105'
              : loading
                ? 'border-iris/50 bg-iris/5'
                : 'border-border hover:border-iris/40 hover:bg-iris/5 hover:scale-105'
          }`}>
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.txt,.md"
            onChange={e => { const f = e.target.files?.[0]; if (f) analyzeDocument(f) }} />

          {loading ? (
            <motion.div className="space-y-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full border-4 border-iris/20 border-t-iris mx-auto" />
              <div>
                <p className="text-bright font-bold mb-1">{progress}</p>
                <p className="text-xs text-dim">AI is analyzing your document...</p>
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-iris/20 to-accent/10 border-2 border-iris/30 flex items-center justify-center mx-auto mb-4">
                <Upload size={24} className="text-iris" />
              </motion.div>
              <p className="text-bright font-bold text-lg mb-2">
                {dragOver ? '📥 Drop it here!' : '📄 Upload Document'}
              </p>
              <p className="text-sm text-dim mb-4">Drag & drop or click to browse</p>
              <div className="flex items-center justify-center gap-2 text-xs text-dim">
                <CheckCircle size={12} className="text-accent" />
                <span>PDF, TXT, Markdown • Up to 10MB</span>
              </div>
            </>
          )}
        </motion.div>

        {/* Features Grid */}
        {!loading && docs.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3">
            {[
              { icon: Sparkles, label: 'AI Summary', desc: 'Instant key insights' },
              { icon: Brain, label: 'Smart Q&A', desc: 'Ask anything' },
              { icon: Target, label: 'Quiz Mode', desc: 'Test knowledge' },
              { icon: Star, label: 'Key Terms', desc: 'Auto glossary' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="p-4 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
                <div className="w-10 h-10 rounded-xl bg-iris/10 flex items-center justify-center mb-3">
                  <f.icon size={18} className="text-iris" />
                </div>
                <p className="font-bold text-sm text-bright mb-1">{f.label}</p>
                <p className="text-xs text-dim">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Documents List */}
        {docs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-dim uppercase tracking-wide px-2">Recent Documents</h3>
            {docs.map((doc, i) => (
              <motion.button key={doc.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedDocId(doc.id)}
                className="w-full text-left p-4 rounded-2xl bg-card/50 border border-border hover:border-iris/40 backdrop-blur-sm transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-bright truncate mb-1">{doc.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-dim">
                      <span>{doc.wordCount} words</span>
                      <span>•</span>
                      <span>{doc.readingTime}min read</span>
                      <span>•</span>
                      <span className={doc.difficulty === 'Easy' ? 'text-accent' : doc.difficulty === 'Medium' ? 'text-amber' : 'text-rose'}>
                        {doc.difficulty}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-dim group-hover:text-iris transition-colors flex-shrink-0" />
                </div>
                {doc.studyProgress > 0 && (
                  <div className="mt-3">
                    <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
                      <div style={{ width: `${doc.studyProgress}%` }} className="h-full bg-gradient-to-r from-iris to-accent" />
                    </div>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
