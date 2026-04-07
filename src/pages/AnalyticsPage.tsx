import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Zap, Clock, FileText, MessageSquare, Activity, TrendingUp, Sparkles } from 'lucide-react'
import { ChatDB, NotesDB } from '../lib/storage'

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalChats: 0,
    totalNotes: 0,
    avgResponseTime: 0,
    avgTokensPerSec: 0,
    totalTokens: 0,
    fastestResponse: Infinity,
    slowestResponse: 0,
  })

  useEffect(() => {
    async function loadStats() {
      try {
        const chats = await ChatDB.getSession('main')
        const notes = await NotesDB.getAll()

        const responses = chats.filter((m: any) => m.role === 'assistant' && m.tokensPerSec)
        const avgTps = responses.reduce((sum: number, m: any) => sum + (m.tokensPerSec ?? 0), 0) / (responses.length || 1)

        let fastest = Infinity
        let slowest = 0
        responses.forEach((r: any) => {
          if (r.tokensPerSec) {
            fastest = Math.min(fastest, r.tokensPerSec)
            slowest = Math.max(slowest, r.tokensPerSec)
          }
        })

        setStats({
          totalChats: chats.length,
          totalNotes: notes.length,
          avgResponseTime: avgTps > 0 ? parseInt((1 / avgTps * 1000).toFixed(2)) : 0,
          avgTokensPerSec: avgTps,
          totalTokens: responses.reduce((sum: number, m: any) => sum + ((m.content?.split(' ').length ?? 0) / 1.3), 0),
          fastestResponse: fastest === Infinity ? 0 : fastest,
          slowestResponse: slowest,
        })
      } catch (e) {
        console.error('Failed to load statistics:', e)
      }
    }
    loadStats()
  }, [])

  const metrics = [
    { icon: MessageSquare, label: 'Total Chats', value: stats.totalChats, color: '#818cf8' },
    { icon: FileText, label: 'Notes Created', value: stats.totalNotes, color: '#60a5fa' },
    { icon: Zap, label: 'Avg Speed', value: `${stats.avgTokensPerSec.toFixed(1)} tok/s`, color: '#fbbf24' },
    { icon: Clock, label: 'Response Time', value: `${stats.avgResponseTime}ms`, color: '#34d399' },
    { icon: Activity, label: 'Fastest', value: `${stats.fastestResponse.toFixed(1)} tok/s`, color: '#f472b6' },
    { icon: TrendingUp, label: 'Peak Speed', value: `${stats.slowestResponse.toFixed(1)} tok/s`, color: '#fb923c' },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
          <BarChart3 size={14} className="text-accent"/>
        </div>
        <div>
          <p className="text-bright font-semibold text-sm">Performance Analytics</p>
          <p className="text-[10px] text-dim font-mono">Real-time statistics · Local metrics</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {metrics.map(({ icon: Icon, label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color }} />
                <span className="text-xs font-semibold text-dim">{label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </motion.div>
          ))}
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-iris/10 to-accent/10 border border-iris/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-iris" />
            <h3 className="font-semibold text-bright text-sm">Optimization Tips</h3>
          </div>
          <ul className="space-y-2 text-xs text-dim">
            <li>✓ Use LFM2-350M for fastest responses (~8-15 tok/s)</li>
            <li>✓ Keep prompts concise for 15-20% faster inference</li>
            <li>✓ Reduce context window for complex documents</li>
            <li>✓ Close other tabs to free up system memory</li>
            <li>✓ Enable WebGPU in browser for 2-3x speedup</li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border">
          <h3 className="font-semibold text-bright text-sm mb-3">About ZeroCloud AI</h3>
          <div className="space-y-2 text-[10px] text-dim leading-relaxed">
            <p>🚀 <strong>100% Offline</strong> · All computation happens on your device</p>
            <p>🔐 <strong>Zero Data Egress</strong> · No files uploaded to any server</p>
            <p>⚡ <strong>Local LLMs</strong> · Powered by RunAnywhere SDK with GGUF models</p>
            <p>$ <strong>$0 Cost</strong> · Free LLMs, no API charges</p>
            <p>🎯 <strong>Blazing Fast</strong> · Optimized inference with streaming</p>
          </div>
        </div>
      </div>
    </div>
  )
}
