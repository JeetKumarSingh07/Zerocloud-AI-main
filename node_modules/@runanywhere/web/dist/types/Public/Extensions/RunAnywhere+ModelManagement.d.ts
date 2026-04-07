/**
 * RunAnywhere Web SDK - Model Management Extension
 *
 * Handles model downloading, storage, and lifecycle in the browser.
 * Uses Fetch API for downloads and Emscripten FS for storage.
 *
 * Mirrors: sdk/runanywhere-swift/Sources/RunAnywhere/Public/Extensions/
 *          ModelManagement/RunAnywhere+ModelManagement.swift
 */
/** Download progress callback */
export type DownloadProgressCallback = (bytesDownloaded: number, totalBytes: number, progress: number) => void;
/** Model download options */
export interface ModelDownloadOptions {
    /** Override destination path (default: /models/<filename>) */
    destPath?: string;
    /** Progress callback */
    onProgress?: DownloadProgressCallback;
    /** AbortController signal for cancellation */
    signal?: AbortSignal;
}
export declare const ModelManagement: {
    /**
     * Download a model file from a URL to Emscripten FS.
     *
     * Uses Fetch API with ReadableStream for progress tracking.
     * The downloaded file is stored in the Emscripten virtual filesystem
     * and can be loaded by llama.cpp / whisper.cpp directly.
     *
     * @param url - URL to download the model from
     * @param modelId - Identifier for the model
     * @param options - Download options (progress callback, dest path, etc.)
     * @returns Local path where model was saved (in Emscripten FS)
     */
    downloadModel(url: string, modelId: string, options?: ModelDownloadOptions): Promise<string>;
    /**
     * Check if a model file exists.
     *
     * TODO: Delegate to backend-specific storage provider via ExtensionPoint.
     * Emscripten FS was removed — core is now pure TS.
     */
    isModelDownloaded(_path: string): boolean;
    /**
     * Delete a downloaded model.
     *
     * TODO: Delegate to backend-specific storage provider via ExtensionPoint.
     * Emscripten FS was removed — core is now pure TS.
     */
    deleteModel(path: string): void;
    /**
     * Get the size of a downloaded model file.
     * @returns Size in bytes, or 0 if not found
     *
     * TODO: Delegate to backend-specific storage provider via ExtensionPoint.
     */
    getModelSize(_path: string): number;
    /**
     * List all model files in the models directory.
     */
    listDownloadedModels(): string[];
};
//# sourceMappingURL=RunAnywhere+ModelManagement.d.ts.map