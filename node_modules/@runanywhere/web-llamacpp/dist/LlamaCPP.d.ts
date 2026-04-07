/**
 * LlamaCPP - Module facade for @runanywhere/web-llamacpp
 *
 * Provides a high-level API matching the React Native SDK's module pattern.
 *
 * Usage:
 *   import { LlamaCPP } from '@runanywhere/web-llamacpp';
 *
 *   await LlamaCPP.register();
 *   LlamaCPP.addModel({ id: 'my-model', name: 'My Model', url: '...' });
 */
/** Options for `LlamaCPP.register()`. */
export interface LlamaCPPRegisterOptions {
    /** Override URL to the racommons-llamacpp.js glue file (CPU variant). */
    wasmUrl?: string;
    /** Override URL to the racommons-llamacpp-webgpu.js glue file. */
    webgpuWasmUrl?: string;
    /** Hardware acceleration strategy (default: 'auto'). */
    acceleration?: 'auto' | 'webgpu' | 'cpu';
}
export declare const LlamaCPP: {
    /** Unique module identifier. */
    readonly moduleId: string;
    /** Whether the backend is registered. */
    readonly isRegistered: boolean;
    /** Current hardware acceleration mode ('cpu' | 'webgpu'). Available after register(). */
    readonly accelerationMode: string;
    /**
     * Register the llama.cpp backend.
     * Call after `RunAnywhere.initialize()`.
     *
     * @param options - Optional WASM URL overrides and acceleration preference.
     *                  Use `wasmUrl` / `webgpuWasmUrl` when the default
     *                  `import.meta.url`-based resolution doesn't work (e.g. bundled apps).
     */
    register(options?: LlamaCPPRegisterOptions): Promise<void>;
    /**
     * Unregister the backend and clean up.
     */
    unregister(): void;
};
/**
 * Auto-register the llama.cpp backend.
 * Usage:
 *   import { autoRegister } from '@runanywhere/web-llamacpp';
 *   autoRegister();
 */
export declare function autoRegister(): void;
//# sourceMappingURL=LlamaCPP.d.ts.map