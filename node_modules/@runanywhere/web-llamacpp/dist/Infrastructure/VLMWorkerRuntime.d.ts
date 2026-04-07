/**
 * RunAnywhere Web SDK - VLM Worker Runtime
 *
 * Encapsulates the Worker-side logic for VLM inference. This module runs
 * inside a dedicated Web Worker and manages its own WASM instance
 * (separate from the main-thread SDK).
 *
 * Architecture:
 *   - Loads its OWN WASM instance (separate from the main thread SDK)
 *   - Reads model files from OPFS directly (no large postMessage transfers)
 *   - Communicates via typed postMessage RPC
 *
 * Why a separate WASM instance?
 *   The C function `rac_vlm_component_process` is synchronous and blocks for
 *   ~100s (2B model in WASM). Running it on the main thread freezes the entire UI.
 *   A Worker with its own WASM instance allows inference to happen concurrently.
 *
 * IMPORTANT: This file must NOT import from WASMBridge.ts or other SDK modules
 * that assume a main-thread context. The Worker has its own WASM instance and
 * should be self-contained. Only `type`-only imports are safe.
 */
import type { VLMWorkerResult } from './VLMWorkerBridge';
export type { VLMWorkerResult };
/**
 * Start the VLM Worker runtime.
 *
 * Call this once from the Worker entry point. It sets up the `self.onmessage`
 * handler that processes RPC commands from the main-thread VLMWorkerBridge.
 *
 * @example
 * ```typescript
 * // workers/vlm-worker.ts
 * import { startVLMWorkerRuntime } from '../Infrastructure/VLMWorkerRuntime';
 * startVLMWorkerRuntime();
 * ```
 */
export declare function startVLMWorkerRuntime(): void;
//# sourceMappingURL=VLMWorkerRuntime.d.ts.map