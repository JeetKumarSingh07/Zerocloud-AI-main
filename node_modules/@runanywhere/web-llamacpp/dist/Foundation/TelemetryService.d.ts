/**
 * TelemetryService.ts
 *
 * Web SDK bridge to the C++ telemetry manager (rac_telemetry_manager_*).
 * Mirrors the role of TelemetryBridge.cpp in React Native.
 *
 * Architecture:
 * - Creates rac_telemetry_manager_t via WASM
 * - Registers an HTTP callback that C++ calls when events need sending
 * - The HTTP callback uses HTTPService (browser fetch) to POST to the endpoint
 * - Calls rac_telemetry_manager_http_complete() with the result
 * - Also provides AnalyticsEventCallback for forwarding events from AnalyticsEventsBridge
 *
 * Device UUID:
 * - Persisted in localStorage under 'rac_device_id'
 * - Generated with crypto.randomUUID() on first run
 */
import { SDKEnvironment } from '@runanywhere/web';
import type { DeviceInfoData } from '@runanywhere/web';
import type { LlamaCppModule } from './LlamaCppBridge';
/**
 * Returns the persistent device UUID, creating one if it doesn't exist.
 * Uses localStorage for persistence across page loads.
 */
export declare function getOrCreateDeviceId(): string;
/**
 * Manages the lifecycle of the C++ telemetry manager and bridges HTTP calls
 * to browser fetch for telemetry event batching and delivery.
 */
export declare class TelemetryService {
    private static _instance;
    static get shared(): TelemetryService;
    private _module;
    private _handle;
    private _httpCallbackPtr;
    private _initialized;
    private _initPromise;
    private constructor();
    /**
     * Initialize the telemetry manager.
     * Called from LlamaCppBridge._doLoad() after WASM is loaded.
     *
     * Concurrent calls are safe: a second caller awaits the in-flight promise
     * rather than starting a duplicate initialization, preventing duplicate
     * WASM handles and leaked function-table entries.
     */
    initialize(module: LlamaCppModule, environment: SDKEnvironment, deviceInfo: DeviceInfoData): Promise<void>;
    /**
     * Callback for AnalyticsEventsBridge — forwards raw C++ event to telemetry manager.
     */
    trackAnalyticsEvent(eventType: number, dataPtr: number): void;
    /**
     * Flush all queued telemetry events immediately.
     */
    flush(): void;
    /**
     * Flush and tear down the telemetry manager.
     */
    shutdown(): void;
    /**
     * Core initialization logic — only called once, guarded by initialize().
     */
    private _doInitialize;
    /**
     * Registers the HTTP callback with the WASM telemetry manager.
     * C++ will call this when it wants to POST a telemetry batch.
     *
     * C signature: void(void* user_data, const char* endpoint, const char* json_body,
     *                   size_t json_length, rac_bool_t requires_auth)
     * Emscripten signature: 'viiiii'
     *
     * IMPORTANT: We call http_complete SYNCHRONOUSLY (before the async fetch) to
     * prevent C++ from re-flushing the same event while awaiting the HTTP response,
     * which caused duplicate POSTs. The actual fetch continues in the background.
     */
    private registerHttpCallback;
    /**
     * Perform the actual HTTP POST for a telemetry batch.
     * Returns the response JSON string on success.
     */
    private performHttpPost;
    /**
     * Strip keys that don't exist in the V2 `telemetry_events` table.
     * Handles both array format (dev flat batch) and single-object format.
     */
    private filterForDevTable;
    private filterObject;
    /**
     * If the WASM module has dev config compiled in, use it to configure HTTPService.
     */
    private configureDevHTTP;
    private mapEnvironment;
    private allocString;
    private freeAll;
}
//# sourceMappingURL=TelemetryService.d.ts.map