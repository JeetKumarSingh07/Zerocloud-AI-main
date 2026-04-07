/**
 * RunAnywhere Web SDK - Core Package (Pure TypeScript)
 *
 * Backend-agnostic infrastructure for on-device AI in the browser.
 * This package has ZERO WASM — all inference binaries live in backend packages:
 *   - @runanywhere/web-llamacpp — LLM, VLM, embeddings, diffusion (ships racommons-llamacpp.wasm)
 *   - @runanywhere/web-onnx — STT, TTS, VAD (ships sherpa-onnx.wasm)
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { RunAnywhere } from '@runanywhere/web';
 * import { LlamaCPP } from '@runanywhere/web-llamacpp';
 * import { ONNX } from '@runanywhere/web-onnx';
 *
 * await RunAnywhere.initialize({ environment: 'development' });
 * await LlamaCPP.register();
 * await ONNX.register();
 * ```
 */
// Main entry point
export { RunAnywhere } from './Public/RunAnywhere';
// Voice orchestration (cross-backend, uses provider interfaces)
export { VoiceAgent, VoiceAgentSession, PipelineState } from './Public/Extensions/RunAnywhere+VoiceAgent';
export { VoicePipeline } from './Public/Extensions/RunAnywhere+VoicePipeline';
// Types
export * from './types';
// Foundation
export { SDKError, SDKErrorCode, isSDKError } from './Foundation/ErrorTypes';
export { SDKLogger, LogLevel } from './Foundation/SDKLogger';
export { EventBus } from './Foundation/EventBus';
// I/O Infrastructure (backend-agnostic capture/playback)
export { AudioCapture } from './Infrastructure/AudioCapture';
export { AudioPlayback } from './Infrastructure/AudioPlayback';
export { AudioFileLoader } from './Infrastructure/AudioFileLoader';
export { VideoCapture } from './Infrastructure/VideoCapture';
// Infrastructure
export { detectCapabilities, getDeviceInfo } from './Infrastructure/DeviceCapabilities';
export { ModelManager } from './Infrastructure/ModelManager';
export { OPFSStorage } from './Infrastructure/OPFSStorage';
export { ExtensionRegistry } from './Infrastructure/ExtensionRegistry';
export { ExtensionPoint, BackendCapability, ServiceKey } from './Infrastructure/ExtensionPoint';
export { extractTarGz } from './Infrastructure/ArchiveUtility';
export { LocalFileStorage } from './Infrastructure/LocalFileStorage';
export { inferModelFromFilename, sanitizeId } from './Infrastructure/ModelFileInference';
// Services
export { HTTPService } from './services/HTTPService';
export { AnalyticsEmitter } from './services/AnalyticsEmitter';
//# sourceMappingURL=index.js.map