/**
 * Model Downloader - Download orchestration with OPFS persistence
 *
 * Handles single-file and multi-file model downloads with progress tracking.
 * Delegates all OPFS storage operations to the enhanced OPFSStorage class.
 * Extracted from ModelManager to separate download concerns from load/catalog logic.
 */
import { OPFSStorage } from './OPFSStorage';
import type { MetadataMap } from './OPFSStorage';
import type { LocalFileStorage } from './LocalFileStorage';
import type { ManagedModel } from './ModelRegistry';
import type { ModelRegistry } from './ModelRegistry';
/** Candidate model that could be evicted to free space. */
export interface EvictionCandidateInfo {
    id: string;
    name: string;
    sizeBytes: number;
    lastUsedAt: number;
}
/** Result of a pre-download quota check. */
export interface QuotaCheckResult {
    /** Whether the model fits in available storage without eviction. */
    fits: boolean;
    /** Currently available bytes (estimate). */
    availableBytes: number;
    /** Total bytes needed for the model (primary + additional files). */
    neededBytes: number;
    /**
     * Models that could be evicted to free space, sorted by lastUsedAt ascending
     * (least recently used first). Only populated when `fits` is false.
     */
    evictionCandidates: EvictionCandidateInfo[];
}
export declare class ModelDownloader {
    private readonly storage;
    private readonly registry;
    /**
     * Optional local filesystem storage. When configured, models are saved
     * to the user's chosen directory instead of OPFS. Set via setLocalFileStorage().
     */
    private localFileStorage;
    /**
     * In-memory fallback cache for models that were downloaded successfully
     * but failed to persist to OPFS (e.g. storage quota exceeded).
     * Keyed by modelId/file key. Cleared once the data is consumed by loadFromOPFS.
     */
    private readonly memoryCache;
    constructor(registry: ModelRegistry, storage: OPFSStorage);
    /**
     * Set the local file storage backend.
     * When configured and ready, models are saved/loaded from the local filesystem first.
     */
    setLocalFileStorage(storage: LocalFileStorage): void;
    /**
     * Check whether a model will fit in OPFS without eviction.
     *
     * Uses `navigator.storage.estimate()` for available space and compares
     * against the model's total size (primary + additional files).
     * If the model won't fit, returns eviction candidates sorted by LRU.
     *
     * @param model       - The model to check
     * @param metadata    - LRU metadata map (lastUsedAt per model)
     * @param loadedModelId - Currently loaded model ID (excluded from eviction)
     */
    checkStorageQuota(model: ManagedModel, metadata: MetadataMap, loadedModelId?: string): Promise<QuotaCheckResult>;
    /**
     * Download a model (and any additional companion files).
     * Handles both single-file and multi-file models.
     */
    downloadModel(modelId: string): Promise<void>;
    /**
     * Download a file from a URL with optional progress callback.
     * Exposed so ModelManager can use it for on-demand file downloads during load.
     *
     * URLs are validated before fetching to prevent SSRF and enforce HTTPS.
     */
    downloadFile(url: string, onProgress?: (progress: number, bytesDownloaded: number, totalBytes: number) => void): Promise<Uint8Array>;
    /**
     * Download a file and stream it directly to persistent storage (OPFS or local FS)
     * without buffering the entire payload in memory.
     *
     * Returns the total bytes downloaded. Falls back to buffered download + store
     * if streaming write is not supported or fails.
     *
     * @returns Total bytes written, or null if streaming was not possible.
     */
    downloadAndStoreStreaming(url: string, storageKey: string, onProgress?: (progress: number, bytesDownloaded: number, totalBytes: number) => void): Promise<number | null>;
    /** Store data, preferring local filesystem when available, then OPFS, then memory cache. */
    storeInOPFS(key: string, data: Uint8Array): Promise<void>;
    /**
     * Evict old models from OPFS to free space for a new model.
     * Deletes models sorted by oldest-first until enough space is freed,
     * skipping the model being stored AND any sibling files that belong
     * to the same model (e.g. main model file and its mmproj companion).
     *
     * Sibling detection: files are siblings if one key is a prefix of
     * the other, separated by "__" (e.g. "modelA" and "modelA__mmproj-...").
     */
    private evictOPFSModels;
    /**
     * Store a file from a ReadableStream, avoiding loading the entire file into memory.
     * Priority: local filesystem > OPFS. Falls back to buffered write if streaming not supported.
     */
    storeStreamInOPFS(key: string, stream: ReadableStream<Uint8Array>): Promise<void>;
    /** Load data from storage. Priority: local filesystem > OPFS > memory cache. */
    loadFromOPFS(key: string): Promise<Uint8Array | null>;
    /** Load data from storage as a ReadableStream. Priority: local filesystem > OPFS > memory cache. */
    loadStreamFromOPFS(key: string): Promise<ReadableStream<Uint8Array> | null>;
    /** Load file object from storage (local FS or OPFS) without reading into memory. */
    loadModelFile(key: string): Promise<File | null>;
    /** Check existence in local storage, OPFS, or in-memory cache. */
    existsInOPFS(key: string): Promise<boolean>;
    /** Check if data exists in actual OPFS storage (NOT memory cache). */
    existsInActualOPFS(key: string): Promise<boolean>;
    /** Delete from all storage backends (local filesystem, OPFS, memory cache). */
    deleteFromOPFS(key: string): Promise<void>;
    /** Get file size from storage without reading into memory. */
    getOPFSFileSize(key: string): Promise<number | null>;
    /**
     * Build an OPFS key for additional files (e.g., mmproj).
     * Uses `__` separator to avoid name collisions between
     * a primary model FILE and a directory with the same name.
     */
    additionalFileKey(modelId: string, filename: string): string;
    /** Emit a structured download progress event via EventBus */
    private emitDownloadProgress;
}
//# sourceMappingURL=ModelDownloader.d.ts.map