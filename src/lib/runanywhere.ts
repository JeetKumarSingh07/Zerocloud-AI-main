export interface ModelInfo {
  id: string; name: string; description: string; sizeMB: number; badge?: string
}

export type GenerationProfile = 'instant' | 'balanced'

export const AVAILABLE_MODELS: ModelInfo[] = [
  { id:'lfm2-350m',    name:'LFM2 350M',    description:'Liquid AI · 8–15 tok/s · ~250MB · Best speed ⚡', sizeMB:250,  badge:'⚡ Fastest'  },
  { id:'smollm2-1.7b', name:'SmolLM2 1.7B', description:'HuggingFace · 2–5 tok/s · ~1GB · Best quality 🎯', sizeMB:1000, badge:'🎯 Smartest' },
  { id:'mistral-7b',   name:'Mistral 7B',   description:'Mistral AI · ~4GB · Best reasoning 🧠 · Requires 6GB+ RAM', sizeMB:4000, badge:'🧠 Smartest' },
]

let _ready     = false
let _modelId:  string | null = null
let _modelInfo:ModelInfo | null = null
let _TextGen:  any = null
let _ModelMgr: any = null
let _cancelFn: (() => void) | null = null
let _busy      = false
let _webGPU    = false
const GEN_PROFILE_KEY = 'zc_gen_profile_v1'

function readGenerationProfile(): GenerationProfile {
  try {
    const raw = localStorage.getItem(GEN_PROFILE_KEY)
    return raw === 'instant' ? 'instant' : 'balanced'
  } catch {
    return 'balanced'
  }
}

let _generationProfile: GenerationProfile = readGenerationProfile()

export const isModelReady = () => _ready
export const activeModel  = () => _modelInfo
export const isWebGPU     = () => _webGPU
export const getGenerationProfile = () => _generationProfile

export function setGenerationProfile(profile: GenerationProfile) {
  _generationProfile = profile
  try { localStorage.setItem(GEN_PROFILE_KEY, profile) } catch {}
}

export async function detectWebGPU(): Promise<boolean> {
  try {
    if (!(navigator as any).gpu) return false
    const adapter = await (navigator as any).gpu.requestAdapter()
    return !!adapter
  } catch { return false }
}

