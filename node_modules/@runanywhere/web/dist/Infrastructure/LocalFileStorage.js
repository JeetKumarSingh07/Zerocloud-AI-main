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
import { SDKLogger } from '../Foundation/SDKLogger';
const logger = new SDKLogger('LocalFileStorage');
// ---------------------------------------------------------------------------
// IndexedDB Constants
// ---------------------------------------------------------------------------
const DB_NAME = 'runanywhere-storage';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const HANDLE_KEY = 'modelDirectory';
const LS_DIR_NAME_KEY = 'runanywhere_storage_dir_name';
// ---------------------------------------------------------------------------
// LocalFileStorage
// ---------------------------------------------------------------------------
export class LocalFileStorage {
    dirHandle = null;
    _isReady = false;
    _hasStoredHandle = false;
    /** Per-key write lock to prevent concurrent writes to the same file. */
    writeLocks = new Map();
    // -------------------------------------------------------------------------
    // Static
    // -------------------------------------------------------------------------
    /** Whether the File System Access API is available in this browser. */
    static get isSupported() {
        return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
    }
    /**
     * Get the stored directory name from localStorage (fast, synchronous).
     * Available immediately on page load before IndexedDB restores the handle.
     * Returns the folder name only (e.g. "ai-models"), not the full path.
     */
    static get storedDirectoryName() {
        try {
            return localStorage.getItem(LS_DIR_NAME_KEY);
        }
        catch {
            return null;
        }
    }
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    /** Whether the storage is ready for use (directory selected + permission granted). */
    get isReady() {
        return this._isReady && this.dirHandle !== null;
    }
    /** Whether a handle was found in IndexedDB (even if permission isn't granted yet). */
    get hasStoredHandle() {
        return this._hasStoredHandle;
    }
    /** The name of the chosen directory (for display in UI). */
    get directoryName() {
        return this.dirHandle?.name ?? null;
    }
    // -------------------------------------------------------------------------
    // Directory Selection
    // -------------------------------------------------------------------------
    /**
     * Prompt the user to choose a directory for model storage.
     * Opens the OS folder picker dialog.
     * Stores the directory handle in IndexedDB for future sessions.
     *
     * @returns true if a directory was selected, false if cancelled
     */
    async chooseDirectory() {
        if (!LocalFileStorage.isSupported) {
            logger.warning('File System Access API not supported in this browser');
            return false;
        }
        try {
            // showDirectoryPicker requires user gesture (button click)
            const win = window;
            this.dirHandle = await win.showDirectoryPicker({
                mode: 'readwrite',
            });
            await this.storeHandle(this.dirHandle);
            this._isReady = true;
            this._hasStoredHandle = true;
            // Persist directory name in localStorage for fast UI display on next visit
            try {
                localStorage.setItem(LS_DIR_NAME_KEY, this.dirHandle.name);
            }
            catch { /* non-critical */ }
            logger.info(`Local storage directory selected: ${this.dirHandle.name}`);
            return true;
        }
        catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                logger.debug('User cancelled directory picker');
                return false;
            }
            const message = err instanceof Error ? err.message : String(err);
            logger.error(`Failed to choose directory: ${message}`);
            return false;
        }
    }
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
    async restoreDirectory() {
        if (!LocalFileStorage.isSupported)
            return false;
        try {
            const handle = await this.retrieveHandle();
            if (!handle) {
                logger.debug('No stored directory handle found');
                return false;
            }
            this._hasStoredHandle = true;
            this.dirHandle = handle;
            // queryPermission does NOT require user gesture
            const permission = await handle.queryPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
                this._isReady = true;
                logger.info(`Local storage restored: ${handle.name}`);
                return true;
            }
            // Permission not granted yet — user needs to click a button
            // to trigger requestPermission() via requestAccess()
            logger.debug(`Local storage handle found but permission is '${permission}' — needs re-authorization`);
            this._isReady = false;
            return false;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warning(`Failed to restore directory: ${message}`);
            return false;
        }
    }
    /**
     * Request readwrite permission on a previously stored handle.
     * MUST be called from a user gesture (button click handler).
     *
     * @returns true if permission was granted
     */
    async requestAccess() {
        if (!this.dirHandle) {
            logger.warning('No directory handle to request access for');
            return false;
        }
        try {
            const permission = await this.dirHandle.requestPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
                this._isReady = true;
                logger.info(`Local storage re-authorized: ${this.dirHandle.name}`);
                return true;
            }
            logger.debug(`Permission request result: ${permission}`);
            return false;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warning(`Permission request failed: ${message}`);
            return false;
        }
    }
    // -------------------------------------------------------------------------
    // Model Operations
    // -------------------------------------------------------------------------
    /**
     * Save model data to the local filesystem.
     * Uses a per-key lock to prevent concurrent writes from corrupting files.
     * @param key - Model identifier (used as filename)
     * @param data - Model file data
     */
    async saveModel(key, data) {
        return this.withWriteLock(key, () => this._saveModelImpl(key, data));
    }
    /**
     * Save model data from a ReadableStream to the local filesystem.
     * Streams data directly to disk without buffering the entire file in memory.
     * Uses a per-key lock to prevent concurrent writes from corrupting files.
     * @param key - Model identifier (used as filename)
     * @param stream - Readable stream of model data
     */
    async saveModelFromStream(key, stream) {
        return this.withWriteLock(key, () => this._saveStreamImpl(key, stream));
    }
    async _saveModelImpl(key, data) {
        if (!this.dirHandle || !this._isReady) {
            throw new Error('LocalFileStorage not ready — call chooseDirectory() or restoreDirectory() first.');
        }
        const filename = this.sanitizeFilename(key);
        const fileHandle = await this.dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        try {
            await writable.write(data);
            await writable.close();
            logger.info(`Saved model to local storage: ${filename} (${(data.byteLength / 1024 / 1024).toFixed(1)} MB)`);
        }
        catch (err) {
            try {
                await writable.abort();
            }
            catch { /* ignore */ }
            throw err;
        }
    }
    async _saveStreamImpl(key, stream) {
        if (!this.dirHandle || !this._isReady) {
            throw new Error('LocalFileStorage not ready — call chooseDirectory() or restoreDirectory() first.');
        }
        const filename = this.sanitizeFilename(key);
        const fileHandle = await this.dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        try {
            const reader = stream.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                await writable.write(value);
            }
            await writable.close();
            logger.info(`Streamed model to local storage: ${filename}`);
        }
        catch (err) {
            try {
                await writable.abort();
            }
            catch { /* ignore */ }
            throw err;
        }
    }
    /**
     * Per-key write lock: ensures only one write operation per key at a time.
     * Concurrent calls for the same key will be serialized.
     */
    async withWriteLock(key, fn) {
        const prev = this.writeLocks.get(key) ?? Promise.resolve();
        const next = prev.then(fn, fn); // chain even if previous rejected
        this.writeLocks.set(key, next);
        try {
            await next;
        }
        finally {
            // Clean up lock if this was the last write in the chain
            if (this.writeLocks.get(key) === next) {
                this.writeLocks.delete(key);
            }
        }
    }
    /**
     * Load model data from the local filesystem.
     * @param key - Model identifier
     * @returns Model data, or null if not found
     */
    async loadModel(key) {
        if (!this.dirHandle || !this._isReady)
            return null;
        try {
            const filename = this.sanitizeFilename(key);
            const fileHandle = await this.dirHandle.getFileHandle(filename);
            const file = await fileHandle.getFile();
            logger.info(`Loaded model from local storage: ${filename} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
            return await file.arrayBuffer();
        }
        catch {
            return null; // File not found
        }
    }
    /**
     * Load model data from the local filesystem as a ReadableStream.
     * @param key - Model identifier
     * @returns Readable stream of the model data, or null if not found
     */
    async loadModelStream(key) {
        if (!this.dirHandle || !this._isReady)
            return null;
        try {
            const filename = this.sanitizeFilename(key);
            const fileHandle = await this.dirHandle.getFileHandle(filename);
            const file = await fileHandle.getFile();
            logger.info(`Loading model stream from local storage: ${filename} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
            return file.stream();
        }
        catch {
            return null; // File not found
        }
    }
    /**
     * Get the File object for a model without reading into memory.
     * Enables streaming / mounting for locally stored files.
     * @param key - Model identifier
     */
    async loadModelFile(key) {
        if (!this.dirHandle || !this._isReady)
            return null;
        try {
            const filename = this.sanitizeFilename(key);
            const fileHandle = await this.dirHandle.getFileHandle(filename);
            return await fileHandle.getFile();
        }
        catch {
            return null;
        }
    }
    /**
     * Check if a model file exists in local storage.
     * @param key - Model identifier
     */
    async hasModel(key) {
        if (!this.dirHandle || !this._isReady)
            return false;
        try {
            const filename = this.sanitizeFilename(key);
            await this.dirHandle.getFileHandle(filename);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Delete a model file from local storage.
     * @param key - Model identifier
     */
    async deleteModel(key) {
        if (!this.dirHandle || !this._isReady)
            return;
        try {
            const filename = this.sanitizeFilename(key);
            await this.dirHandle.removeEntry(filename);
            logger.info(`Deleted model from local storage: ${filename}`);
        }
        catch {
            // File doesn't exist
        }
    }
    /**
     * Get file size without reading into memory.
     * @param key - Model identifier
     */
    async getFileSize(key) {
        if (!this.dirHandle || !this._isReady)
            return null;
        try {
            const filename = this.sanitizeFilename(key);
            const fileHandle = await this.dirHandle.getFileHandle(filename);
            const file = await fileHandle.getFile();
            return file.size;
        }
        catch {
            return null;
        }
    }
    /**
     * List all model files in the directory.
     */
    async listModels() {
        if (!this.dirHandle || !this._isReady)
            return [];
        const models = [];
        for await (const [name, handle] of this.dirHandle.entries()) {
            if (handle.kind === 'file') {
                const file = await handle.getFile();
                models.push({
                    id: name,
                    sizeBytes: file.size,
                    lastModified: file.lastModified,
                });
            }
        }
        return models;
    }
    // -------------------------------------------------------------------------
    // IndexedDB Handle Persistence
    // -------------------------------------------------------------------------
    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async storeHandle(handle) {
        try {
            const db = await this.openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
            await new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
            db.close();
            logger.debug('Directory handle stored in IndexedDB');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warning(`Failed to store handle in IndexedDB: ${message}`);
        }
    }
    async retrieveHandle() {
        try {
            const db = await this.openDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const handle = await new Promise((resolve, reject) => {
                const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
                req.onsuccess = () => resolve(req.result ?? null);
                req.onerror = () => reject(req.error);
            });
            db.close();
            return handle;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warning(`Failed to retrieve handle from IndexedDB: ${message}`);
            return null;
        }
    }
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    /**
     * Sanitize a key for use as a filename.
     * Keeps alphanumeric, dots, dashes, underscores. Replaces everything else.
     */
    sanitizeFilename(key) {
        return key.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
    }
}
//# sourceMappingURL=LocalFileStorage.js.map