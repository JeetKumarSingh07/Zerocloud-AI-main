/**
 * ONNX - Module facade for @runanywhere/web-onnx
 *
 * Provides a high-level API matching the React Native SDK's module pattern.
 *
 * Usage:
 *   import { ONNX } from '@runanywhere/web-onnx';
 *
 *   await ONNX.register();
 */
/** Options for `ONNX.register()`. */
export interface ONNXRegisterOptions {
    /** Override URL to the sherpa-onnx-glue.js glue file. */
    wasmUrl?: string;
    /**
     * Override base URL for sherpa-onnx helper files (sherpa-onnx-asr.js, -tts.js, -vad.js).
     * Must end with a trailing `/`.
     */
    helperBaseUrl?: string;
}
export declare const ONNX: {
    readonly moduleId: string;
    readonly isRegistered: boolean;
    /**
     * Register the sherpa-onnx backend.
     * Call after `RunAnywhere.initialize()`.
     *
     * @param options - Optional WASM URL overrides.
     *                  Use `wasmUrl` / `helperBaseUrl` when the default
     *                  `import.meta.url`-based resolution doesn't work (e.g. bundled apps).
     */
    register(options?: ONNXRegisterOptions): Promise<void>;
    unregister(): void;
};
export declare function autoRegister(): void;
//# sourceMappingURL=ONNX.d.ts.map