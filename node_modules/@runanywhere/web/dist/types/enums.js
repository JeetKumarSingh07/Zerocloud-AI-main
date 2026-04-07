/**
 * RunAnywhere Web SDK - Enums
 *
 * These enums match the iOS Swift SDK exactly for consistency.
 * Mirrored from: sdk/runanywhere-react-native/packages/core/src/types/enums.ts
 * Source of truth: sdk/runanywhere-swift/Sources/RunAnywhere/Core/
 */
export var SDKEnvironment;
(function (SDKEnvironment) {
    SDKEnvironment["Development"] = "development";
    SDKEnvironment["Staging"] = "staging";
    SDKEnvironment["Production"] = "production";
})(SDKEnvironment || (SDKEnvironment = {}));
export var ExecutionTarget;
(function (ExecutionTarget) {
    ExecutionTarget["OnDevice"] = "onDevice";
    ExecutionTarget["Cloud"] = "cloud";
    ExecutionTarget["Hybrid"] = "hybrid";
})(ExecutionTarget || (ExecutionTarget = {}));
export var LLMFramework;
(function (LLMFramework) {
    LLMFramework["CoreML"] = "CoreML";
    LLMFramework["TensorFlowLite"] = "TFLite";
    LLMFramework["MLX"] = "MLX";
    LLMFramework["SwiftTransformers"] = "SwiftTransformers";
    LLMFramework["ONNX"] = "ONNX";
    LLMFramework["ExecuTorch"] = "ExecuTorch";
    LLMFramework["LlamaCpp"] = "LlamaCpp";
    LLMFramework["FoundationModels"] = "FoundationModels";
    LLMFramework["PicoLLM"] = "PicoLLM";
    LLMFramework["MLC"] = "MLC";
    LLMFramework["MediaPipe"] = "MediaPipe";
    LLMFramework["WhisperKit"] = "WhisperKit";
    LLMFramework["OpenAIWhisper"] = "OpenAIWhisper";
    LLMFramework["SystemTTS"] = "SystemTTS";
    LLMFramework["PiperTTS"] = "PiperTTS";
})(LLMFramework || (LLMFramework = {}));
export var ModelCategory;
(function (ModelCategory) {
    /** Large Language Models (LLM) for text generation. */
    ModelCategory["Language"] = "language";
    /** Speech-to-Text (STT) transcription models (~105 MB+). */
    ModelCategory["SpeechRecognition"] = "speech-recognition";
    /** Text-to-Speech (TTS) synthesis models. */
    ModelCategory["SpeechSynthesis"] = "speech-synthesis";
    /** Vision-Language Models (VLM) for image understanding. */
    ModelCategory["Vision"] = "vision";
    /** Diffusion / image generation models. */
    ModelCategory["ImageGeneration"] = "image-generation";
    /** Models combining multiple modalities. */
    ModelCategory["Multimodal"] = "multimodal";
    /** Voice Activity Detection (VAD) — detects speech boundaries (~5 MB). Not transcription — use SpeechRecognition for STT. */
    ModelCategory["Audio"] = "audio";
})(ModelCategory || (ModelCategory = {}));
export var ModelFormat;
(function (ModelFormat) {
    ModelFormat["GGUF"] = "gguf";
    ModelFormat["GGML"] = "ggml";
    ModelFormat["ONNX"] = "onnx";
    ModelFormat["MLModel"] = "mlmodel";
    ModelFormat["MLPackage"] = "mlpackage";
    ModelFormat["TFLite"] = "tflite";
    ModelFormat["SafeTensors"] = "safetensors";
    ModelFormat["Bin"] = "bin";
    ModelFormat["Zip"] = "zip";
    ModelFormat["Folder"] = "folder";
    ModelFormat["Proprietary"] = "proprietary";
    ModelFormat["Unknown"] = "unknown";
})(ModelFormat || (ModelFormat = {}));
export var FrameworkModality;
(function (FrameworkModality) {
    FrameworkModality["TextToText"] = "textToText";
    FrameworkModality["VoiceToText"] = "voiceToText";
    FrameworkModality["TextToVoice"] = "textToVoice";
    FrameworkModality["ImageToText"] = "imageToText";
    FrameworkModality["TextToImage"] = "textToImage";
    FrameworkModality["Multimodal"] = "multimodal";
})(FrameworkModality || (FrameworkModality = {}));
export var ComponentState;
(function (ComponentState) {
    ComponentState["NotInitialized"] = "notInitialized";
    ComponentState["Initializing"] = "initializing";
    ComponentState["Ready"] = "ready";
    ComponentState["Error"] = "error";
    ComponentState["CleaningUp"] = "cleaningUp";
})(ComponentState || (ComponentState = {}));
export var SDKComponent;
(function (SDKComponent) {
    SDKComponent["LLM"] = "llm";
    SDKComponent["STT"] = "stt";
    SDKComponent["TTS"] = "tts";
    SDKComponent["VAD"] = "vad";
    SDKComponent["VLM"] = "vlm";
    SDKComponent["Embedding"] = "embedding";
    SDKComponent["Diffusion"] = "diffusion";
    SDKComponent["SpeakerDiarization"] = "speakerDiarization";
    SDKComponent["VoiceAgent"] = "voice";
})(SDKComponent || (SDKComponent = {}));
export var RoutingPolicy;
(function (RoutingPolicy) {
    RoutingPolicy["OnDevicePreferred"] = "onDevicePreferred";
    RoutingPolicy["CloudPreferred"] = "cloudPreferred";
    RoutingPolicy["OnDeviceOnly"] = "onDeviceOnly";
    RoutingPolicy["CloudOnly"] = "cloudOnly";
    RoutingPolicy["Hybrid"] = "hybrid";
    RoutingPolicy["CostOptimized"] = "costOptimized";
    RoutingPolicy["LatencyOptimized"] = "latencyOptimized";
    RoutingPolicy["PrivacyOptimized"] = "privacyOptimized";
})(RoutingPolicy || (RoutingPolicy = {}));
export var HardwareAcceleration;
(function (HardwareAcceleration) {
    HardwareAcceleration["CPU"] = "cpu";
    HardwareAcceleration["GPU"] = "gpu";
    HardwareAcceleration["NeuralEngine"] = "neuralEngine";
    HardwareAcceleration["NPU"] = "npu";
    /** WebGPU acceleration (browser-specific) */
    HardwareAcceleration["WebGPU"] = "webgpu";
    /** WebAssembly SIMD (browser-specific) */
    HardwareAcceleration["WASM"] = "wasm";
})(HardwareAcceleration || (HardwareAcceleration = {}));
export var ConfigurationSource;
(function (ConfigurationSource) {
    ConfigurationSource["Remote"] = "remote";
    ConfigurationSource["Local"] = "local";
    ConfigurationSource["Builtin"] = "builtin";
})(ConfigurationSource || (ConfigurationSource = {}));
export var ModelStatus;
(function (ModelStatus) {
    ModelStatus["Registered"] = "registered";
    ModelStatus["Downloading"] = "downloading";
    ModelStatus["Downloaded"] = "downloaded";
    ModelStatus["Loading"] = "loading";
    ModelStatus["Loaded"] = "loaded";
    ModelStatus["Error"] = "error";
})(ModelStatus || (ModelStatus = {}));
export var DownloadStage;
(function (DownloadStage) {
    DownloadStage["Downloading"] = "downloading";
    DownloadStage["Validating"] = "validating";
    DownloadStage["Completed"] = "completed";
})(DownloadStage || (DownloadStage = {}));
export var SDKEventType;
(function (SDKEventType) {
    SDKEventType["Initialization"] = "initialization";
    SDKEventType["Configuration"] = "configuration";
    SDKEventType["Generation"] = "generation";
    SDKEventType["Model"] = "model";
    SDKEventType["Voice"] = "voice";
    SDKEventType["Storage"] = "storage";
    SDKEventType["Framework"] = "framework";
    SDKEventType["Device"] = "device";
    SDKEventType["Error"] = "error";
    SDKEventType["Performance"] = "performance";
    SDKEventType["Network"] = "network";
})(SDKEventType || (SDKEventType = {}));
/** Hardware acceleration preference for SDK initialization. */
export var AccelerationPreference;
(function (AccelerationPreference) {
    /** Detect WebGPU and use it when available, fall back to CPU. */
    AccelerationPreference["Auto"] = "auto";
    /** Force WebGPU (fails gracefully to CPU if unavailable). */
    AccelerationPreference["WebGPU"] = "webgpu";
    /** Always use CPU-only WASM (skip WebGPU detection entirely). */
    AccelerationPreference["CPU"] = "cpu";
})(AccelerationPreference || (AccelerationPreference = {}));
//# sourceMappingURL=enums.js.map