import { openDB, type IDBPDatabase } from 'idb'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Note {
  id: string
  title: string
  content: string
  summary?: string
  bullets?: string[]
  tags: string[]
  pinned: boolean
  createdAt: number
  updatedAt: number
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in-progress' | 'done'
  sourceNoteId?: string
  createdAt: number
  updatedAt: number
}

export interface Memory {
  id: string
  content: string
  type: 'preference' | 'fact' | 'context' | 'goal'
  importance: number   // 1–5
  createdAt: number
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  tokensPerSec?: number
}

// ─── DB setup ─────────────────────────────────────────────────────────────────

const DB_NAME = 'SecondBrainDB'
const DB_VER  = 1
let _db: IDBPDatabase | null = null

async function db(): Promise<IDBPDatabase> {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VER, {
    upgrade(d) {
      if (!d.objectStoreNames.contains('notes'))    d.createObjectStore('notes',    { keyPath: 'id' })
      if (!d.objectStoreNames.contains('tasks'))    d.createObjectStore('tasks',    { keyPath: 'id' })
      if (!d.objectStoreNames.contains('memories')) d.createObjectStore('memories', { keyPath: 'id' })
      if (!d.objectStoreNames.contains('chats'))    d.createObjectStore('chats',    { keyPath: 'id' })
    },
  })
  return _db
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export const NotesDB = {
  async getAll(): Promise<Note[]> {
    const all: Note[] = await (await db()).getAll('notes')
    return all.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
  },
  async get(id: string): Promise<Note | undefined> {
    return (await db()).get('notes', id)
  },
  async put(note: Note): Promise<void> {
    await (await db()).put('notes', note)
  },
  async delete(id: string): Promise<void> {
    await (await db()).delete('notes', id)
  },
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const TasksDB = {
  async getAll(): Promise<Task[]> {
    const all: Task[] = await (await db()).getAll('tasks')
    const pOrder = { high: 0, medium: 1, low: 2 }
    return all.sort((a, b) => {
      if ((a.status === 'done') !== (b.status === 'done'))
        return a.status === 'done' ? 1 : -1
      return pOrder[a.priority] - pOrder[b.priority]
    })
  },
  async put(task: Task): Promise<void> {
    await (await db()).put('tasks', task)
  },
  async delete(id: string): Promise<void> {
    await (await db()).delete('tasks', id)
  },
}

// ─── Memories ─────────────────────────────────────────────────────────────────

export const MemoryDB = {
  async getAll(): Promise<Memory[]> {
    const all: Memory[] = await (await db()).getAll('memories')
    return all.sort((a, b) => b.importance - a.importance)
  },
  async put(m: Memory): Promise<void> {
    await (await db()).put('memories', m)
  },
  async delete(id: string): Promise<void> {
    await (await db()).delete('memories', id)
  },
  async getContextString(limit = 6): Promise<string> {
    const all = await MemoryDB.getAll()
    return all.slice(0, limit).map(m => `[${m.type}] ${m.content}`).join('\n')
  },
}

// ─── Chats ────────────────────────────────────────────────────────────────────

export const ChatDB = {
  async getSession(sessionId: string): Promise<ChatMessage[]> {
    const all: ChatMessage[] = await (await db()).getAll('chats')
    return all.filter(m => m.sessionId === sessionId).sort((a, b) => a.timestamp - b.timestamp)
  },
  async put(msg: ChatMessage): Promise<void> {
    await (await db()).put('chats', msg)
  },
  async clearSession(sessionId: string): Promise<void> {
    const all: ChatMessage[] = await (await db()).getAll('chats')
    const d = await db()
    const tx = d.transaction('chats', 'readwrite')
    for (const m of all.filter(m => m.sessionId === sessionId)) {
      tx.store.delete(m.id)
    }
    await tx.done
  },
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStorageStats() {
  const [notes, tasks, memories] = await Promise.all([
    NotesDB.getAll(),
    TasksDB.getAll(),
    MemoryDB.getAll(),
  ])
  const est = await navigator.storage?.estimate?.().catch(() => ({} as StorageEstimate))
  return {
    notes: notes.length,
    tasks: tasks.length,
    memories: memories.length,
    storageUsed: est?.usage ?? 0,
    storageQuota: est?.quota ?? 0,
  }
}
