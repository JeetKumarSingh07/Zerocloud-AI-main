/**
 * RunAnywhere Web SDK - Enums
 *
 * These enums match the iOS Swift SDK exactly for consistency.
 * Mirrored from: sdk/runanywhere-react-native/packages/core/src/types/enums.ts
 * Source of truth: sdk/runanywhere-swift/Sources/RunAnywhere/Core/
 */
export declare enum SDKEnvironment {
    Development = "development",
    Staging = "staging",
    Production = "production"
}
export declare enum ExecutionTarget {
    OnDevice = "onDevice",
    Cloud = "cloud",
    Hybrid = "hybrid"
}
export declare enum LLMFramework {
    CoreML = "CoreML",
    TensorFlowLite = "TFLite",
    MLX = "MLX",
    SwiftTransformers = "SwiftTransformers",
    ONNX = "ONNX",
    ExecuTorch = "ExecuTorch",
    LlamaCpp = "LlamaCpp",
    FoundationModels = "FoundationModels",
    PicoLLM = "PicoLLM",
    MLC = "MLC",
    MediaPipe = "MediaPipe",
    WhisperKit = "WhisperKit",
    OpenAIWhisper = "OpenAIWhisper",
    SystemTTS = "SystemTTS",
    PiperTTS = "PiperTTS"
}
export declare enum ModelCategory {
    /** Large Language Models (LLM) for text generation. */
    Language = "language",
    /** Speech-to-Text (STT) transcription models (~105 MB+). */
    SpeechRecognition = "speech-recognition",
    /** Text-to-Speech (TTS) synthesis models. */
    SpeechSynthesis = "speech-synthesis",
    /** Vision-Language Models (VLM) for image understanding. */
    Vision = "vision",
    /** Diffusion / image generation models. */
    ImageGeneration = "image-generation",
    /** Models combining multiple modalities. */
    Multimodal = "multimodal",
    /** Voice Activity Detection (VAD) — detects speech boundaries (~5 MB). Not transcription — use SpeechRecognition for STT. */
    Audio = "audio"
}
export declare enum ModelFormat {
    GGUF = "gguf",
    GGML = "ggml",
    ONNX = "onnx",
    MLModel = "mlmodel",
    MLPackage = "mlpackage",
    TFLite = "tflite",
    SafeTensors = "safetensors",
    Bin = "bin",
    Zip = "zip",
    Folder = "folder",
    Proprietary = "proprietary",
    Unknown = "unknown"
}
export declare enum FrameworkModality {
    TextToText = "textToText",
    VoiceToText = "voiceToText",
    TextToVoice = "textToVoice",
    ImageToText = "imageToText",
    TextToImage = "textToImage",
    Multimodal = "multimodal"
}
export declare enum ComponentState {
    NotInitialized = "notInitialized",
    Initializing = "initializing",
    Ready = "ready",
    Error = "error",
    CleaningUp = "cleaningUp"
}
export declare enum SDKComponent {
    LLM = "llm",
    STT = "stt",
    TTS = "tts",
    VAD = "vad",
    VLM = "vlm",
    Embedding = "embedding",
    Diffusion = "diffusion",
    SpeakerDiarization = "speakerDiarization",
    VoiceAgent = "voice"
}
export declare enum RoutingPolicy {
    OnDevicePreferred = "onDevicePreferred",
    CloudPreferred = "cloudPreferred",
    OnDeviceOnly = "onDeviceOnly",
    CloudOnly = "cloudOnly",
    Hybrid = "hybrid",
    CostOptimized = "costOptimized",
    LatencyOptimized = "latencyOptimized",
    PrivacyOptimized = "privacyOptimized"
}
export declare enum HardwareAcceleration {
    CPU = "cpu",
    GPU = "gpu",
    NeuralEngine = "neuralEngine",
    NPU = "npu",
    /** WebGPU acceleration (browser-specific) */
    WebGPU = "webgpu",
    /** WebAssembly SIMD (browser-specific) */
    WASM = "wasm"
}
export declare enum ConfigurationSource {
    Remote = "remote",
    Local = "local",
    Builtin = "builtin"
}
export declare enum ModelStatus {
    Registered = "registered",
    Downloading = "downloading",
    Downloaded = "downloaded",
    Loading = "loading",
    Loaded = "loaded",
    Error = "error"
}
export declare enum DownloadStage {
    Downloading = "downloading",
    Validating = "validating",
    Completed = "completed"
}
export declare enum SDKEventType {
    Initialization = "initialization",
    Configuration = "configuration",
    Generation = "generation",
    Model = "model",
    Voice = "voice",
    Storage = "storage",
    Framework = "framework",
    Device = "device",
    Error = "error",
    Performance = "performance",
    Network = "network"
}
/** Hardware acceleration preference for SDK initialization. */
export declare enum AccelerationPreference {
    /** Detect WebGPU and use it when available, fall back to CPU. */
    Auto = "auto",
    /** Force WebGPU (fails gracefully to CPU if unavailable). */
    WebGPU = "webgpu",
    /** Always use CPU-only WASM (skip WebGPU detection entirely). */
    CPU = "cpu"
}
//# sourceMappingURL=enums.d.ts.map