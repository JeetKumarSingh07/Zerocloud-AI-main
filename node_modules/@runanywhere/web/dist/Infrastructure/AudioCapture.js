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
import { SDKLogger } from '../Foundation/SDKLogger';
const logger = new SDKLogger('AudioCapture');
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
export class AudioCapture {
    audioContext = null;
    mediaStream = null;
    sourceNode = null;
    processorNode = null;
    _analyser = null;
    _animFrameId = null;
    _isCapturing = false;
    _currentLevel = 0;
    _pcmChunks = [];
    config;
    chunkCallback = null;
    levelCallback = null;
    constructor(config = {}) {
        this.config = {
            sampleRate: config.sampleRate ?? 16000,
            chunkSize: config.chunkSize ?? 1600,
            channels: config.channels ?? 1,
        };
    }
    get isCapturing() {
        return this._isCapturing;
    }
    /** Current normalized audio level (0..1), updated per animation frame. */
    get currentLevel() {
        return this._currentLevel;
    }
    /**
     * Get the actual sample rate of the audio context.
     * May differ from requested rate if browser doesn't support it.
     */
    get actualSampleRate() {
        return this.audioContext?.sampleRate ?? this.config.sampleRate;
    }
    /** Duration of collected audio in seconds based on configured sample rate. */
    get bufferDurationSeconds() {
        const samples = this._pcmChunks.reduce((acc, c) => acc + c.length, 0);
        return samples / this.config.sampleRate;
    }
    /**
     * Start capturing microphone audio.
     *
     * @param onChunk - Optional callback receiving Float32Array chunks of PCM audio (streaming)
     * @param onLevel - Optional callback invoked per animation frame with audio level 0..1
     * @throws If microphone permission is denied
     */
    async start(onChunk, onLevel) {
        if (this._isCapturing) {
            logger.debug('Already capturing');
            return;
        }
        this.chunkCallback = onChunk ?? null;
        this.levelCallback = onLevel ?? null;
        this._pcmChunks = [];
        this._currentLevel = 0;
        logger.info(`Starting audio capture (${this.config.sampleRate}Hz, chunk=${this.config.chunkSize})`);
        try {
            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: { ideal: this.config.sampleRate },
                    channelCount: { exact: this.config.channels },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            // Create AudioContext at target sample rate
            this.audioContext = new AudioContext({
                sampleRate: this.config.sampleRate,
            });
            // Connect microphone to AudioContext
            this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
            // --- AnalyserNode for level metering ---
            this._analyser = this.audioContext.createAnalyser();
            this._analyser.fftSize = 256;
            this.sourceNode.connect(this._analyser);
            // --- ScriptProcessorNode for chunk-based processing ---
            // Note: ScriptProcessorNode is deprecated but AudioWorklet requires
            // cross-origin isolation. We use ScriptProcessor as a fallback.
            const bufferSize = this.nearestPowerOf2(this.config.chunkSize);
            this.processorNode = this.audioContext.createScriptProcessor(bufferSize, this.config.channels, this.config.channels);
            this.processorNode.onaudioprocess = (event) => {
                if (!this._isCapturing)
                    return;
                const inputData = event.inputBuffer.getChannelData(0);
                // Copy to avoid buffer reuse issues
                const samples = new Float32Array(inputData.length);
                samples.set(inputData);
                // Accumulate into internal buffer
                this._pcmChunks.push(samples);
                // Notify chunk callback if provided
                this.chunkCallback?.(samples);
            };
            this.sourceNode.connect(this.processorNode);
            this.processorNode.connect(this.audioContext.destination);
            this._isCapturing = true;
            // Start level monitoring loop
            this.startLevelMonitoring();
            logger.info('Audio capture started');
        }
        catch (error) {
            this.cleanupResources();
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to start audio capture: ${message}`);
            throw new Error(`Microphone access failed: ${message}`);
        }
    }
    /**
     * Stop capturing audio and release resources.
     */
    stop() {
        if (!this._isCapturing)
            return;
        this._isCapturing = false;
        this._currentLevel = 0;
        this.chunkCallback = null;
        this.levelCallback = null;
        this.cleanupResources();
        logger.info('Audio capture stopped');
    }
    /**
     * Get all collected PCM audio as a single Float32Array.
     * Does NOT clear the buffer — call `clearBuffer()` separately.
     */
    getAudioBuffer() {
        if (this._pcmChunks.length === 0)
            return new Float32Array(0);
        const totalLength = this._pcmChunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of this._pcmChunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
        }
        return merged;
    }
    /**
     * Drain: return the current buffer and clear it for the next segment.
     * Useful for live mode where we transcribe segments incrementally.
     */
    drainBuffer() {
        const buffer = this.getAudioBuffer();
        this._pcmChunks = [];
        return buffer;
    }
    /** Clear collected PCM data without stopping capture. */
    clearBuffer() {
        this._pcmChunks = [];
    }
    /** Start the requestAnimationFrame loop that reads the AnalyserNode. */
    startLevelMonitoring() {
        const analyser = this._analyser;
        if (!analyser)
            return;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
            if (!this._isCapturing || !this._analyser)
                return;
            this._analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++)
                sum += dataArray[i];
            const avg = sum / dataArray.length / 255;
            this._currentLevel = avg;
            this.levelCallback?.(avg);
            this._animFrameId = requestAnimationFrame(tick);
        };
        this._animFrameId = requestAnimationFrame(tick);
    }
    cleanupResources() {
        if (this._animFrameId !== null) {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = null;
        }
        if (this.processorNode) {
            this.processorNode.disconnect();
            this.processorNode.onaudioprocess = null;
            this.processorNode = null;
        }
        if (this._analyser) {
            this._analyser.disconnect();
            this._analyser = null;
        }
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        if (this.audioContext) {
            this.audioContext.close().catch(() => { });
            this.audioContext = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
            this.mediaStream = null;
        }
    }
    nearestPowerOf2(n) {
        let power = 256;
        while (power < n && power < 16384) {
            power *= 2;
        }
        return power;
    }
}
//# sourceMappingURL=AudioCapture.js.map