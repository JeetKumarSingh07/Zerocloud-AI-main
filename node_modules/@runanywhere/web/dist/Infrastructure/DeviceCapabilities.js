/**
 * RunAnywhere Web SDK - Device Capabilities
 *
 * Detects browser capabilities relevant to on-device AI inference:
 * WebGPU, SharedArrayBuffer (for pthreads), WASM SIMD, etc.
 */
import { SDKLogger } from '../Foundation/SDKLogger';
const logger = new SDKLogger('DeviceCapabilities');
/**
 * Detect all browser capabilities relevant to AI inference.
 */
export async function detectCapabilities() {
    const capabilities = {
        hasWebGPU: false,
        activeAcceleration: 'cpu',
        hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
        isCrossOriginIsolated: typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : false,
        hasWASMSIMD: detectWASMSIMD(),
        hasOPFS: typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage,
        deviceMemoryGB: navigator.deviceMemory ?? 4,
        hardwareConcurrency: navigator.hardwareConcurrency ?? 4,
        userAgent: navigator.userAgent,
    };
    // Detect WebGPU
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
        try {
            const gpu = navigator.gpu;
            const adapter = await gpu?.requestAdapter();
            if (adapter) {
                capabilities.hasWebGPU = true;
                try {
                    const info = await adapter.requestAdapterInfo();
                    capabilities.gpuAdapterInfo = {
                        vendor: info.vendor ?? '',
                        architecture: info.architecture ?? '',
                        description: info.description ?? '',
                    };
                }
                catch { /* adapter info not available */ }
            }
        }
        catch {
            logger.debug('WebGPU detection failed');
        }
    }
    logger.info(`Capabilities: WebGPU=${capabilities.hasWebGPU}, ` +
        `SharedArrayBuffer=${capabilities.hasSharedArrayBuffer}, ` +
        `SIMD=${capabilities.hasWASMSIMD}, ` +
        `OPFS=${capabilities.hasOPFS}, ` +
        `Memory=${capabilities.deviceMemoryGB}GB, ` +
        `Cores=${capabilities.hardwareConcurrency}`);
    if (!capabilities.isCrossOriginIsolated) {
        logger.warning('Cross-Origin Isolation is NOT enabled. SharedArrayBuffer and multi-threaded WASM ' +
            'will be unavailable. Set these HTTP headers on your server:\n' +
            '  Cross-Origin-Opener-Policy: same-origin\n' +
            '  Cross-Origin-Embedder-Policy: credentialless\n' +
            'See: https://github.com/AnywhereAI/runanywhere-sdks/tree/main/sdk/runanywhere-web#cross-origin-isolation-headers');
    }
    return capabilities;
}
/**
 * Build a DeviceInfoData from detected capabilities.
 */
export async function getDeviceInfo() {
    const caps = await detectCapabilities();
    return {
        model: 'Browser',
        name: getBrowserName(caps.userAgent),
        osVersion: getOSVersion(caps.userAgent),
        totalMemory: caps.deviceMemoryGB * 1024 * 1024 * 1024,
        architecture: 'wasm32',
        hasWebGPU: caps.hasWebGPU,
        hasSharedArrayBuffer: caps.hasSharedArrayBuffer,
    };
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function detectWASMSIMD() {
    try {
        // Check for WASM SIMD support by validating a minimal SIMD module
        const simdTest = new Uint8Array([
            0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0,
            10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11,
        ]);
        return WebAssembly.validate(simdTest);
    }
    catch {
        return false;
    }
}
function getBrowserName(ua) {
    if (ua.includes('Firefox'))
        return 'Firefox';
    if (ua.includes('Edg/'))
        return 'Edge';
    if (ua.includes('Chrome'))
        return 'Chrome';
    if (ua.includes('Safari'))
        return 'Safari';
    return 'Unknown Browser';
}
function getOSVersion(ua) {
    if (ua.includes('Windows'))
        return 'Windows';
    if (ua.includes('Mac OS X'))
        return 'macOS';
    if (ua.includes('Linux'))
        return 'Linux';
    if (ua.includes('Android'))
        return 'Android';
    if (ua.includes('iOS'))
        return 'iOS';
    return 'Unknown OS';
}
//# sourceMappingURL=DeviceCapabilities.js.map