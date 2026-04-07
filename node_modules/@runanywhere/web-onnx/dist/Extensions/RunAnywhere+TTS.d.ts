/**
 * RunAnywhere Web SDK - Text-to-Speech Extension
 *
 * Adds TTS (speech synthesis) capabilities via sherpa-onnx WASM.
 * Uses Piper/VITS ONNX models for offline, on-device speech synthesis.
 *
 * Mirrors: sdk/runanywhere-swift/Sources/RunAnywhere/Public/Extensions/TTS/
 *
 * Usage:
 *   import { TTS } from '@runanywhere/web';
 *
 *   await TTS.loadVoice({
 *     voiceId: 'piper-en-amy',
 *     modelPath: '/models/tts/model.onnx',
 *     tokensPath: '/models/tts/tokens.txt',
 *     dataDir: '/models/tts/espeak-ng-data',
 *   });
 *
 *   const result = await TTS.synthesize('Hello world');
 *   // result.audioData is Float32Array of PCM samples
 */
import type { TTSVoiceConfig, TTSSynthesisResult, TTSSynthesizeOptions } from './TTSTypes';
export type { TTSVoiceConfig } from './TTSTypes';
declare class TTSImpl {
    readonly extensionName = "TTS";
    private _ttsHandle;
    private _currentVoiceId;
    /**
     * Load a TTS voice model via sherpa-onnx.
     * Model files must already be written to sherpa-onnx virtual FS.
     */
    loadVoice(config: TTSVoiceConfig): Promise<void>;
    /** Unload the TTS voice. */
    unloadVoice(): Promise<void>;
    /** Check if a TTS voice is loaded. */
    get isVoiceLoaded(): boolean;
    /** Get current voice ID. */
    get voiceId(): string;
    /** Get the sample rate of the loaded TTS model. */
    get sampleRate(): number;
    /** Get the number of speakers in the loaded model. */
    get numSpeakers(): number;
    /**
     * Synthesize speech from text.
     *
     * @param text - Text to synthesize
     * @param options - Synthesis options (speaker ID, speed)
     * @returns Synthesis result with PCM audio data
     */
    synthesize(text: string, options?: TTSSynthesizeOptions): Promise<TTSSynthesisResult>;
    /** Clean up the TTS resources. */
    cleanup(): void;
}
export declare const TTS: TTSImpl;
//# sourceMappingURL=RunAnywhere+TTS.d.ts.map