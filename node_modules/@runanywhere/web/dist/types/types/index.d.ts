/**
 * RunAnywhere Web SDK - Type Exports
 *
 * Re-exports all types for convenient importing.
 * All feature types (LLM, VLM, STT, TTS, VAD) are defined here in core
 * so backend packages are pure plug-and-play implementations.
 */
export { AccelerationPreference, ComponentState, ConfigurationSource, DownloadStage, ExecutionTarget, FrameworkModality, HardwareAcceleration, LLMFramework, ModelCategory, ModelFormat, ModelStatus, RoutingPolicy, SDKComponent, SDKEnvironment, SDKEventType, } from './enums';
export type { DeviceInfoData, GenerationOptions, GenerationResult, ModelInfoMetadata, PerformanceMetrics, SDKInitOptions, STTAlternative, STTOptions, STTResult, STTSegment, StorageInfo, StoredModel, ThinkingTagPattern, TTSConfiguration, TTSResult, VADConfiguration, } from './models';
export type { LLMGenerationOptions, LLMGenerationResult, LLMStreamingResult, LLMStreamingMetrics, LLMTokenCallback, LLMStreamCompleteCallback, LLMStreamErrorCallback, } from './LLMTypes';
export { VLMImageFormat } from './VLMTypes';
export type { VLMImage, VLMGenerationOptions, VLMGenerationResult, VLMStreamingResult, } from './VLMTypes';
export type { STTTranscriptionResult, STTWord, STTTranscribeOptions, STTStreamCallback, STTStreamingSession, } from './STTTypes';
export type { TTSSynthesisResult, TTSSynthesizeOptions, } from './TTSTypes';
export { SpeechActivity } from './VADTypes';
export type { SpeechActivityCallback, SpeechSegment, } from './VADTypes';
//# sourceMappingURL=index.d.ts.map