/**
 * RunAnywhere Web SDK - Sherpa-ONNX WASM Bridge
 *
 * Loads the sherpa-onnx WASM module (separate from RACommons) and provides
 * typed access to the sherpa-onnx C API for:
 *   - STT (Speech-to-Text) via Whisper, Zipformer, Paraformer
 *   - TTS (Text-to-Speech) via Piper/VITS
 *   - VAD (Voice Activity Detection) via Silero
 *
 * Architecture:
 *   RACommons WASM handles LLM, VLM, Embeddings (llama.cpp)
 *   Sherpa-ONNX WASM handles STT, TTS, VAD (onnxruntime)
 *
 * The sherpa-onnx module is lazy-loaded on first use of STT/TTS/VAD.
 */
/**
 * Emscripten module interface for sherpa-onnx WASM.
 * Based on sherpa-onnx's wasm/nodejs C API exports.
 */
export interface SherpaONNXModule {
    ccall: (ident: string, returnType: string | null, argTypes: string[], args: unknown[]) => unknown;
    cwrap: (ident: string, returnType: string | null, argTypes: string[]) => (...args: unknown[]) => unknown;
    _malloc: (size: number) => number;
    _free: (ptr: number) => void;
    setValue: (ptr: number, value: number, type: string) => void;
    getValue: (ptr: number, type: string) => number;
    UTF8ToString: (ptr: number) => string;
    stringToUTF8: (str: string, ptr: number, maxLen: number) => void;
    lengthBytesUTF8: (str: string) => number;
    HEAPU8: Uint8Array;
    HEAP16: Int16Array;
    HEAP32: Int32Array;
    HEAPF32: Float32Array;
    HEAPF64: Float64Array;
    FS: SherpaFS;
    _SherpaOnnxCreateOfflineRecognizer: (configPtr: number) => number;
    _SherpaOnnxDestroyOfflineRecognizer: (handle: number) => void;
    _SherpaOnnxCreateOfflineStream: (handle: number) => number;
    _SherpaOnnxDestroyOfflineStream: (stream: number) => void;
    _SherpaOnnxAcceptWaveformOffline: (stream: number, sampleRate: number, samplesPtr: number, numSamples: number) => void;
    _SherpaOnnxDecodeOfflineStream: (handle: number, stream: number) => void;
    _SherpaOnnxGetOfflineStreamResultAsJson: (stream: number) => number;
    _SherpaOnnxDestroyOfflineStreamResultJson: (ptr: number) => void;
    _SherpaOnnxCreateOnlineRecognizer: (configPtr: number) => number;
    _SherpaOnnxDestroyOnlineRecognizer: (handle: number) => void;
    _SherpaOnnxCreateOnlineStream: (handle: number) => number;
    _SherpaOnnxDestroyOnlineStream: (stream: number) => void;
    _SherpaOnnxOnlineStreamAcceptWaveform: (stream: number, sampleRate: number, samplesPtr: number, numSamples: number) => void;
    _SherpaOnnxIsOnlineStreamReady: (handle: number, stream: number) => number;
    _SherpaOnnxDecodeOnlineStream: (handle: number, stream: number) => void;
    _SherpaOnnxGetOnlineStreamResultAsJson: (handle: number, stream: number) => number;
    _SherpaOnnxDestroyOnlineStreamResultJson: (ptr: number) => void;
    _SherpaOnnxOnlineStreamInputFinished: (stream: number) => void;
    _SherpaOnnxOnlineStreamIsEndpoint: (handle: number, stream: number) => number;
    _SherpaOnnxOnlineStreamReset: (handle: number, stream: number) => void;
    _SherpaOnnxCreateOfflineTts: (configPtr: number) => number;
    _SherpaOnnxDestroyOfflineTts: (handle: number) => void;
    _SherpaOnnxOfflineTtsGenerate: (handle: number, textPtr: number, sid: number, speed: number) => number;
    _SherpaOnnxDestroyOfflineTtsGeneratedAudio: (audio: number) => void;
    _SherpaOnnxOfflineTtsSampleRate: (handle: number) => number;
    _SherpaOnnxOfflineTtsNumSpeakers: (handle: number) => number;
    _SherpaOnnxCreateVoiceActivityDetector: (configPtr: number, bufferSizeInSeconds: number) => number;
    _SherpaOnnxDestroyVoiceActivityDetector: (handle: number) => void;
    _SherpaOnnxVoiceActivityDetectorAcceptWaveform: (handle: number, samplesPtr: number, numSamples: number) => void;
    _SherpaOnnxVoiceActivityDetectorEmpty: (handle: number) => number;
    _SherpaOnnxVoiceActivityDetectorDetected: (handle: number) => number;
    _SherpaOnnxVoiceActivityDetectorPop: (handle: number) => void;
    _SherpaOnnxVoiceActivityDetectorFront: (handle: number) => number;
    _SherpaOnnxDestroySpeechSegment: (segment: number) => void;
    _SherpaOnnxVoiceActivityDetectorReset: (handle: number) => void;
    _SherpaOnnxVoiceActivityDetectorFlush: (handle: number) => void;
    _CopyHeap?: (srcPtr: number, numBytes: number, dstPtr: number) => void;
}
interface SherpaFS {
    mkdir: (path: string) => void;
    writeFile: (path: string, data: Uint8Array | string) => void;
    readFile: (path: string) => Uint8Array;
    unlink: (path: string) => void;
    analyzePath: (path: string) => {
        exists: boolean;
    };
}
/**
 * SherpaONNXBridge - Loads and manages the sherpa-onnx WASM module.
 *
 * Singleton that provides access to sherpa-onnx C API functions.
 * Lazy-loaded: only initializes when STT/TTS/VAD is first used.
 */
