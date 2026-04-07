/**
 * LlamaCppProvider - Backend registration for @runanywhere/web-llamacpp
 *
 * Registers the llama.cpp backend with the RunAnywhere core SDK.
 * Follows the React Native SDK's Provider pattern.
 *
 * Usage:
 *   import { LlamaCppProvider } from '@runanywhere/web-llamacpp';
 *   await LlamaCppProvider.register();
 */
export declare const LlamaCppProvider: {
    /** Whether the backend is currently registered. */
    readonly isRegistered: boolean;
    /**
     * Register the llama.cpp backend with the RunAnywhere SDK.
     *
     * This:
     * 1. Ensures LlamaCppBridge WASM is loaded (which registers the C++ backend)
     * 2. Loads llama.cpp-specific struct offsets
     * 3. Registers LLM model loader with ModelManager
     * 4. Registers all extension singletons with ExtensionRegistry
     * 5. Registers this backend with ExtensionPoint
     *
     * @param acceleration - Hardware acceleration strategy (default: 'auto').
     */
    register(acceleration?: "auto" | "webgpu" | "cpu"): Promise<void>;
    /**
     * Unregister the backend and clean up resources.
     */
    unregister(): void;
};
//# sourceMappingURL=LlamaCppProvider.d.ts.map