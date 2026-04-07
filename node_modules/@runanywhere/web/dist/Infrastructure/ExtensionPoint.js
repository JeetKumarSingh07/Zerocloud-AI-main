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
import { SDKLogger } from '../Foundation/SDKLogger';
const logger = new SDKLogger('ExtensionPoint');
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
/** Capabilities that a backend can provide. */
export var BackendCapability;
(function (BackendCapability) {
    BackendCapability["LLM"] = "llm";
    BackendCapability["VLM"] = "vlm";
    BackendCapability["STT"] = "stt";
    BackendCapability["TTS"] = "tts";
    BackendCapability["VAD"] = "vad";
    BackendCapability["Embeddings"] = "embeddings";
    BackendCapability["Diffusion"] = "diffusion";
    BackendCapability["ToolCalling"] = "toolCalling";
    BackendCapability["StructuredOutput"] = "structuredOutput";
})(BackendCapability || (BackendCapability = {}));
/**
 * Typed service keys for cross-package singleton access.
 *
 * Backend packages register service instances (e.g. TextGeneration, STT, TTS)
 * under these keys during their registration phase. Core code (e.g. VoicePipeline)
 * retrieves them at runtime via `ExtensionPoint.getService(ServiceKey.XXX)` instead
 * of relying on untyped globalThis keys.
 */
export var ServiceKey;
(function (ServiceKey) {
    ServiceKey["TextGeneration"] = "textGeneration";
    ServiceKey["STT"] = "stt";
    ServiceKey["TTS"] = "tts";
    ServiceKey["VLM"] = "vlm";
    ServiceKey["Embeddings"] = "embeddings";
    ServiceKey["Diffusion"] = "diffusion";
    ServiceKey["ToolCalling"] = "toolCalling";
    ServiceKey["VAD"] = "vad";
})(ServiceKey || (ServiceKey = {}));
// ---------------------------------------------------------------------------
// ExtensionPoint Singleton
// ---------------------------------------------------------------------------
class ExtensionPointImpl {
    backends = new Map();
    capabilityMap = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    services = new Map();
    /**
     * Register a backend extension.
     * Idempotent — re-registering the same id is a no-op.
     */
    registerBackend(extension) {
        if (this.backends.has(extension.id)) {
            logger.debug(`Backend '${extension.id}' already registered, skipping`);
            return;
        }
        this.backends.set(extension.id, extension);
        for (const cap of extension.capabilities) {
            if (this.capabilityMap.has(cap)) {
                logger.warning(`Capability '${cap}' already provided by '${this.capabilityMap.get(cap).id}', ` +
                    `overriding with '${extension.id}'`);
            }
            this.capabilityMap.set(cap, extension);
        }
        logger.info(`Backend '${extension.id}' registered — capabilities: [${extension.capabilities.join(', ')}]`);
    }
    /** Get a backend by its id. */
    getBackend(id) {
        return this.backends.get(id);
    }
    /** Check if a capability is available (i.e. a backend providing it is registered). */
    hasCapability(capability) {
        return this.capabilityMap.has(capability);
    }
    /** Get the backend extension providing a given capability. */
    getExtensionForCapability(capability) {
        return this.capabilityMap.get(capability);
    }
    /**
     * Require that a capability is available. Throws a clear error if not.
     * Use in extension methods that depend on a backend being registered.
     */
    requireCapability(capability) {
        if (!this.capabilityMap.has(capability)) {
            const packageHint = capability === BackendCapability.LLM ||
                capability === BackendCapability.VLM ||
                capability === BackendCapability.Embeddings ||
                capability === BackendCapability.Diffusion ||
                capability === BackendCapability.ToolCalling ||
                capability === BackendCapability.StructuredOutput
                ? '@runanywhere/web-llamacpp'
                : '@runanywhere/web-onnx';
            throw new Error(`Capability '${capability}' not available. ` +
                `Install and register the ${packageHint} package.`);
        }
    }
    // -------------------------------------------------------------------------
    // Provider Registry — typed cross-package provider access (issue #371)
    // -------------------------------------------------------------------------
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providers = new Map();
    /**
     * Register a typed provider implementation for a capability.
     *
     * Backend packages call this during their registration phase:
     * ```ts
     * ExtensionPoint.registerProvider('llm', TextGeneration);
     * ExtensionPoint.registerProvider('stt', STT);
     * ```
     */
    registerProvider(capability, implementation) {
        if (this.providers.has(capability)) {
            logger.debug(`Provider '${capability}' already registered, overwriting`);
        }
        this.providers.set(capability, implementation);
        logger.debug(`Provider '${capability}' registered`);
    }
    /**
     * Retrieve a registered provider by capability.
     * Returns undefined if no provider is registered for the given capability.
     */
    getProvider(capability) {
        return this.providers.get(capability);
    }
    /**
     * Retrieve a registered provider or throw a descriptive error.
     * Use in code that requires a specific backend to be registered.
     */
    requireProvider(capability, packageHint) {
        const provider = this.providers.get(capability);
        if (!provider) {
            const hint = packageHint ?? (capability === 'stt' || capability === 'tts'
                ? '@runanywhere/web-onnx'
                : '@runanywhere/web-llamacpp');
            throw new Error(`Provider '${capability}' not available. Install and register the ${hint} package.`);
        }
        return provider;
    }
    /** Remove a registered provider. */
    removeProvider(capability) {
        this.providers.delete(capability);
    }
    // -------------------------------------------------------------------------
    // Service Registry — typed singleton access for cross-package communication
    // -------------------------------------------------------------------------
    /**
     * Register a service singleton under a typed key.
     * Backend packages call this during their registration phase.
     */
    registerService(key, service) {
        if (this.services.has(key)) {
            logger.debug(`Service '${key}' already registered, overwriting`);
        }
        this.services.set(key, service);
    }
    /**
     * Retrieve a registered service singleton.
     * Returns undefined if the service is not registered yet.
     */
    getService(key) {
        return this.services.get(key);
    }
    /**
     * Retrieve a registered service or throw a descriptive error.
     * Use in code that requires a specific backend to be registered.
     */
    requireService(key, packageHint) {
        const service = this.services.get(key);
        if (!service) {
            const hint = packageHint ?? (key === ServiceKey.STT || key === ServiceKey.TTS || key === ServiceKey.VAD
                ? '@runanywhere/web-onnx'
                : '@runanywhere/web-llamacpp');
            throw new Error(`Service '${key}' not available. Install and register the ${hint} package.`);
        }
        return service;
    }
    /** Remove a registered service. */
    removeService(key) {
        this.services.delete(key);
    }
    /**
     * Cleanup all registered backends in reverse registration order.
     * Called during SDK shutdown.
     */
    cleanupAll() {
        const entries = [...this.backends.entries()].reverse();
        for (const [id, backend] of entries) {
            try {
                backend.cleanup();
                logger.debug(`Backend '${id}' cleaned up`);
            }
            catch {
                // Ignore errors during shutdown
            }
        }
    }
    /** Reset the registry (call after full shutdown). */
    reset() {
        this.backends.clear();
        this.capabilityMap.clear();
        this.services.clear();
        this.providers.clear();
    }
}
export const ExtensionPoint = new ExtensionPointImpl();
//# sourceMappingURL=ExtensionPoint.js.map