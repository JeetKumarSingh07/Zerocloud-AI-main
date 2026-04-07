/**
 * ONNX - Module facade for @runanywhere/web-onnx
 *
 * Provides a high-level API matching the React Native SDK's module pattern.
 *
 * Usage:
 *   import { ONNX } from '@runanywhere/web-onnx';
 *
 *   await ONNX.register();
 */
import { SherpaONNXBridge } from './Foundation/SherpaONNXBridge';
import { ONNXProvider } from './ONNXProvider';
const MODULE_ID = 'onnx';
export const ONNX = {
    get moduleId() {
        return MODULE_ID;
    },
    get isRegistered() {
        return ONNXProvider.isRegistered;
    },
    /**
     * Register the sherpa-onnx backend.
     * Call after `RunAnywhere.initialize()`.
     *
     * @param options - Optional WASM URL overrides.
     *                  Use `wasmUrl` / `helperBaseUrl` when the default
     *                  `import.meta.url`-based resolution doesn't work (e.g. bundled apps).
     */
    async register(options) {
        const bridge = SherpaONNXBridge.shared;
        if (options?.wasmUrl)
            bridge.wasmUrl = options.wasmUrl;
        if (options?.helperBaseUrl) {
            bridge.helperBaseUrl = options.helperBaseUrl.endsWith('/')
                ? options.helperBaseUrl
                : `${options.helperBaseUrl}/`;
        }
        return ONNXProvider.register();
    },
    unregister() {
        ONNXProvider.unregister();
    },
};
export function autoRegister() {
    ONNXProvider.register().catch(() => {
        // Silently handle registration failure during auto-registration
    });
}
//# sourceMappingURL=ONNX.js.map