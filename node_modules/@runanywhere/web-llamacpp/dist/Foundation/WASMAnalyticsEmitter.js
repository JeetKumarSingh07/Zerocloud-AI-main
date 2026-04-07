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
import { LlamaCppBridge } from './LlamaCppBridge';
export class WASMAnalyticsEmitter {
    // -- STT -----------------------------------------------------------------
    emitSTTModelLoadCompleted(modelId, modelName, durationMs, framework) {
        this.call('rac_analytics_emit_stt_model_load_completed', ['string', 'string', 'number', 'number'], [modelId, modelName, durationMs, framework]);
    }
    emitSTTModelLoadFailed(modelId, errorCode, errorMessage) {
        this.call('rac_analytics_emit_stt_model_load_failed', ['string', 'number', 'string'], [modelId, errorCode, errorMessage]);
    }
    emitSTTTranscriptionCompleted(transcriptionId, modelId, text, confidence, durationMs, audioLengthMs, audioSizeBytes, wordCount, realTimeFactor, language, sampleRate, framework) {
        this.call('rac_analytics_emit_stt_transcription_completed', ['string', 'string', 'string', 'number', 'number', 'number',
            'number', 'number', 'number', 'string', 'number', 'number'], [transcriptionId, modelId, text, confidence, durationMs, audioLengthMs,
            audioSizeBytes, wordCount, realTimeFactor, language, sampleRate, framework]);
    }
    emitSTTTranscriptionFailed(transcriptionId, modelId, errorCode, errorMessage) {
        this.call('rac_analytics_emit_stt_transcription_failed', ['string', 'string', 'number', 'string'], [transcriptionId, modelId, errorCode, errorMessage]);
    }
    // -- TTS -----------------------------------------------------------------
    emitTTSVoiceLoadCompleted(modelId, modelName, durationMs, framework) {
        this.call('rac_analytics_emit_tts_voice_load_completed', ['string', 'string', 'number', 'number'], [modelId, modelName, durationMs, framework]);
    }
    emitTTSVoiceLoadFailed(modelId, errorCode, errorMessage) {
        this.call('rac_analytics_emit_tts_voice_load_failed', ['string', 'number', 'string'], [modelId, errorCode, errorMessage]);
    }
    emitTTSSynthesisCompleted(synthesisId, modelId, characterCount, audioDurationMs, audioSizeBytes, processingDurationMs, charactersPerSecond, sampleRate, framework) {
        this.call('rac_analytics_emit_tts_synthesis_completed', ['string', 'string', 'number', 'number', 'number', 'number', 'number', 'number', 'number'], [synthesisId, modelId, characterCount, audioDurationMs, audioSizeBytes,
            processingDurationMs, charactersPerSecond, sampleRate, framework]);
    }
    emitTTSSynthesisFailed(synthesisId, modelId, errorCode, errorMessage) {
        this.call('rac_analytics_emit_tts_synthesis_failed', ['string', 'string', 'number', 'string'], [synthesisId, modelId, errorCode, errorMessage]);
    }
    // -- VAD -----------------------------------------------------------------
    emitVADSpeechStarted() {
        this.call('rac_analytics_emit_vad_speech_started', [], []);
    }
    emitVADSpeechEnded(speechDurationMs, energyLevel) {
        this.call('rac_analytics_emit_vad_speech_ended', ['number', 'number'], [speechDurationMs, energyLevel]);
    }
    // -- Download ------------------------------------------------------------
    emitModelDownloadStarted(modelId) {
        this.call('rac_analytics_emit_model_download_started', ['string'], [modelId]);
    }
    emitModelDownloadCompleted(modelId, fileSizeBytes, durationMs) {
        this.call('rac_analytics_emit_model_download_completed', ['string', 'number', 'number'], [modelId, fileSizeBytes, durationMs]);
    }
    emitModelDownloadFailed(modelId, errorMessage) {
        this.call('rac_analytics_emit_model_download_failed', ['string', 'string'], [modelId, errorMessage]);
    }
    // -- Internals -----------------------------------------------------------
    call(funcName, argTypes, args) {
        try {
            LlamaCppBridge.shared.callFunction(funcName, null, argTypes, args);
        }
        catch {
            // Silently ignore — telemetry must never crash the app
        }
    }
}
//# sourceMappingURL=WASMAnalyticsEmitter.js.map