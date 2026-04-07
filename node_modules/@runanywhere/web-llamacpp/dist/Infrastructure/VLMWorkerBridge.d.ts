/**
 * RunAnywhere Web SDK - VLM Worker Bridge
 *
 * Main-thread proxy for the VLM Web Worker. All VLM inference runs off the
 * main thread so the camera, UI animations, and event loop stay responsive.
 *
 * Usage:
 *   ```typescript
 *   import { VLMWorkerBridge } from '@runanywhere/web';
 *
 *   const vlm = VLMWorkerBridge.shared;
 *   await vlm.init();
 *   await vlm.loadModel({ ... });
 *   const result = await vlm.process(rgbPixels, width, height, prompt, { maxTokens: 100 });
 *   ```
 */
/**
 * RPC commands sent from the main thread to the Worker.
 */
export type VLMWorkerCommand = {
    type: 'init';
    id: number;
    payload: {
        /** URL to the WASM glue JS (racommons.js or racommons-webgpu.js) */
        wasmJsUrl: string;
        /** Whether the loaded module is the WebGPU variant */
        useWebGPU?: boolean;
    };
} | {
    type: 'load-model';
    id: number;
    payload: {
        modelOpfsKey: string;
        modelFilename: string;
        mmprojOpfsKey: string;
        mmprojFilename: string;
        modelId: string;
        modelName: string;
        /** Optional: raw model data when OPFS doesn't have it (memory-cache fallback). */
        modelData?: ArrayBuffer;
        /** Optional: raw mmproj data when OPFS doesn't have it. */
        mmprojData?: ArrayBuffer;
    };
} | {
    type: 'process';
    id: number;
    payload: {
        rgbPixels: ArrayBuffer;
        width: number;
        height: number;
        prompt: string;
        maxTokens: number;
        temperature: number;
        topP: number;
        systemPrompt?: string;
        modelFamily?: number;
    };
} | {
    type: 'cancel';
    id: number;
} | {
    type: 'unload';
    id: number;
};
/**
 * Result of a VLM inference operation.
 */
export interface VLMWorkerResult {
    text: string;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    imageTokens: number;
}
/**
 * RPC responses from the Worker to the main thread.
 */
export type VLMWorkerResponse = {
    id: number;
    type: 'result';
    payload: any;
} | {
    id: number;
    type: 'error';
    payload: {
        message: string;
    };
} | {
    id: number;
    type: 'progress';
    payload: {
        stage: string;
    };
};
/**
 * Parameters for loading a VLM model in the Worker.
 */
export interface VLMLoadModelParams {
    modelOpfsKey: string;
    modelFilename: string;
    mmprojOpfsKey: string;
    mmprojFilename: string;
    modelId: string;
    modelName: string;
    /** Optional: raw model data when OPFS doesn't have it (memory-cache fallback). */
    modelData?: ArrayBuffer;
    /** Optional: raw mmproj data when OPFS doesn't have it. */
    mmprojData?: ArrayBuffer;
}
/**
 * Options for VLM image processing via the Worker bridge.
 */
export interface VLMProcessOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    /** System prompt prepended to the user prompt inside the Worker. */
    systemPrompt?: string;
    /** Model family enum value (maps to rac_vlm_model_family_t). 0 = auto-detect. */
    modelFamily?: number;
}
/**
 * Callback for VLM progress updates (model loading stages, etc.).
 */
export type ProgressListener = (stage: string) => void;
/**
 * VLMWorkerBridge - Main-thread proxy for VLM Web Worker inference.
 *
 * Manages the lifecycle of a dedicated Web Worker that runs VLM inference
 * in its own WASM instance. Provides:
 *   - RPC protocol with message ID tracking and promise correlation
 *   - Auto-recovery from WASM crashes (OOB, stack overflow, etc.)
 *   - Progress listeners for model loading stages
 *   - Transferable pixel data for zero-copy image transfer
 */
export declare class VLMWorkerBridge {
    private static _instance;
    static get shared(): VLMWorkerBridge;
    private worker;
    private nextId;
    private pending;
    private _isInitialized;
    private _isModelLoaded;
    private _progressListeners;
    /** Saved for auto-recovery after WASM crash */
    private _lastModelParams;
    private _needsRecovery;
    /**
     * Optional: the app can provide a custom Worker URL or factory.
     * If not set, the bridge uses the bundled SDK worker entry point.
     */
    private _workerUrl;
    get isInitialized(): boolean;
    get isModelLoaded(): boolean;
    /**
     * Set a custom Worker URL.
     *
     * By default the bridge creates a Worker using the SDK's bundled entry point
     * (`workers/vlm-worker.js`). Apps that need to customise the Worker location
     * (e.g. different deploy path, or a worker that wraps the runtime) can call
     * this before `init()`.
     */
    set workerUrl(url: URL | string);
    /**
     * Subscribe to progress updates from the Worker.
     * Returns an unsubscribe function.
     */
    onProgress(fn: ProgressListener): () => void;
    private emitProgress;
    /**
     * Initialize the Worker and its WASM instance.
     * Must be called once before loadModel/process.
     *
     * Reads the WASM URL and acceleration mode from LlamaCppBridge internally —
     * the app does not need to pass these.
     *
     * @param wasmJsUrl - Optional explicit URL for the WASM glue JS.
     *                    When omitted, the SDK's LlamaCppBridge.wasmUrl is used
     *                    so the worker loads the exact same variant (WebGPU or CPU)
     *                    that the main thread successfully loaded.
     */
    init(wasmJsUrl?: string): Promise<void>;
    /**
     * Load a VLM model in the Worker's WASM instance.
     *
     * Normally the Worker reads model files directly from OPFS (zero-copy).
     * When OPFS quota is exceeded and models are only in the main-thread memory
     * cache, the data is transferred via postMessage (still zero-copy via
     * Transferable ArrayBuffers).
     */
    loadModel(params: VLMLoadModelParams): Promise<void>;
    /**
     * Process an image with the VLM.
     * Returns a promise that resolves when inference is complete.
     * The main thread stays responsive during processing.
     *
     * The pixel buffer is transferred (zero-copy) to the Worker.
     */
    process(rgbPixels: Uint8Array, width: number, height: number, prompt: string, options?: VLMProcessOptions): Promise<VLMWorkerResult>;
    /**
     * Recover from a WASM crash by terminating the old Worker,
     * creating a fresh one, and reloading the model.
     */
    private recover;
    /** Cancel in-progress VLM generation. */
    cancel(): void;
    /** Unload the VLM model. */
    unloadModel(): Promise<void>;
    /**
     * Terminate the Worker entirely.
     *
     * Rejects any in-flight RPC promises so callers aren't left hanging,
     * then terminates the underlying Web Worker.
     */
    terminate(): void;
    private send;
    private handleMessage;
}
//# sourceMappingURL=VLMWorkerBridge.d.ts.map