export async function initRunAnywhere(
  modelId: string,
  onProgress: (pct: number, stage: string) => void
): Promise<void> {
  _ready = false; _modelId = null; _TextGen = null; _ModelMgr = null; _busy = false

  try {
    onProgress(3, 'Detecting hardware acceleration…')
    _webGPU = await detectWebGPU()

    onProgress(5, `Loading SDK packages… (${_webGPU ? 'WebGPU ✓' : 'WASM fallback'})`)
    const [core, llama] = await Promise.all([
      import('@runanywhere/web'),
      import('@runanywhere/web-llamacpp'),
    ])
    const { RunAnywhere, SDKEnvironment, ModelManager, ModelCategory, LLMFramework, EventBus } = core
    const { LlamaCPP, TextGeneration } = llama
    _ModelMgr = ModelManager
    _TextGen  = TextGeneration

    onProgress(12, 'Initializing RunAnywhere SDK…')
    const initOpts: any = { environment: SDKEnvironment.Development, debug: false }
    if (_webGPU) { try { initOpts.backend = 'webgpu' } catch {} }
    await RunAnywhere.initialize(initOpts)

    onProgress(20, 'Registering LlamaCPP backend…')
    await LlamaCPP.register()

    onProgress(28, 'Registering model catalog…')
    RunAnywhere.registerModels([
      { id:'lfm2-350m', name:'LFM2 350M Q4_K_M', repo:'LiquidAI/LFM2-350M-GGUF', files:['LFM2-350M-Q4_K_M.gguf'], framework:LLMFramework.LlamaCpp, modality:ModelCategory.Language, memoryRequirement:250_000_000 },
      { id:'smollm2-1.7b', name:'SmolLM2 1.7B Instruct Q4_K_M', repo:'HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF', files:['smollm2-1.7b-instruct-q4_k_m.gguf'], framework:LLMFramework.LlamaCpp, modality:ModelCategory.Language, memoryRequirement:1_050_000_000 },
      { id:'mistral-7b', name:'Mistral 7B Instruct v0.3 Q4_K_M', repo:'MaziyarPanahi/Mistral-7B-Instruct-v0.3-GGUF', files:['Mistral-7B-Instruct-v0.3.Q4_K_M.gguf'], framework:LLMFramework.LlamaCpp, modality:ModelCategory.Language, memoryRequirement:4_000_000_000 },
    ])

    onProgress(33, 'Freeing WASM memory…')
    try {
      for (const m of ModelManager.getModels()) {
        if (m.status === 'loaded') await ModelManager.unloadModel(m.id)
      }
    } catch {}

    const model = ModelManager.getModels().find((m: any) => m.id === modelId)
    if (!model) throw new Error(`Model "${modelId}" not found`)

    if (model.status !== 'downloaded' && model.status !== 'loaded') {
      onProgress(38, `Downloading ${model.name}…`)
      let lastPct = -1
      const unsub = EventBus.shared.on('model.downloadProgress', (evt: any) => {
        if (evt.modelId !== modelId) return
        const raw = Math.round((evt.progress ?? 0) * 100)
        if (raw <= lastPct) return
        lastPct = raw
        onProgress(38 + Math.round(raw * 0.5), `Downloading… ${raw}%`)
      })
      try { await ModelManager.downloadModel(modelId) }
      finally { try { unsub?.() } catch {} }
    } else {
      onProgress(85, 'Found in cache…')
    }

    onProgress(88, 'Loading model into memory…')
    await ModelManager.loadModel(modelId)

    _modelId   = modelId
    _modelInfo = AVAILABLE_MODELS.find(m => m.id === modelId) ?? null
    _ready     = true
    onProgress(100, `Ready! ${_webGPU ? '⚡ WebGPU accelerated' : '✓ WASM threads'}`)
  } catch (err) {
    _ready = false; _TextGen = null; _ModelMgr = null
    throw err
  }
}

export interface GenerateOptions {
  systemPrompt?: string
  maxTokens?:    number
  temperature?:  number
  timeoutMs?:    number
  onToken?:      (token: string, accumulated: string) => void
  signal?:       AbortSignal
}

export function cancelGeneration() {
  _cancelFn?.()
  _cancelFn = null
  _busy = false
}

