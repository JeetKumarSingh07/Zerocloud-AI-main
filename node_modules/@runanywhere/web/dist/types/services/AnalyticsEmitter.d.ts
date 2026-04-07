/**
 * AnalyticsEmitter — abstract telemetry emission interface.
 *
 * Backend-agnostic: the core package defines the interface, while the
 * llamacpp package provides the concrete WASM-backed implementation.
 * This mirrors the iOS architecture where all analytics events flow
 * through the C++ telemetry manager (rac_analytics_event_emit →
 * rac_telemetry_manager → HTTP callback).
 *
 * If no backend is registered, calls are silently dropped.
 */
export interface AnalyticsEmitterBackend {
    emitSTTModelLoadCompleted(modelId: string, modelName: string, durationMs: number, framework: number): void;
    emitSTTModelLoadFailed(modelId: string, errorCode: number, errorMessage: string): void;
    emitSTTTranscriptionCompleted(transcriptionId: string, modelId: string, text: string, confidence: number, durationMs: number, audioLengthMs: number, audioSizeBytes: number, wordCount: number, realTimeFactor: number, language: string, sampleRate: number, framework: number): void;
    emitSTTTranscriptionFailed(transcriptionId: string, modelId: string, errorCode: number, errorMessage: string): void;
    emitTTSVoiceLoadCompleted(modelId: string, modelName: string, durationMs: number, framework: number): void;
    emitTTSVoiceLoadFailed(modelId: string, errorCode: number, errorMessage: string): void;
    emitTTSSynthesisCompleted(synthesisId: string, modelId: string, characterCount: number, audioDurationMs: number, audioSizeBytes: number, processingDurationMs: number, charactersPerSecond: number, sampleRate: number, framework: number): void;
    emitTTSSynthesisFailed(synthesisId: string, modelId: string, errorCode: number, errorMessage: string): void;
    emitVADSpeechStarted(): void;
    emitVADSpeechEnded(speechDurationMs: number, energyLevel: number): void;
    emitModelDownloadStarted(modelId: string): void;
    emitModelDownloadCompleted(modelId: string, fileSizeBytes: number, durationMs: number): void;
    emitModelDownloadFailed(modelId: string, errorMessage: string): void;
}
declare class AnalyticsEmitterHolder {
    private _backend;
    /** Register the concrete backend (called once by LlamaCppProvider). */
    registerBackend(backend: AnalyticsEmitterBackend): void;
    /** Remove the registered backend (called during cleanup). */
    removeBackend(): void;
    /** Whether a backend has been registered. */
    get hasBackend(): boolean;
    emitSTTModelLoadCompleted(modelId: string, modelName: string, durationMs: number, framework: number): void;
    emitSTTModelLoadFailed(modelId: string, errorCode: number, errorMessage: string): void;
    emitSTTTranscriptionCompleted(transcriptionId: string, modelId: string, text: string, confidence: number, durationMs: number, audioLengthMs: number, audioSizeBytes: number, wordCount: number, realTimeFactor: number, language: string, sampleRate: number, framework: number): void;
    emitSTTTranscriptionFailed(transcriptionId: string, modelId: string, errorCode: number, errorMessage: string): void;
    emitTTSVoiceLoadCompleted(modelId: string, modelName: string, durationMs: number, framework: number): void;
    emitTTSVoiceLoadFailed(modelId: string, errorCode: number, errorMessage: string): void;
    emitTTSSynthesisCompleted(synthesisId: string, modelId: string, characterCount: number, audioDurationMs: number, audioSizeBytes: number, processingDurationMs: number, charactersPerSecond: number, sampleRate: number, framework: number): void;
    emitTTSSynthesisFailed(synthesisId: string, modelId: string, errorCode: number, errorMessage: string): void;
    emitVADSpeechStarted(): void;
    emitVADSpeechEnded(speechDurationMs: number, energyLevel: number): void;
    emitModelDownloadStarted(modelId: string): void;
    emitModelDownloadCompleted(modelId: string, fileSizeBytes: number, durationMs: number): void;
    emitModelDownloadFailed(modelId: string, errorMessage: string): void;
    /** Swallow any error from telemetry — must never crash the host app. */
    private safe;
}
export declare const AnalyticsEmitter: AnalyticsEmitterHolder;
export {};
//# sourceMappingURL=AnalyticsEmitter.d.ts.map