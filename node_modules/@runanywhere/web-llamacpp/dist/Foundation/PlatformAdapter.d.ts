/**
 * RunAnywhere Web SDK - Platform Adapter
 *
 * Implements rac_platform_adapter_t callbacks using browser Web APIs.
 * This is the web equivalent of:
 *   - SwiftPlatformAdapter (iOS)
 *   - KotlinPlatformAdapter (Android/JVM)
 *   - DartPlatformAdapter (Flutter)
 *
 * Each callback is registered as a C function pointer via Emscripten's
 * Module.addFunction(), then written into the rac_platform_adapter_t
 * struct in WASM memory.
 */
/**
 * PlatformAdapter - Bridges browser Web APIs to RACommons C callbacks.
 *
 * The rac_platform_adapter_t struct is a collection of C function pointers.
 * JavaScript provides implementations via Emscripten's addFunction(),
 * which creates callable C function pointers from JS closures.
 */
export declare class PlatformAdapter {
    private callbacks;
    private adapterPtr;
    /**
     * Create and register the platform adapter with RACommons.
     * Must be called after WASM module is loaded but before rac_init().
     */
    register(): void;
    /**
     * Get the WASM pointer to the adapter struct.
     * Used by RunAnywhere.initialize() to populate rac_config_t.
     */
    getAdapterPtr(): number;
    /**
     * Clean up allocated callbacks and memory.
     */
    cleanup(): void;
    /** file_exists: rac_bool_t (*)(const char* path, void* user_data) */
    private registerFileExists;
    /** file_read: rac_result_t (*)(const char* path, void** out_data, size_t* out_size, void* user_data) */
    private registerFileRead;
    /** file_write: rac_result_t (*)(const char* path, const void* data, size_t size, void* user_data) */
    private registerFileWrite;
    /** file_delete: rac_result_t (*)(const char* path, void* user_data) */
    private registerFileDelete;
    /**
     * secure_get: rac_result_t (*)(const char* key, char** out_value, void* user_data)
     *
     * SECURITY NOTE: On web, "secure" storage uses localStorage which is NOT
     * truly secure. Data is accessible to any script running on the same origin
     * (including XSS attacks). Do NOT store sensitive secrets (API keys, tokens,
     * PII) here. On native platforms (iOS/Android) the equivalent callback uses
     * Keychain / KeyStore which are hardware-backed and encrypted.
     *
     * For the web platform this is intentionally best-effort: the RACommons C
     * layer only uses it for non-sensitive SDK state (e.g. cached environment).
     */
    private registerSecureGet;
    /**
     * secure_set: rac_result_t (*)(const char* key, const char* value, void* user_data)
     *
     * SECURITY NOTE: See registerSecureGet — localStorage is NOT secure on web.
     * Do not use for sensitive data.
     */
    private registerSecureSet;
    /**
     * secure_delete: rac_result_t (*)(const char* key, void* user_data)
     *
     * SECURITY NOTE: See registerSecureGet — localStorage is NOT secure on web.
     */
    private registerSecureDelete;
    /** log: void (*)(rac_log_level_t level, const char* category, const char* message, void* user_data) */
    private registerLog;
    /** now_ms: int64_t (*)(void* user_data) */
    private registerNowMs;
    /** get_memory_info: rac_result_t (*)(rac_memory_info_t* out_info, void* user_data) */
    private registerGetMemoryInfo;
    /**
     * http_download: rac_result_t (*)(const char* url, const char* dest_path,
     *   progress_cb, complete_cb, void* cb_user_data, char** out_task_id, void* user_data)
     * Note: 7 params in C
     */
    private registerHttpDownload;
    /**
     * extract_archive: rac_result_t (*)(const char* archive_path, const char* dest_dir,
     *   progress_cb, void* cb_user_data, void* user_data)
     * Note: 5 params in C
     */
    private registerExtractArchive;
    /**
     * Perform an HTTP download using fetch() and stream to Emscripten FS.
     */
    private performDownload;
}
declare module './LlamaCppBridge' {
    interface LlamaCppModule {
        dynCall: (sig: string, ptr: number, args: number[]) => unknown;
        FS: {
            analyzePath: (path: string) => {
                exists: boolean;
            };
            readFile: (path: string) => Uint8Array;
            writeFile: (path: string, data: Uint8Array) => void;
            unlink: (path: string) => void;
            mkdir: (path: string) => void;
        };
    }
}
//# sourceMappingURL=PlatformAdapter.d.ts.map