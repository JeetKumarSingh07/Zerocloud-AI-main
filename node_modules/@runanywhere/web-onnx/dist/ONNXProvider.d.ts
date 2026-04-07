/**
 * ONNXProvider - Backend registration for @runanywhere/web-onnx
 *
 * Registers the sherpa-onnx backend with the RunAnywhere core SDK.
 * Provides STT (speech-to-text), TTS (text-to-speech), and VAD
 * (voice activity detection) capabilities.
 *
 * The provider also implements the model loader interfaces, handling
 * all sherpa-onnx FS operations (writing model files, extracting
 * archives) that were previously in ModelManager.
 */
export declare const ONNXProvider: {
    readonly isRegistered: boolean;
    /**
     * Register the sherpa-onnx backend with the RunAnywhere SDK.
     *
     * This:
     * 1. Registers STT/TTS/VAD model loaders with ModelManager
     * 2. Registers extension singletons with ExtensionRegistry
     * 3. Registers this backend with ExtensionPoint
     *
     * Note: SherpaONNXBridge is lazy-loaded on first model load,
     * not during registration.
     */
    register(): Promise<void>;
    unregister(): void;
};
//# sourceMappingURL=ONNXProvider.d.ts.map