/**
 * LlamaCppBridge - Independent WASM module bridge for the llama.cpp backend
 *
 * Loads racommons-llamacpp.wasm (which contains rac_commons + llama.cpp)
 * as a fully independent WASM module with its own Emscripten runtime,
 * linear memory, and virtual filesystem.
 *
 * Follows the same pattern as SherpaONNXBridge in @runanywhere/web-onnx:
 *   - Singleton with lazy loading
 *   - Dynamic import of glue JS + fetch of .wasm binary
 *   - Async WebAssembly.instantiate
 *   - Own MEMFS for model files
 *   - Platform adapter registration
 *   - rac_init() + backend registration
 *
 * This module is completely independent from any core WASM — the core
 * package (@runanywhere/web) is pure TypeScript.
 */
import type { AccelerationMode } from '@runanywhere/web';
import './PlatformAdapter';
/**
 * Emscripten module interface for the racommons-llamacpp WASM.
 * Contains both core RACommons functions and llama.cpp backend functions.
 */
export interface LlamaCppModule {
    ccall: (ident: string, returnType: string | null, argTypes: string[], args: unknown[], opts?: object) => unknown;
    cwrap: (ident: string, returnType: string | null, argTypes: string[]) => (...args: unknown[]) => unknown;
    addFunction: (func: (...args: number[]) => number | void, signature: string) => number;
    removeFunction: (ptr: number) => void;
    _malloc: (size: number) => number;
    _free: (ptr: number) => void;
    setValue: (ptr: number, value: number, type: string) => void;
    getValue: (ptr: number, type: string) => number;
    UTF8ToString: (ptr: number, maxBytesToRead?: number) => string;
    stringToUTF8: (str: string, outPtr: number, maxBytesToWrite: number) => void;
    lengthBytesUTF8: (str: string) => number;
    HEAPU8?: Uint8Array;
    HEAPF32?: Float32Array;
    _rac_init: (configPtr: number) => number;
    _rac_shutdown: () => void;
    _rac_wasm_ping: () => number;
    _rac_wasm_sizeof_platform_adapter: () => number;
    _rac_wasm_sizeof_config: () => number;
    _rac_set_platform_adapter: (adapterPtr: number) => number;
    _rac_error_message: (code: number) => number;
    _rac_backend_llamacpp_register?: () => number;
    _rac_backend_llamacpp_vlm_register?: () => number;
    _rac_llm_component_create: (outHandlePtr: number) => number;
    _rac_llm_component_load_model: (handle: number, pathPtr: number, idPtr: number, namePtr: number) => number;
    _rac_llm_component_unload: (handle: number) => number;
    _rac_llm_component_generate: (handle: number, promptPtr: number, optionsPtr: number, outResultPtr: number) => number;
    _rac_llm_component_generate_stream: (handle: number, promptPtr: number, optionsPtr: number, tokenCb: number, completeCb: number, errorCb: number, userData: number) => number;
    _rac_llm_component_cancel: (handle: number) => number;
    _rac_llm_component_destroy: (handle: number) => void;
    _rac_llm_component_is_loaded: (handle: number) => number;
    _rac_llm_component_get_model_id: (handle: number) => number;
    _rac_llm_result_free: (resultPtr: number) => void;
    _rac_vlm_component_create?: (outHandlePtr: number) => number;
    _rac_vlm_component_load_model?: (handle: number, modelPath: number, mmprojPath: number, modelId: number, modelName: number) => number;
    _rac_vlm_component_process?: (handle: number, imagePtr: number, promptPtr: number, optionsPtr: number, resultPtr: number) => number;
    _rac_vlm_component_destroy?: (handle: number) => void;
    _rac_vlm_component_cancel?: (handle: number) => void;
    _rac_vlm_result_free?: (resultPtr: number) => void;
    _rac_wasm_sizeof_llm_options: () => number;
    _rac_wasm_sizeof_llm_result: () => number;
    _rac_wasm_sizeof_vlm_image: () => number;
    _rac_wasm_sizeof_vlm_options: () => number;
    _rac_wasm_sizeof_vlm_result: () => number;
    _rac_wasm_sizeof_structured_output_config: () => number;
    _rac_wasm_sizeof_embeddings_options: () => number;
    _rac_wasm_sizeof_embeddings_result: () => number;
    _rac_wasm_sizeof_diffusion_options: () => number;
    _rac_wasm_sizeof_diffusion_result: () => number;
    _rac_wasm_create_llm_options_default: () => number;
    _rac_structured_output_prepare_prompt?: (promptPtr: number, schemaPtr: number) => number;
    _rac_structured_output_validate?: (textPtr: number, schemaPtr: number) => number;
    _rac_embeddings_component_create?: (outHandlePtr: number) => number;
    _rac_diffusion_component_create?: (outHandlePtr: number) => number;
    _rac_tool_call_parse?: (textPtr: number, outResultPtr: number) => number;
    _rac_telemetry_manager_create?: (env: number, deviceIdPtr: number, platformPtr: number, sdkVersionPtr: number) => number;
    _rac_telemetry_manager_destroy?: (handle: number) => void;
    _rac_telemetry_manager_set_device_info?: (handle: number, modelPtr: number, osVersionPtr: number) => void;
    _rac_telemetry_manager_set_http_callback?: (handle: number, callbackPtr: number, userData: number) => void;
    _rac_telemetry_manager_track_analytics?: (handle: number, eventType: number, dataPtr: number) => number;
    _rac_telemetry_manager_flush?: (handle: number) => number;
    _rac_telemetry_manager_http_complete?: (handle: number, success: number, responsePtr: number, errorPtr: number) => void;
    _rac_analytics_events_set_callback?: (callbackPtr: number, userData: number) => number;
    _rac_analytics_events_has_callback?: () => number;
    _rac_analytics_emit_stt_model_load_completed?: (modelIdPtr: number, modelNamePtr: number, durationMs: number, framework: number) => void;
    _rac_analytics_emit_stt_model_load_failed?: (modelIdPtr: number, errorCode: number, errorMsgPtr: number) => void;
    _rac_analytics_emit_stt_transcription_completed?: (transcriptionIdPtr: number, modelIdPtr: number, textPtr: number, confidence: number, durationMs: number, audioLengthMs: number, audioSizeBytes: number, wordCount: number, realTimeFactor: number, languagePtr: number, sampleRate: number, framework: number) => void;
    _rac_analytics_emit_stt_transcription_failed?: (transcriptionIdPtr: number, modelIdPtr: number, errorCode: number, errorMsgPtr: number) => void;
    _rac_analytics_emit_tts_voice_load_completed?: (modelIdPtr: number, modelNamePtr: number, durationMs: number, framework: number) => void;
    _rac_analytics_emit_tts_voice_load_failed?: (modelIdPtr: number, errorCode: number, errorMsgPtr: number) => void;
    _rac_analytics_emit_tts_synthesis_completed?: (synthesisIdPtr: number, modelIdPtr: number, characterCount: number, audioDurationMs: number, audioSizeBytes: number, processingDurationMs: number, charactersPerSecond: number, sampleRate: number, framework: number) => void;
    _rac_analytics_emit_tts_synthesis_failed?: (synthesisIdPtr: number, modelIdPtr: number, errorCode: number, errorMsgPtr: number) => void;
    _rac_analytics_emit_vad_speech_started?: () => void;
    _rac_analytics_emit_vad_speech_ended?: (speechDurationMs: number, energyLevel: number) => void;
    _rac_analytics_emit_model_download_started?: (modelIdPtr: number) => void;
    _rac_analytics_emit_model_download_completed?: (modelIdPtr: number, fileSizeBytes: number, durationMs: number) => void;
    _rac_analytics_emit_model_download_failed?: (modelIdPtr: number, errorMsgPtr: number) => void;
    _rac_wasm_dev_config_is_available?: () => number;
    _rac_wasm_dev_config_get_supabase_url?: () => number;
    _rac_wasm_dev_config_get_supabase_key?: () => number;
    _rac_wasm_dev_config_get_build_token?: () => number;
    FS_createPath?: (parent: string, path: string, canRead: boolean, canWrite: boolean) => void;
    FS_createDataFile?: (parent: string, name: string, data: Uint8Array, canRead: boolean, canWrite: boolean, canOwn: boolean) => void;
    FS_unlink?: (path: string) => void;
    FS_mkdir?: (path: string) => void;
    FS_rmdir?: (path: string) => void;
    FS_mount?: (type: any, opts: any, mountpoint: string) => void;
    FS_unmount?: (mountpoint: string) => void;
    WORKERFS?: any;
    [key: string]: unknown;
}
export declare class LlamaCppBridge {
    private static _instance;
    private static _nextMountId;
    private _module;
    private _loaded;
    private _loading;
    private _accelerationMode;
    private _platformAdapter;
    private _analyticsEventsBridge;
    private _telemetryService;
    /** Override the default URL to the racommons-llamacpp.js glue file. */
    wasmUrl: string | null;
    /** Override the URL for the WebGPU variant. */
    webgpuWasmUrl: string | null;
    static get shared(): LlamaCppBridge;
    get isLoaded(): boolean;
    get module(): LlamaCppModule;
    get accelerationMode(): AccelerationMode;
    ensureLoaded(acceleration?: 'auto' | 'webgpu' | 'cpu'): Promise<void>;
    private _doLoad;
    private initRACommons;
    private registerBackend;
    /**
     * Write a model file to this WASM module's Emscripten virtual filesystem.
     */
    writeFile(path: string, data: Uint8Array): void;
    /**
     * Write a model from a ReadableStream to this WASM module's Emscripten virtual filesystem.
     * Useful for loading models without buffering the entire file in JS memory.
     */
    writeFileStream(path: string, stream: ReadableStream<Uint8Array>): Promise<void>;
    /**
     * Remove a file from this WASM module's filesystem.
     */
    unlinkFile(path: string): void;
    /**
     * Mount a File object into the WASM filesystem (if WORKERFS is available).
     * Returns the path to the mounted file, or null if mounting failed/unsupported.
     *
     * @param file - The browser File object
     * @returns The absolute path to the file in WASM FS (e.g. /mnt-123/model.gguf) or null
     */
    mountFile(file: File): string | null;
    /**
     * Unmount a directory (and remove it).
     * @param mountDir - The directory path (e.g. /mnt-123)
     */
    unmount(mountPath: string): void;
    private detectWebGPUWithJSPI;
    allocString(str: string): number;
    readString(ptr: number): string;
    free(ptr: number): void;
    writeBytes(src: Uint8Array, destPtr: number): void;
    readBytes(srcPtr: number, length: number): Uint8Array;
    readFloat32Array(srcPtr: number, count: number): Float32Array;
    writeFloat32Array(src: Float32Array, destPtr: number): void;
    readFloat32(ptr: number): number;
    checkResult(result: number, operation: string): void;
    getErrorMessage(resultCode: number): string;
    callFunction<T = number>(funcName: string, returnType: string | null, argTypes: string[], args: unknown[], opts?: {
        async?: boolean;
    }): T;
    wasmOffsetOf(name: string): number;
    wasmSizeOf(name: string): number;
    shutdown(): void;
}
//# sourceMappingURL=LlamaCppBridge.d.ts.map