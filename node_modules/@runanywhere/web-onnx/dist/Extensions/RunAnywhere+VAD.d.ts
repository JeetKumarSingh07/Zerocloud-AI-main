/**
 * RunAnywhere Web SDK - Voice Activity Detection Extension
 *
 * Adds VAD capabilities via sherpa-onnx WASM using Silero VAD model.
 * Detects speech segments in audio streams with high accuracy.
 *
 * Mirrors: sdk/runanywhere-swift/Sources/RunAnywhere/Public/Extensions/VAD/
 *
 * Usage:
 *   import { VAD } from '@runanywhere/web';
 *
 *   await VAD.loadModel({
 *     modelPath: '/models/vad/silero_vad.onnx',
 *     threshold: 0.5,
 *   });
 *
 *   const hasVoice = VAD.processSamples(audioFloat32Array);
 *   if (hasVoice) console.log('Speech detected!');
 */
import type { SpeechActivityCallback, VADModelConfig, SpeechSegment } from './VADTypes';
export type { VADModelConfig } from './VADTypes';
declare class VADImpl {
    readonly extensionName = "VAD";
    private _vadHandle;
    private _sampleRate;
    private _jsActivityCallback;
    private _lastSpeechState;
    private _speechStartMs;
    /**
     * Load the Silero VAD model via sherpa-onnx.
     * The model file must already be in the sherpa-onnx virtual FS.
     */
    loadModel(config: VADModelConfig): Promise<void>;
    /** Whether VAD model is loaded. */
    get isInitialized(): boolean;
    /**
     * Register a callback for speech activity events.
     * Called when speech starts, ends, or is ongoing.
     */
    onSpeechActivity(callback: SpeechActivityCallback): () => void;
    /**
     * Process audio samples through VAD.
     * Returns whether speech was detected in this frame.
     *
     * The Silero VAD expects 512-sample windows at 16kHz.
     * This method handles arbitrary-length input by feeding in chunks.
     *
     * @param samples - Float32Array of PCM audio samples (mono, 16kHz)
     * @returns Whether speech is currently detected
     */
    processSamples(samples: Float32Array): boolean;
    /**
     * Get the next available speech segment (if any).
     * Returns null if no complete segments are available.
     *
     * After calling processSamples(), check for available segments
     * using this method. Call repeatedly until it returns null.
     */
    popSpeechSegment(): SpeechSegment | null;
    /** Whether speech is currently detected. */
    get isSpeechActive(): boolean;
    /** Reset VAD state. */
    reset(): void;
    /** Flush remaining audio through VAD. */
    flush(): void;
    /** Clean up the VAD resources. */
    cleanup(): void;
}
export declare const VAD: VADImpl;
//# sourceMappingURL=RunAnywhere+VAD.d.ts.map