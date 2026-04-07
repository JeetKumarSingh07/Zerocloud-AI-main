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
import { SDKLogger } from '../Foundation/SDKLogger';
const logger = new SDKLogger('AnalyticsEmitter');
// ---------------------------------------------------------------------------
// Singleton holder
// ---------------------------------------------------------------------------
class AnalyticsEmitterHolder {
    _backend = null;
    /** Register the concrete backend (called once by LlamaCppProvider). */
    registerBackend(backend) {
        this._backend = backend;
        logger.info('Analytics emitter backend registered');
    }
    /** Remove the registered backend (called during cleanup). */
    removeBackend() {
        this._backend = null;
    }
    /** Whether a backend has been registered. */
    get hasBackend() {
        return this._backend !== null;
    }
    // -- STT -----------------------------------------------------------------
    emitSTTModelLoadCompleted(modelId, modelName, durationMs, framework) {
        this.safe(() => this._backend?.emitSTTModelLoadCompleted(modelId, modelName, durationMs, framework));
    }
    emitSTTModelLoadFailed(modelId, errorCode, errorMessage) {
        this.safe(() => this._backend?.emitSTTModelLoadFailed(modelId, errorCode, errorMessage));
    }
    emitSTTTranscriptionCompleted(transcriptionId, modelId, text, confidence, durationMs, audioLengthMs, audioSizeBytes, wordCount, realTimeFactor, language, sampleRate, framework) {
        this.safe(() => this._backend?.emitSTTTranscriptionCompleted(transcriptionId, modelId, text, confidence, durationMs, audioLengthMs, audioSizeBytes, wordCount, realTimeFactor, language, sampleRate, framework));
    }
    emitSTTTranscriptionFailed(transcriptionId, modelId, errorCode, errorMessage) {
        this.safe(() => this._backend?.emitSTTTranscriptionFailed(transcriptionId, modelId, errorCode, errorMessage));
    }
    // -- TTS -----------------------------------------------------------------
    emitTTSVoiceLoadCompleted(modelId, modelName, durationMs, framework) {
        this.safe(() => this._backend?.emitTTSVoiceLoadCompleted(modelId, modelName, durationMs, framework));
    }
    emitTTSVoiceLoadFailed(modelId, errorCode, errorMessage) {
        this.safe(() => this._backend?.emitTTSVoiceLoadFailed(modelId, errorCode, errorMessage));
    }
    emitTTSSynthesisCompleted(synthesisId, modelId, characterCount, audioDurationMs, audioSizeBytes, processingDurationMs, charactersPerSecond, sampleRate, framework) {
        this.safe(() => this._backend?.emitTTSSynthesisCompleted(synthesisId, modelId, characterCount, audioDurationMs, audioSizeBytes, processingDurationMs, charactersPerSecond, sampleRate, framework));
    }
    emitTTSSynthesisFailed(synthesisId, modelId, errorCode, errorMessage) {
        this.safe(() => this._backend?.emitTTSSynthesisFailed(synthesisId, modelId, errorCode, errorMessage));
    }
    // -- VAD -----------------------------------------------------------------
    emitVADSpeechStarted() {
        this.safe(() => this._backend?.emitVADSpeechStarted());
    }
    emitVADSpeechEnded(speechDurationMs, energyLevel) {
        this.safe(() => this._backend?.emitVADSpeechEnded(speechDurationMs, energyLevel));
    }
    // -- Download ------------------------------------------------------------
    emitModelDownloadStarted(modelId) {
        this.safe(() => this._backend?.emitModelDownloadStarted(modelId));
    }
    emitModelDownloadCompleted(modelId, fileSizeBytes, durationMs) {
        this.safe(() => this._backend?.emitModelDownloadCompleted(modelId, fileSizeBytes, durationMs));
    }
    emitModelDownloadFailed(modelId, errorMessage) {
        this.safe(() => this._backend?.emitModelDownloadFailed(modelId, errorMessage));
    }
    // -- Internal ------------------------------------------------------------
    /** Swallow any error from telemetry — must never crash the host app. */
    safe(fn) {
        try {
            fn();
        }
        catch { /* silent — telemetry must never block the app */ }
    }
}
export const AnalyticsEmitter = new AnalyticsEmitterHolder();
//# sourceMappingURL=AnalyticsEmitter.js.map