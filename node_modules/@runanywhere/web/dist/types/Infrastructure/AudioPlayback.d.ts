/**
 * RunAnywhere Web SDK - Audio Playback
 *
 * Plays synthesized audio (TTS output) using Web Audio API.
 * Accepts Float32Array PCM samples and plays them through
 * the browser's audio output.
 *
 * Supports:
 *   - One-shot playback of PCM audio buffers
 *   - Streaming playback (queued chunks)
 *   - Playback controls (stop, pause, resume)
 *   - Completion callbacks
 */
export type PlaybackCompleteCallback = () => void;
export interface PlaybackConfig {
    /** Sample rate of the audio (default: 22050 for Piper TTS) */
    sampleRate?: number;
    /** Volume (0.0 - 1.0, default: 1.0) */
    volume?: number;
}
/**
 * AudioPlayback - Plays synthesized audio through browser speakers.
 */
export declare class AudioPlayback {
    private audioContext;
    private gainNode;
    private currentSource;
    private _isPlaying;
    private config;
    constructor(config?: PlaybackConfig);
    get isPlaying(): boolean;
    /**
     * Play a Float32Array of PCM audio samples.
     *
     * @param samples - PCM audio data (Float32Array)
     * @param sampleRate - Sample rate (overrides config)
     * @returns Promise that resolves when playback completes
     */
    play(samples: Float32Array, sampleRate?: number): Promise<void>;
    /**
     * Stop playback immediately.
     */
    stop(): void;
    /**
     * Set playback volume.
     */
    setVolume(volume: number): void;
    /**
     * Release all audio resources.
     */
    dispose(): void;
}
//# sourceMappingURL=AudioPlayback.d.ts.map