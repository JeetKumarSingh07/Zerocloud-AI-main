/**
 * ExtensionPoint - Backend registration API
 *
 * Follows the React Native SDK's Provider pattern. Backend packages
 * (e.g. @runanywhere/web-llamacpp, @runanywhere/web-onnx) register
 * themselves with the core SDK via this API, declaring what capabilities
 * they provide.
 *
 * Usage:
 *   // In @runanywhere/web-llamacpp:
 *   import { ExtensionPoint, BackendCapability } from '@runanywhere/web';
 *
 *   ExtensionPoint.registerBackend({
 *     id: 'llamacpp',
 *     capabilities: [BackendCapability.LLM, BackendCapability.VLM, ...],
 *     cleanup() { ... },
 *   });
 *
 *   // In core (VoicePipeline, etc.) — runtime lookup:
 *   const stt = ExtensionPoint.getExtensionForCapability(BackendCapability.STT);
 */
import type { ProviderCapability, ProviderMap } from './ProviderTypes';
/** Capabilities that a backend can provide. */
export declare enum BackendCapability {
    LLM = "llm",
    VLM = "vlm",
    STT = "stt",
    TTS = "tts",
    VAD = "vad",
    Embeddings = "embeddings",
    Diffusion = "diffusion",
    ToolCalling = "toolCalling",
    StructuredOutput = "structuredOutput"
}
/**
 * Typed service keys for cross-package singleton access.
 *
 * Backend packages register service instances (e.g. TextGeneration, STT, TTS)
 * under these keys during their registration phase. Core code (e.g. VoicePipeline)
 * retrieves them at runtime via `ExtensionPoint.getService(ServiceKey.XXX)` instead
 * of relying on untyped globalThis keys.
 */
export declare enum ServiceKey {
    TextGeneration = "textGeneration",
    STT = "stt",
    TTS = "tts",
    VLM = "vlm",
    Embeddings = "embeddings",
    Diffusion = "diffusion",
    ToolCalling = "toolCalling",
    VAD = "vad"
}
/**
 * Interface that every backend package must implement to register
 * itself with the core SDK.
 */
export interface BackendExtension {
    /** Unique backend identifier (e.g. 'llamacpp', 'onnx'). */
    readonly id: string;
    /** Capabilities this backend provides. */
    readonly capabilities: BackendCapability[];
    /**
     * Release all resources held by this backend.
     * Called during SDK shutdown in reverse registration order.
     */
    cleanup(): void;
}
declare class ExtensionPointImpl {
    private backends;
    private capabilityMap;
    private services;
    /**
     * Register a backend extension.
     * Idempotent — re-registering the same id is a no-op.
     */
    registerBackend(extension: BackendExtension): void;
    /** Get a backend by its id. */
    getBackend(id: string): BackendExtension | undefined;
    /** Check if a capability is available (i.e. a backend providing it is registered). */
    hasCapability(capability: BackendCapability): boolean;
    /** Get the backend extension providing a given capability. */
    getExtensionForCapability(capability: BackendCapability): BackendExtension | undefined;
    /**
     * Require that a capability is available. Throws a clear error if not.
     * Use in extension methods that depend on a backend being registered.
     */
    requireCapability(capability: BackendCapability): void;
    private providers;
    /**
     * Register a typed provider implementation for a capability.
     *
     * Backend packages call this during their registration phase:
     * ```ts
     * ExtensionPoint.registerProvider('llm', TextGeneration);
     * ExtensionPoint.registerProvider('stt', STT);
     * ```
     */
    registerProvider<K extends ProviderCapability>(capability: K, implementation: ProviderMap[K]): void;
    /**
     * Retrieve a registered provider by capability.
     * Returns undefined if no provider is registered for the given capability.
     */
    getProvider<K extends ProviderCapability>(capability: K): ProviderMap[K] | undefined;
    /**
     * Retrieve a registered provider or throw a descriptive error.
     * Use in code that requires a specific backend to be registered.
     */
    requireProvider<K extends ProviderCapability>(capability: K, packageHint?: string): ProviderMap[K];
    /** Remove a registered provider. */
    removeProvider(capability: ProviderCapability): void;
    /**
     * Register a service singleton under a typed key.
     * Backend packages call this during their registration phase.
     */
    registerService<T>(key: ServiceKey, service: T): void;
    /**
     * Retrieve a registered service singleton.
     * Returns undefined if the service is not registered yet.
     */
    getService<T>(key: ServiceKey): T | undefined;
    /**
     * Retrieve a registered service or throw a descriptive error.
     * Use in code that requires a specific backend to be registered.
     */
    requireService<T>(key: ServiceKey, packageHint?: string): T;
    /** Remove a registered service. */
    removeService(key: ServiceKey): void;
    /**
     * Cleanup all registered backends in reverse registration order.
     * Called during SDK shutdown.
     */
    cleanupAll(): void;
    /** Reset the registry (call after full shutdown). */
    reset(): void;
}
export declare const ExtensionPoint: ExtensionPointImpl;
export {};
//# sourceMappingURL=ExtensionPoint.d.ts.map