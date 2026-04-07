/**
 * AudioFileLoader
 *
 * Decodes a browser audio File/Blob into a mono Float32Array PCM buffer
 * suitable for on-device STT transcription.
 *
 * Centralizing this conversion in the SDK means host applications only
 * need to pass a File — the resampling, channel-mixing, and Web Audio
 * setup are all handled here.
 *
 * Supported input formats: anything the browser's AudioContext can decode
 * (wav, mp3, m4a, ogg, flac, aac, opus, webm, etc.)
 */
export interface AudioFileLoaderResult {
    /** Mono PCM samples, resampled to targetSampleRate */
    samples: Float32Array;
    /** Sample rate of the returned buffer (matches targetSampleRate) */
    sampleRate: number;
    /** Original file duration in seconds */
    durationSeconds: number;
}
export declare class AudioFileLoader {
    /**
     * Decode an audio File to a mono Float32Array PCM buffer.
     * Resamples to targetSampleRate if the file's native rate differs.
     *
     * @param file            Any browser-supported audio file
     * @param targetSampleRate Output sample rate (default: 16000 Hz for STT models)
     */
    static toFloat32Array(file: File, targetSampleRate?: number): Promise<AudioFileLoaderResult>;
}
//# sourceMappingURL=AudioFileLoader.d.ts.map