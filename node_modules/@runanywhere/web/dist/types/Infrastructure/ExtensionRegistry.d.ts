/**
 * Extension Registry - Manages SDK extension lifecycle
 *
 * Provides a centralised registry so that RunAnywhere.shutdown() does not
 * need to hard-code every extension cleanup call.  Extensions are registered
 * during SDK initialisation and cleaned up in reverse order on shutdown.
 */
/** Common interface that every SDK extension must implement. */
export interface SDKExtension {
    /** Human-readable name for logging / debugging. */
    readonly extensionName: string;
    /** Release all resources held by this extension. */
    cleanup(): void;
}
declare class ExtensionRegistryImpl {
    private extensions;
    /** Register an extension. Call in dependency order (low-level first). */
    register(extension: SDKExtension): void;
    /**
     * Cleanup all registered extensions in reverse registration order.
     * Each cleanup is individually wrapped in try-catch so one failure
     * does not prevent the rest from being cleaned up.
     */
    cleanupAll(): void;
    /** Reset the registry (call after full shutdown). */
    reset(): void;
}
export declare const ExtensionRegistry: ExtensionRegistryImpl;
export {};
//# sourceMappingURL=ExtensionRegistry.d.ts.map