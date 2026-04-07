/**
 * WASMAnalyticsEmitter — routes analytics events into the C++ telemetry
 * manager via Emscripten ccall() on the LlamaCpp WASM module.
 *
 * Each method maps 1:1 to a C-linkage function in events.cpp:
 *   rac_analytics_emit_stt_transcription_completed(...)
 *   → ccall('rac_analytics_emit_stt_transcription_completed', ...)
 *
 * Emscripten handles string marshalling: allocates C strings in WASM heap,
 * copies UTF-8 data, and frees after the call returns.
 */
import type { AnalyticsEmitterBackend } from '@runanywhere/web';
export declare class WASMAnalyticsEmitter implements AnalyticsEmitterBackend {
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
    private call;
}
//# sourceMappingURL=WASMAnalyticsEmitter.d.ts.map