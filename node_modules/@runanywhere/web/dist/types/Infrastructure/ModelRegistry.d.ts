/**
 * Model Registry - Model catalog management
 *
 * Manages the list of registered models, their statuses, and notifies
 * listeners when the catalog changes. Extracted from ModelManager to keep
 * catalog concerns separate from download/load orchestration.
 */
import { ModelCategory, LLMFramework, ModelStatus } from '../types/enums';
export { ModelCategory, LLMFramework, ModelStatus };
/**
 * For multi-file models (VLM, STT, TTS), describes additional files
 * that need to be downloaded alongside the main URL.
 */
export interface ModelFileDescriptor {
    /** Download URL */
    url: string;
    /** Filename to store as (used for OPFS key and FS path) */
    filename: string;
    /** Optional: size in bytes (for progress estimation) */
    sizeBytes?: number;
}
/**
 * A model being managed by the ModelManager.
 * Tracks download state, load state, and file locations.
 *
 * Named `ManagedModel` to avoid collision with the SDK's existing
 * `ModelInfo` type in types/models.ts (which describes C++ bridge models).
 */
export interface ManagedModel {
    id: string;
    name: string;
    /** Primary download URL (single file models) or archive URL */
    url: string;
    framework: LLMFramework;
    modality?: ModelCategory;
    memoryRequirement?: number;
    status: ModelStatus;
    downloadProgress?: number;
    error?: string;
    sizeBytes?: number;
    /**
     * For multi-file models: additional files to download.
     * The main 'url' is still the primary file; these are extras.
     * For VLM: includes the mmproj file.
     * For STT/TTS: encoder/decoder/tokens files.
     */
    additionalFiles?: ModelFileDescriptor[];
    /**
     * Whether the main URL is an archive (tar.gz) that needs extraction.
     * STT and TTS models from sherpa-onnx are typically tar.gz archives.
     */
    isArchive?: boolean;
    /**
     * Paths of extracted files after download (populated after extraction).
     * Maps logical name -> filesystem path.
     */
    extractedPaths?: Record<string, string>;
}
/** Structured download progress with stage information. */
export interface DownloadProgress {
    modelId: string;
    stage: import('../types/enums').DownloadStage;
    /** Overall progress 0-1 */
    progress: number;
    bytesDownloaded: number;
    totalBytes: number;
    /** Filename currently being downloaded (for multi-file models) */
    currentFile?: string;
    /** Number of files completed so far */
    filesCompleted?: number;
    /** Total number of files to download */
    filesTotal?: number;
}
export type ModelChangeCallback = (models: ManagedModel[]) => void;
/**
 * Artifact types for model archives.
 * Matches Swift's `ArtifactType` — archives are downloaded as a single file
 * and extracted, while individual files are downloaded separately.
 */
export type ArtifactType = 'archive';
/** Compact model definition for the registry. */
export interface CompactModelDef {
    id: string;
    name: string;
    /** HuggingFace repo path (e.g., 'LiquidAI/LFM2-VL-450M-GGUF'). */
    repo?: string;
    /** Direct URL override for non-HuggingFace sources (e.g., GitHub). */
    url?: string;
    /**
     * Filenames in the repo. First = primary model file, rest = companions.
     * Unused when `artifactType` is 'archive' (the archive contains all files).
     */
    files?: string[];
    framework: LLMFramework;
    modality?: ModelCategory;
    memoryRequirement?: number;
    /**
     * When set to 'archive', the URL points to a .tar.gz archive that
     * bundles all model files (including espeak-ng-data for TTS).
     * Matches Swift SDK's `.archive(.tarGz, structure: .nestedDirectory)`.
     */
    artifactType?: ArtifactType;
}
/**
 * ModelRegistry — manages the model catalog, status tracking, and listener
 * notifications. Does NOT handle downloads or loading.
 */
export declare class ModelRegistry {
    private models;
    private listeners;
    /**
     * Register a catalog of models. Resolves compact definitions into full
     * ManagedModel entries.
     *
     * @returns The resolved models array (callers can use this for further checks).
     */
    registerModels(defs: CompactModelDef[]): ManagedModel[];
    /**
     * Add a single model to the registry without replacing existing ones.
     * Used for importing models via file picker or drag-and-drop.
     * If a model with the same ID already exists, this is a no-op.
     */
    addModel(model: ManagedModel): void;
    getModels(): ManagedModel[];
    getModel(id: string): ManagedModel | undefined;
    getModelsByCategory(category: ModelCategory): ManagedModel[];
    getModelsByFramework(framework: LLMFramework): ManagedModel[];
    getLLMModels(): ManagedModel[];
    getVLMModels(): ManagedModel[];
    getSTTModels(): ManagedModel[];
    getTTSModels(): ManagedModel[];
    getVADModels(): ManagedModel[];
    updateModel(id: string, patch: Partial<ManagedModel>): void;
    onChange(callback: ModelChangeCallback): () => void;
    private notifyListeners;
}
//# sourceMappingURL=ModelRegistry.d.ts.map