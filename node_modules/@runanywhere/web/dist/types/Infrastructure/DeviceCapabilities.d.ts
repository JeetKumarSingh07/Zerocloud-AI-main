/**
 * RunAnywhere Web SDK - Device Capabilities
 *
 * Detects browser capabilities relevant to on-device AI inference:
 * WebGPU, SharedArrayBuffer (for pthreads), WASM SIMD, etc.
 */
import type { DeviceInfoData } from '../types/models';
import type { AccelerationMode } from '../Foundation/WASMBridge';
export interface WebCapabilities {
    /** WebGPU available and functional */
    hasWebGPU: boolean;
    /** WebGPU adapter info (if available) */
    gpuAdapterInfo?: Record<string, string>;
    /** The acceleration mode actually in use by the WASM module ('webgpu' | 'cpu'). */
    activeAcceleration: AccelerationMode;
    /** SharedArrayBuffer available (needed for pthreads/multithreaded WASM) */
    hasSharedArrayBuffer: boolean;
    /** Cross-Origin Isolation enabled (required for SharedArrayBuffer) */
    isCrossOriginIsolated: boolean;
    /** WebAssembly SIMD supported */
    hasWASMSIMD: boolean;
    /** Origin Private File System available */
    hasOPFS: boolean;
    /** Estimated device memory (GB) */
    deviceMemoryGB: number;
    /** Number of logical CPU cores */
    hardwareConcurrency: number;
    /** User agent string */
    userAgent: string;
}
/**
 * Detect all browser capabilities relevant to AI inference.
 */
export declare function detectCapabilities(): Promise<WebCapabilities>;
/**
 * Build a DeviceInfoData from detected capabilities.
 */
export declare function getDeviceInfo(): Promise<DeviceInfoData>;
//# sourceMappingURL=DeviceCapabilities.d.ts.map