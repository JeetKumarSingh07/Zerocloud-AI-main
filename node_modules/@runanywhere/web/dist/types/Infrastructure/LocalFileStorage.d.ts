/**
 * LocalFileStorage - Persistent model storage using the File System Access API
 *
 * Allows users to choose a real folder on their local filesystem for model
 * storage. Models are saved as actual files (e.g. ~/ai-models/smollm2.gguf)
 * that persist permanently — no browser eviction, no re-downloads.
 *
 * The directory handle is stored in IndexedDB (not cookies — handles are
 * structured-cloneable objects that can't be serialized to strings).
 *
 * Browser support:
 *   - Chrome 122+: Full support with persistent permissions ("Allow on every visit")
 *   - Chrome 86-121: Supported but re-prompts for permission each session
 *   - Edge: Same as Chrome (Chromium-based)
 *   - Firefox/Safari: NOT supported — falls back to OPFS storage
 *
 * Usage:
 *   const storage = new LocalFileStorage();
 *   await storage.chooseDirectory();        // User picks a folder
 *   await storage.saveModel('model-id', data);
 *
 *   // On return visit:
 *   const restored = await storage.restoreDirectory();
 *   if (restored) {
 *     const data = await storage.loadModel('model-id');
 *   }
 */
export declare class LocalFileStorage {
    private dirHandle;
    private _isReady;
    private _hasStoredHandle;
    /** Per-key write lock to prevent concurrent writes to the same file. */
    private writeLocks;
    /** Whether the File System Access API is available in this browser. */
    static get isSupported(): boolean;
    /**
     * Get the stored directory name from localStorage (fast, synchronous).
     * Available immediately on page load before IndexedDB restores the handle.
     * Returns the folder name only (e.g. "ai-models"), not the full path.
     */
    static get storedDirectoryName(): string | null;
    /** Whether the storage is ready for use (directory selected + permission granted). */
    get isReady(): boolean;
    /** Whether a handle was found in IndexedDB (even if permission isn't granted yet). */
    get hasStoredHandle(): boolean;
    /** The name of the chosen directory (for display in UI). */
    get directoryName(): string | null;
    /**
     * Prompt the user to choose a directory for model storage.
     * Opens the OS folder picker dialog.
     * Stores the directory handle in IndexedDB for future sessions.
     *
     * @returns true if a directory was selected, false if cancelled
     */
    chooseDirectory(): Promise<boolean>;
    /**
     * Attempt to restore a previously chosen directory from IndexedDB.
     *
     * On Chrome 122+, if the user selected "Allow on every visit",
     * permission is automatically granted without any prompt.
     *
     * @returns true if directory was restored and permission is granted.
     *          false if no handle stored or permission not granted (UI
     *          should show a "Re-authorize" button).
     */
    restoreDirectory(): Promise<boolean>;
    /**
     * Request readwrite permission on a previously stored handle.
     * MUST be called from a user gesture (button click handler).
     *
     * @returns true if permission was granted
     */
    requestAccess(): Promise<boolean>;
    /**
     * Save model data to the local filesystem.
     * Uses a per-key lock to prevent concurrent writes from corrupting files.
     * @param key - Model identifier (used as filename)
     * @param data - Model file data
     */
    saveModel(key: string, data: ArrayBuffer): Promise<void>;
    /**
     * Save model data from a ReadableStream to the local filesystem.
     * Streams data directly to disk without buffering the entire file in memory.
     * Uses a per-key lock to prevent concurrent writes from corrupting files.
     * @param key - Model identifier (used as filename)
     * @param stream - Readable stream of model data
     */
    saveModelFromStream(key: string, stream: ReadableStream<Uint8Array>): Promise<void>;
    private _saveModelImpl;
    private _saveStreamImpl;
    /**
     * Per-key write lock: ensures only one write operation per key at a time.
     * Concurrent calls for the same key will be serialized.
     */
    private withWriteLock;
    /**
     * Load model data from the local filesystem.
     * @param key - Model identifier
     * @returns Model data, or null if not found
     */
    loadModel(key: string): Promise<ArrayBuffer | null>;
    /**
     * Load model data from the local filesystem as a ReadableStream.
     * @param key - Model identifier
     * @returns Readable stream of the model data, or null if not found
     */
    loadModelStream(key: string): Promise<ReadableStream<Uint8Array> | null>;
    /**
     * Get the File object for a model without reading into memory.
     * Enables streaming / mounting for locally stored files.
     * @param key - Model identifier
     */
    loadModelFile(key: string): Promise<File | null>;
    /**
     * Check if a model file exists in local storage.
     * @param key - Model identifier
     */
    hasModel(key: string): Promise<boolean>;
    /**
     * Delete a model file from local storage.
     * @param key - Model identifier
     */
    deleteModel(key: string): Promise<void>;
    /**
     * Get file size without reading into memory.
     * @param key - Model identifier
     */
    getFileSize(key: string): Promise<number | null>;
    /**
     * List all model files in the directory.
     */
    listModels(): Promise<Array<{
        id: string;
        sizeBytes: number;
        lastModified: number;
    }>>;
    private openDB;
    private storeHandle;
    private retrieveHandle;
    /**
     * Sanitize a key for use as a filename.
     * Keeps alphanumeric, dots, dashes, underscores. Replaces everything else.
     */
    private sanitizeFilename;
}
//# sourceMappingURL=LocalFileStorage.d.ts.map