export declare class SherpaONNXBridge {
    private static _instance;
    private _module;
    private _loaded;
    private _loading;
    /**
     * Override the default URL to the sherpa-onnx-glue.js file.
     * Set this before any STT/TTS/VAD model is loaded.
     *
     * In a Vite app, resolve it like:
     * ```typescript
     * SherpaONNXBridge.shared.wasmUrl = new URL(
     *   '@runanywhere/web-onnx/wasm/sherpa/sherpa-onnx-glue.js',
     *   import.meta.url,
     * ).href;
     * ```
     */
    wasmUrl: string | null;
    /**
     * Override the base URL for sherpa-onnx helper files (sherpa-onnx-asr.js,
     * sherpa-onnx-tts.js, sherpa-onnx-vad.js).
     *
     * When `null` (default), this is auto-derived from `wasmUrl` after the
     * glue JS loads successfully. Set explicitly only if helper files are
     * served from a different location than the glue JS.
     *
     * Must end with a trailing `/`.
     */
    helperBaseUrl: string | null;
    static get shared(): SherpaONNXBridge;
    get isLoaded(): boolean;
    get module(): SherpaONNXModule;
    /**
     * Ensure the sherpa-onnx WASM module is loaded.
     * Safe to call multiple times -- will only load once.
     *
     * @param wasmUrl - URL/path to the sherpa-onnx glue JS file.
     *                  Defaults to wasm/sherpa/sherpa-onnx-glue.js
     */
    ensureLoaded(wasmUrl?: string): Promise<void>;
    private _doLoad;
    /**
     * Get the Emscripten FS object from the module.
     * Handles both direct FS property and module-level helper functions.
     */
    private getFS;
    /**
     * Ensure a directory exists in the sherpa-onnx Emscripten virtual FS.
     */
    ensureDir(path: string): void;
    /**
     * Write a file into the sherpa-onnx Emscripten virtual FS.
     * Used to stage model files before loading.
     *
     * Prefers FS_createDataFile over FS.writeFile for reliability —
     * the module was compiled with NODERAWFS which can leave FS.writeFile
     * in a broken state even after our browser patches.
     */
    writeFile(path: string, data: Uint8Array): void;
    /**
     * Download a file from a URL and write it to the sherpa-onnx FS.
     */
    downloadAndWrite(url: string, fsPath: string, onProgress?: (loaded: number, total: number) => void): Promise<void>;
    allocString(str: string): number;
    readString(ptr: number): string;
    free(ptr: number): void;
    shutdown(): void;
}
export {};
//# sourceMappingURL=SherpaONNXBridge.d.ts.map