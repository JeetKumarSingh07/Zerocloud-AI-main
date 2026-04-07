/**
 * Model Manager - Thin orchestrator for model lifecycle
 *
 * Composes ModelRegistry (catalog) + ModelDownloader (downloads) and adds
 * model-loading orchestration (STT / TTS / LLM / VLM routing).
 *
 * Backend-specific logic (writing to sherpa-onnx FS, extracting archives,
 * creating recognizer configs) is handled by the pluggable loader interfaces.
 * This keeps ModelManager backend-agnostic — it only depends on core types.
 */
import { ModelCategory, LLMFramework, ModelStatus, DownloadStage } from '../types/enums';
import type { LLMModelLoader, STTModelLoader, TTSModelLoader, VADModelLoader } from './ModelLoaderTypes';
import { ModelDownloader } from './ModelDownloader';
import type { ManagedModel, CompactModelDef, DownloadProgress, ModelFileDescriptor, ModelChangeCallback, ArtifactType } from './ModelRegistry';
export { ModelCategory, LLMFramework, ModelStatus, DownloadStage };
export type { ManagedModel, CompactModelDef, DownloadProgress, ModelFileDescriptor, ArtifactType };
/** Parameters for loading a VLM model in a dedicated worker. */
export interface VLMLoadParams {
    modelOpfsKey: string;
    modelFilename: string;
    mmprojOpfsKey: string;
    mmprojFilename: string;
    modelId: string;
    modelName: string;
    modelData?: ArrayBuffer;
    mmprojData?: ArrayBuffer;
}
/**
 * Interface for VLM (vision-language model) loading.
 * The app provides an implementation (typically backed by a Web Worker)
 * via `ModelManager.setVLMLoader()`.
 */
export interface VLMLoader {
    init(): Promise<void>;
    readonly isInitialized: boolean;
    loadModel(params: VLMLoadParams): Promise<void>;
    unloadModel(): Promise<void>;
}
declare class ModelManagerImpl {
    private readonly registry;
    private readonly storage;
    private readonly downloader;
    /**
     * Tracks loaded models per category — allows STT + LLM + TTS simultaneously
     * for the voice pipeline. Key = ModelCategory, Value = model id.
     */
    private loadedByCategory;
    /** LRU metadata: lastUsedAt timestamps persisted in OPFS */
    private metadata;
    /** Pluggable VLM loader (set by the app via setVLMLoader) */
    private vlmLoader;
    /** Pluggable model loaders — registered by backend providers */
    private llmLoader;
    private sttLoader;
    private ttsLoader;
    private vadLoader;
    constructor();
    private initStorage;
    registerModels(models: CompactModelDef[]): void;
    setVLMLoader(loader: VLMLoader): void;
    setLLMLoader(loader: LLMModelLoader): void;
    setSTTLoader(loader: STTModelLoader): void;
    setTTSLoader(loader: TTSModelLoader): void;
    setVADLoader(loader: VADModelLoader): void;
    /** Expose the downloader for backend packages that need file operations. */
    getDownloader(): ModelDownloader;
    /** Set the local file storage backend for persistent model storage. */
    setLocalFileStorage(storage: import('./LocalFileStorage').LocalFileStorage): void;
    private requestPersistentStorage;
    private refreshDownloadStatus;
    getModels(): ManagedModel[];
    getModelsByCategory(category: ModelCategory): ManagedModel[];
    getModelsByFramework(framework: LLMFramework): ManagedModel[];
    getLLMModels(): ManagedModel[];
    getVLMModels(): ManagedModel[];
    getSTTModels(): ManagedModel[];
    getTTSModels(): ManagedModel[];
    getVADModels(): ManagedModel[];
    getLoadedModel(category?: ModelCategory): ManagedModel | null;
    getLoadedModelId(category?: ModelCategory): string | null;
    areAllLoaded(categories: ModelCategory[]): boolean;
    ensureLoaded(category: ModelCategory, options?: {
        coexist?: boolean;
    }): Promise<ManagedModel | null>;
    checkDownloadFit(modelId: string): Promise<import('./ModelDownloader').QuotaCheckResult>;
    downloadModel(modelId: string): Promise<void>;
    /**
     * Import a model from a user-provided File (via picker or drag-and-drop).
     * Stores the file in the active storage backend and registers it as downloaded.
     * If the model isn't already in the catalog, auto-registers it based on filename.
     *
     * @param file - The File object from file picker or drag-drop
     * @param modelId - Optional: associate with an existing registered model
     * @returns The model ID (existing or auto-generated)
     */
    importModel(file: File, modelId?: string): Promise<string>;
    loadModel(modelId: string, options?: {
        coexist?: boolean;
    }): Promise<boolean>;
    unloadModel(modelId: string): Promise<void>;
    unloadAll(exceptModelId?: string): Promise<void>;
    deleteModel(modelId: string): Promise<void>;
    clearAll(): Promise<void>;
    getStorageInfo(): Promise<{
        modelCount: number;
        totalSize: number;
        available: number;
    }>;
    getModelLastUsedAt(modelId: string): number;
    private touchLastUsed;
    private removeMetadata;
    onChange(callback: ModelChangeCallback): () => void;
    /**
     * Build a ModelLoadContext for passing to backend loaders.
     */
    private buildLoadContext;
    /**
     * Load an LLM model via the pluggable loader.
     * The loader (in @runanywhere/web-llamacpp) handles writing to its own
     * Emscripten FS and calling the C API.
     */
    private loadLLMModel;
    /**
     * Load a VLM (vision-language) model via the pluggable VLM loader.
     */
    private loadVLMModel;
    /**
     * Load an STT model via the pluggable loader.
     * All sherpa-onnx FS operations are handled by the loader.
     */
    private loadSTTModel;
    /**
     * Load a TTS model via the pluggable loader.
     * All sherpa-onnx FS operations are handled by the loader.
     */
    private loadTTSModel;
    /**
     * Load a VAD model via the pluggable loader.
     * All sherpa-onnx FS operations are handled by the loader.
     */
    private loadVADModel;
    /** Unload the currently loaded model for a specific category */
    private unloadModelByCategory;
}
export declare const ModelManager: ModelManagerImpl;
//# sourceMappingURL=ModelManager.d.ts.map