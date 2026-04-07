/**
 * RunAnywhere Web SDK - Main Entry Point
 *
 * The public API for the RunAnywhere Web SDK.
 * Core is pure TypeScript — no WASM. Each backend package ships its own WASM:
 *   - @runanywhere/web-llamacpp (racommons-llamacpp.wasm)
 *   - @runanywhere/web-onnx (sherpa-onnx.wasm)
 *
 * Usage:
 *   import { RunAnywhere } from '@runanywhere/web';
 *   import { LlamaCPP } from '@runanywhere/web-llamacpp';
 *   import { ONNX } from '@runanywhere/web-onnx';
 *
 *   await RunAnywhere.initialize({ environment: 'development' });
 *   await LlamaCPP.register();
 *   await ONNX.register();
 */
import { SDKEnvironment, ModelCategory } from '../types/enums';
import type { SDKInitOptions } from '../types/models';
import { EventBus } from '../Foundation/EventBus';
import type { CompactModelDef, ManagedModel, VLMLoader } from '../Infrastructure/ModelManager';
export declare const RunAnywhere: {
    readonly isInitialized: boolean;
    readonly version: string;
    readonly environment: SDKEnvironment | null;
    readonly events: EventBus;
    /**
     * Initialize the RunAnywhere SDK.
     *
     * This only initializes the TypeScript infrastructure:
     *   1. Configure logging
     *   2. Initialize storage (OPFS)
     *   3. Restore local file storage (if previously configured)
     *
     * WASM is loaded lazily by each backend package when you call:
     *   await LlamaCPP.register();  // loads racommons-llamacpp.wasm
     *   await ONNX.register();      // loads sherpa-onnx.wasm (on first use)
     */
    initialize(options?: SDKInitOptions): Promise<void>;
    registerModels(models: CompactModelDef[]): void;
    setVLMLoader(loader: VLMLoader): void;
    downloadModel(modelId: string): Promise<void>;
    loadModel(modelId: string): Promise<boolean>;
    availableModels(): ManagedModel[];
    getLoadedModel(category?: ModelCategory): ManagedModel | null;
    unloadAll(): Promise<void>;
    deleteModel(modelId: string): Promise<void>;
    importModelFromPicker(options?: {
        modelId?: string;
        accept?: string[];
    }): Promise<string | null>;
    importModelFromFile(file: File, options?: {
        modelId?: string;
    }): Promise<string>;
    readonly isLocalStorageSupported: boolean;
    readonly isLocalStorageReady: boolean;
    readonly hasLocalStorageHandle: boolean;
    readonly localStorageDirectoryName: string | null;
    chooseLocalStorageDirectory(): Promise<boolean>;
    restoreLocalStorage(): Promise<boolean>;
    requestLocalStorageAccess(): Promise<boolean>;
    shutdown(): void;
    reset(): void;
};
//# sourceMappingURL=RunAnywhere.d.ts.map