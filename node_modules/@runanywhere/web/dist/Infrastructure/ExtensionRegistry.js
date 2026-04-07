/**
 * Extension Registry - Manages SDK extension lifecycle
 *
 * Provides a centralised registry so that RunAnywhere.shutdown() does not
 * need to hard-code every extension cleanup call.  Extensions are registered
 * during SDK initialisation and cleaned up in reverse order on shutdown.
 */
// ---------------------------------------------------------------------------
// Extension Registry Singleton
// ---------------------------------------------------------------------------
class ExtensionRegistryImpl {
    extensions = [];
    /** Register an extension. Call in dependency order (low-level first). */
    register(extension) {
        // Avoid double-registration (e.g. if initialize() is called twice)
        if (!this.extensions.includes(extension)) {
            this.extensions.push(extension);
        }
    }
    /**
     * Cleanup all registered extensions in reverse registration order.
     * Each cleanup is individually wrapped in try-catch so one failure
     * does not prevent the rest from being cleaned up.
     */
    cleanupAll() {
        for (let i = this.extensions.length - 1; i >= 0; i--) {
            try {
                this.extensions[i].cleanup();
            }
            catch {
                // Ignore errors during shutdown
            }
        }
    }
    /** Reset the registry (call after full shutdown). */
    reset() {
        this.extensions = [];
    }
}
export const ExtensionRegistry = new ExtensionRegistryImpl();
//# sourceMappingURL=ExtensionRegistry.js.map