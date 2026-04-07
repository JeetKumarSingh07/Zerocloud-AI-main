/**
 * LlamaCppOffsets - Cached struct offset access for the llama.cpp WASM module
 *
 * Provides the same `Offsets.llmOptions.temperature` access pattern that the
 * old core WASMBridge had, but backed by LlamaCppBridge.shared.wasmOffsetOf().
 *
 * Offsets are loaded lazily on first access and cached thereafter.
 */
import type { AllOffsets } from '@runanywhere/web';
/**
 * Load all struct offsets from the LlamaCppBridge WASM module.
 * Results are cached after the first call.
 *
 * Must be called after LlamaCppBridge.shared.ensureLoaded().
 */
export declare function loadOffsets(): AllOffsets;
/**
 * Get the cached offsets. Throws if loadOffsets() hasn't been called yet.
 */
export declare function getOffsets(): AllOffsets;
/**
 * Convenience alias: `Offsets` provides the same access pattern as the old
 * core `Offsets` global, e.g. `Offsets.llmOptions.temperature`.
 *
 * Lazily loads offsets on first property access.
 */
export declare const Offsets: AllOffsets;
/**
 * Reset the cached offsets (for testing or when the bridge is reloaded).
 */
export declare function resetOffsets(): void;
//# sourceMappingURL=LlamaCppOffsets.d.ts.map