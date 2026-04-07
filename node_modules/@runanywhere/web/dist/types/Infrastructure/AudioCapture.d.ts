/**
 * RunAnywhere Web SDK - Audio Capture
 *
 * Captures microphone audio using Web Audio API and provides
 * Float32Array PCM samples suitable for STT and VAD processing.
 *
 * Supports:
 *   - Real-time microphone capture via getUserMedia
 *   - Configurable sample rate (resampling via AudioContext)
 *   - Chunk-based callbacks for streaming STT/VAD
 *   - Buffer accumulation (getAudioBuffer, drainBuffer, clearBuffer)
 *   - Audio level monitoring via AnalyserNode (currentLevel getter)
 */
export type AudioChunkCallback = (samples: Float32Array) => void;
export type AudioLevelCallback = (level: number) => void;
export interface AudioCaptureConfig {
    /** Target sample rate (default: 16000 for STT) */
    sampleRate?: number;
    /** Chunk size in samples (default: 1600 = 100ms at 16kHz) */
    chunkSize?: number;
    /** Number of audio channels (default: 1, mono) */
    channels?: number;
}
/**
 * AudioCapture - Captures microphone audio for STT/VAD processing.
 *
 * Uses Web Audio API (AudioContext + ScriptProcessorNode) to capture
 * microphone audio, resample to target rate, and deliver Float32Array
 * PCM chunks to the consumer.
 *
 * Includes buffer accumulation for batch STT and an AnalyserNode for
 * real-time audio level metering (0-1 range).
 */
export declare class AudioCapture {
    private audioContext;
    private mediaStream;
    private sourceNode;
    private processorNode;
    private _analyser;
    private _animFrameId;
    private _isCapturing;
    private _currentLevel;
    private _pcmChunks;
    private readonly config;
    private chunkCallback;
    private levelCallback;
    constructor(config?: AudioCaptureConfig);
    get isCapturing(): boolean;
    /** Current normalized audio level (0..1), updated per animation frame. */
    get currentLevel(): number;
    /**
     * Get the actual sample rate of the audio context.
     * May differ from requested rate if browser doesn't support it.
     */
    get actualSampleRate(): number;
    /** Duration of collected audio in seconds based on configured sample rate. */
    get bufferDurationSeconds(): number;
    /**
     * Start capturing microphone audio.
     *
     * @param onChunk - Optional callback receiving Float32Array chunks of PCM audio (streaming)
     * @param onLevel - Optional callback invoked per animation frame with audio level 0..1
     * @throws If microphone permission is denied
     */
    start(onChunk?: AudioChunkCallback, onLevel?: AudioLevelCallback): Promise<void>;
    /**
     * Stop capturing audio and release resources.
     */
    stop(): void;
    /**
     * Get all collected PCM audio as a single Float32Array.
     * Does NOT clear the buffer — call `clearBuffer()` separately.
     */
    getAudioBuffer(): Float32Array;
    /**
     * Drain: return the current buffer and clear it for the next segment.
     * Useful for live mode where we transcribe segments incrementally.
     */
    drainBuffer(): Float32Array;
    /** Clear collected PCM data without stopping capture. */
    clearBuffer(): void;
    /** Start the requestAnimationFrame loop that reads the AnalyserNode. */
    private startLevelMonitoring;
    private cleanupResources;
    private nearestPowerOf2;
}
//# sourceMappingURL=AudioCapture.d.ts.map