export async function generateText(
  userPrompt: string,
  opts: GenerateOptions = {}
): Promise<string> {
  if (!_ready || !_modelId || !_TextGen || !_ModelMgr) {
    throw new Error('Model not loaded — complete setup first.')
  }

  if (_busy) {
    _cancelFn?.()
    _cancelFn = null
    await new Promise(r => setTimeout(r, 50))
    _busy = false
  }

  // Fast defaults tuned for responsive UX on local models.
  const {
    systemPrompt,
    maxTokens = 56,
    temperature = 0.2,
    timeoutMs = 7000,
    onToken,
    signal,
  } = opts

  const cleanUserPrompt = userPrompt.trim().slice(0, 1200)
  const cleanSystemPrompt = systemPrompt?.trim()
  const profile = _generationProfile
  const profileMaxTokens = profile === 'instant' ? Math.min(maxTokens, 42) : maxTokens
  const profileTemperature = profile === 'instant' ? Math.min(Math.max(temperature, 0.05), 0.2) : temperature
  const profileTimeoutMs = profile === 'instant' ? Math.min(timeoutMs, 4500) : timeoutMs
  const effectiveMaxTokens = Math.max(16, Math.min(profileMaxTokens, 72))
  const safePrompt = cleanSystemPrompt
    ? `System: ${cleanSystemPrompt}\n\nUser: ${cleanUserPrompt}\n\nAssistant:`
    : cleanUserPrompt

  _busy = true
  try {
    const models = _ModelMgr.getModels()
    const current = models.find((m: any) => m.id === _modelId)
    if (current && current.status !== 'loaded') {
      await _ModelMgr.loadModel(_modelId)
    }

    const { stream, result: resultPromise, cancel } =
      await _TextGen.generateStream(safePrompt, { maxTokens: effectiveMaxTokens, temperature: profileTemperature })

    _cancelFn = cancel ?? null
    signal?.addEventListener('abort', () => { cancel?.(); _cancelFn = null; _busy = false })

    let timedOut = false
    const timer = profileTimeoutMs > 0
      ? setTimeout(() => {
          timedOut = true
          cancel?.()
        }, profileTimeoutMs)
      : null

    let out = '', last = '', rep = 0
    try {
      for await (const tok of stream) {
        if (signal?.aborted) break

        // Break token loops quickly to avoid endless repeated fragments.
        if (tok === last) {
          rep += 1
          if (rep >= 3) {
            cancel?.()
            break
          }
        } else {
          rep = 0
        }
        last = tok

        out += tok
        onToken?.(tok, out)
      }
    } finally {
      if (timer) clearTimeout(timer)
      _cancelFn = null
    }

    try { await resultPromise } catch {}

    const cleaned = out
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/#{1,3}\s*/g, '')
      .replace(/[\uFFFD\u25C6\u25CA\u25BC\u25BD\u2666\u2665\u2663\u2660]/g, '')
      .replace(/[\u0400-\u04FF]/g, '')
      .replace(/[\u0000-\u0008\u000B-\u001F]/g, '')
      .replace(/\b(\w+)(?:\s+\1){2,}\b/gi, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()

    if (timedOut && cleaned) return `${cleaned} [partial]`
    return cleaned
  } finally {
    _busy = false
  }
}

export function startSpeechRecognition(
  lang: string,
  onInterim:(t:string)=>void,
  onFinal:(t:string)=>void,
  onError:(e:string)=>void
):()=>void {
  const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
  if(!SR){onError('browser-unsupported');return()=>{}}

  const r=new SR()
  r.lang = lang || 'en-US'
  r.interimResults = true
  r.continuous = false
  r.maxAlternatives = 1

  let final=''
  r.onresult=(e:any)=>{
    let interim=''
    for(let x=e.resultIndex;x<e.results.length;x++){
      if(e.results[x].isFinal) final+=e.results[x][0].transcript
      else interim=e.results[x][0].transcript
    }
    onInterim(final+interim)
  }
  r.onend=()=>onFinal(final)
  r.onerror=(e:any)=>{
    const msgs: Record<string,string> = {
      'not-allowed':    'Mic blocked — click 🔒 in browser bar → allow Microphone → retry.',
      'network':        'Speech API needs internet (browser sends audio to Google). Connect to internet and retry.',
      'no-speech':      'No speech detected — speak louder or check your mic.',
      'audio-capture':  'No microphone found — connect a mic and retry.',
      'service-not-allowed': 'Speech blocked — enable mic permission in browser settings.',
      'aborted':        '',
      'browser-unsupported': 'Use Chrome or Edge for speech recognition.',
    }
    const msg = msgs[e.error] ?? `Mic error: ${e.error}`
    if (msg) onError(msg)
  }
  r.start()
  return()=>{try{r.stop()}catch{}}
}

export function speakText(text:string, lang='en-US', rate=0.85):Promise<void>{
  return new Promise(resolve=>{
    window.speechSynthesis.cancel()
    const u=new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = rate
    u.onend=()=>resolve()
    u.onerror=()=>resolve()
    window.speechSynthesis.speak(u)
  })
}
export function stopSpeaking(){window.speechSynthesis.cancel()}
