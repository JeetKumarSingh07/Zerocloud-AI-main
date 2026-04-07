/**
 * RunAnywhere Web SDK - OPFS (Origin Private File System) Storage
 *
 * Persistent model storage using the browser's Origin Private File System.
 * OPFS provides a sandboxed, high-performance file system for large model files
 * that persists across page reloads (unlike Emscripten MEMFS).
 *
 * Supports nested paths: keys containing `/` are treated as subdirectory paths.
 *   e.g. `saveModel('org/model/file.gguf', data)` creates `models/org/model/file.gguf`
 *
 * Fallback: If OPFS is not available, models stay in MEMFS (volatile).
 *
 * Usage:
 *   import { OPFSStorage } from '@runanywhere/web';
 *
 *   const storage = new OPFSStorage();
 *   await storage.saveModel('whisper-base', modelArrayBuffer);
 *   await storage.saveModel('org/model/file.gguf', modelArrayBuffer);
 *   const data = await storage.loadModel('whisper-base');
 *   const models = await storage.listModels();
 */
export interface StoredModelInfo {
    id: string;
    sizeBytes: number;
    lastModified: number;
}
/** Lightweight per-model metadata persisted alongside model files. */
export interface ModelMetadata {
    lastUsedAt: number;
    sizeBytes: number;
}
/** The full metadata map stored as `_metadata.json` in the models directory. */
export type MetadataMap = Record<string, ModelMetadata>;
/**
 * OPFSStorage - Persistent model file storage using Origin Private File System.
 *
 * Keys can be flat (`whisper-base`) or nested (`org/model/file.gguf`).
 * Nested keys are stored in the corresponding subdirectory hierarchy under the
 * `models/` OPFS root.
 */
export declare class OPFSStorage {
    private rootDir;
    private modelsDir;
    private _isAvailable;
    /**
     * Check if OPFS is available in this browser.
     */
    static get isSupported(): boolean;
    /**
     * Initialize OPFS storage. Must be called before other methods.
     *
     * @returns true if OPFS was initialized, false if not available
     */
    initialize(): Promise<boolean>;
    get isAvailable(): boolean;
    /**
     * Save model data to OPFS.
     *
     * Supports nested paths: `saveModel('org/model/file.gguf', data)` creates
     * `models/org/model/` directories and writes `file.gguf`.
     *
     * @param key - Model identifier or nested path (used as filename / path)
     * @param data - Model file data
     */
    saveModel(key: string, data: ArrayBuffer): Promise<void>;
    /**
     * Save model data to OPFS from a ReadableStream.
     * Streams data directly to disk without buffering the entire file in memory.
     *
     * @param key - Model identifier or nested path
     * @param stream - Readable stream of model data
     */
    saveModelFromStream(key: string, stream: ReadableStream<Uint8Array>): Promise<void>;
    /**
     * Load model data from OPFS.
     *
     * @param key - Model identifier or nested path
     * @returns Model data, or null if not found
     */
    loadModel(key: string): Promise<ArrayBuffer | null>;
    /**
     * Load model data from OPFS as a ReadableStream.
     *
     * @param key - Model identifier or nested path
     * @returns Readable stream of the model data, or null if not found
     */
    loadModelStream(key: string): Promise<ReadableStream<Uint8Array> | null>;
    /**
     * Load model file object from OPFS without reading contents into memory.
     *
     * @param key - Model identifier or nested path
     * @returns File object, or null if not found
     */
    loadModelFile(key: string): Promise<File | null>;
    /**
     * Check if a model exists in OPFS.
     *
     * @param key - Model identifier or nested path
     */
    hasModel(key: string): Promise<boolean>;
    /**
     * Delete a model from OPFS.
     *
     * @param key - Model identifier or nested path
     */
    deleteModel(key: string): Promise<void>;
    /**
     * Get the byte size of a stored file without reading it into memory.
     *
     * @param key - Model identifier or nested path
     * @returns File size in bytes, or null if the file doesn't exist
     */
    getFileSize(key: string): Promise<number | null>;
    /**
     * List all stored models (top-level files only).
     */
    listModels(): Promise<StoredModelInfo[]>;
    /**
     * Get total storage usage.
     */
    getStorageUsage(): Promise<{
        usedBytes: number;
        quotaBytes: number;
    }>;
    /**
     * Clear all stored models.
     */
    clearAll(): Promise<void>;
    private static readonly METADATA_FILENAME;
    /**
     * Save model metadata map to OPFS as a small JSON file.
     * Used for LRU tracking (lastUsedAt timestamps).
     */
    saveMetadata(data: MetadataMap): Promise<void>;
    /**
     * Load the persisted metadata map, or return an empty object.
     */
    loadMetadata(): Promise<MetadataMap>;
    /**
     * For a key that may contain `/`, traverse (and optionally create) the
     * intermediate directories and return the parent directory handle.
     *
     * For a flat key (no `/`) this returns `this.modelsDir` directly.
     */
    private resolveParentDir;
    /**
     * Extract the final filename segment from a key.
     *
     * For flat keys this returns a sanitized version of the whole key.
     * For nested keys (`org/model/file.gguf`) this returns the last segment
     * with only the filename portion sanitized (directory separators are handled
     * by `resolveParentDir`).
     */
    private resolveFilename;
    /**
     * Sanitize a single filename segment.
     *
     * Only strips characters that are invalid in filenames. Keeps `.`, `-`, `_`,
     * and all alphanumeric characters. This is intentionally lenient compared to
     * the old implementation which also stripped `/` — directory separators are
     * now handled structurally by `resolveParentDir`.
     */
    private sanitizeFilename;
}
//# sourceMappingURL=OPFSStorage.d.ts.map