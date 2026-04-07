/**
 * RunAnywhere Web SDK - Speech-to-Text Extension
 *
 * Adds STT (speech recognition) capabilities via sherpa-onnx WASM.
 * Supports both offline (Whisper) and online (streaming Zipformer) models.
 *
 * Uses the sherpa-onnx C struct packing helpers from sherpa-onnx-asr.js
 * to properly allocate config structs in WASM memory (NOT JSON strings).
 *
 * Mirrors: sdk/runanywhere-swift/Sources/RunAnywhere/Public/Extensions/STT/
 *
 * Usage:
 *   import { STT } from '@runanywhere/web';
 *
 *   // Load model files (downloaded separately)
 *   await STT.loadModel({
 *     modelId: 'whisper-tiny-en',
 *     type: 'whisper',
 *     modelFiles: {
 *       encoder: '/models/whisper-tiny-en/encoder.onnx',
 *       decoder: '/models/whisper-tiny-en/decoder.onnx',
 *       tokens: '/models/whisper-tiny-en/tokens.txt',
 *     },
 *   });
 *
 *   const result = await STT.transcribe(audioFloat32Array);
 *   console.log(result.text);
 */
import type { STTTranscriptionResult, STTTranscribeOptions, STTStreamingSession } from '@runanywhere/web';
import { STTModelType } from './STTTypes';
import type { STTModelConfig } from './STTTypes';
export { STTModelType } from './STTTypes';
export type { STTModelConfig, STTWhisperFiles, STTZipformerFiles, STTParaformerFiles } from './STTTypes';
declare class STTImpl {
    readonly extensionName = "STT";
    private _offlineRecognizerHandle;
    private _onlineRecognizerHandle;
    private _currentModelType;
    private _currentModelId;
    /** Returns the currently loaded STT model type. */
    get currentModelType(): STTModelType;
    /**
     * Load an STT model via sherpa-onnx.
     * Model files must already be written to sherpa-onnx virtual FS
     * (use SherpaONNXBridge.shared.downloadAndWrite() or .writeFile()).
     */
    loadModel(config: STTModelConfig): Promise<void>;
    /** Unload the STT model. */
    unloadModel(): Promise<void>;
    /** Check if an STT model is loaded. */
    get isModelLoaded(): boolean;
    /** Get the current model ID. */
    get modelId(): string;
    /**
     * Transcribe audio data (offline / non-streaming).
     *
     * @param audioSamples - Float32Array of PCM audio samples (mono, 16kHz)
     * @param options - Transcription options
     * @returns Transcription result
     */
    transcribe(audioSamples: Float32Array, options?: STTTranscribeOptions): Promise<STTTranscriptionResult>;
    /** Internal: Transcribe via online recognizer (for streaming models used non-streaming) */
    _transcribeViaOnline(audioSamples: Float32Array, options?: STTTranscribeOptions): Promise<STTTranscriptionResult>;
    /**
     * Create a streaming transcription session.
     * Returns an object to feed audio chunks and get results.
     */
    createStreamingSession(options?: STTTranscribeOptions): STTStreamingSession;
    /**
     * Transcribe an audio file (wav, mp3, m4a, ogg, flac, etc.).
     * Handles decoding and resampling to 16 kHz internally via AudioFileLoader.
     *
     * @param file    Audio file from a file picker, drag-drop, or any File source
     * @param options Optional transcription options (language, sampleRate override)
     */
    transcribeFile(file: File, options?: STTTranscribeOptions): Promise<STTTranscriptionResult>;
    /** Clean up the STT resources. */
    cleanup(): void;
}
export declare const STT: STTImpl;
/** Returns the currently loaded STT model type. */
export declare function getCurrentSTTModelType(): STTModelType;
//# sourceMappingURL=RunAnywhere+STT.d.ts.map