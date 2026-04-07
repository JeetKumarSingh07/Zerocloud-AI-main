/**
 * AnalyticsEventsBridge.ts
 *
 * Bridges C++ analytics events (rac_analytics_events_set_callback) to the
 * TypeScript EventBus. Mirrors the role of TelemetryBridge.cpp in React Native.
 *
 * Responsibilities:
 * 1. Register a JS function pointer via module.addFunction() using Emscripten's
 *    dynamic function table — signature 'viii' (void, i32 type, ptr data, ptr userData)
 * 2. Call _rac_analytics_events_set_callback(callbackPtr, 0) to wire up WASM
 * 3. On each callback: read event_type + union fields from WASM memory
 * 4. Emit typed events to TypeScript EventBus
 * 5. Forward raw event+data to TelemetryService for batching
 */
import type { LlamaCppModule } from './LlamaCppBridge';
export type AnalyticsEventCallback = (eventType: number, dataPtr: number) => void;
/**
 * Registers the analytics callback with the WASM module and translates
 * C++ analytics events into TypeScript EventBus emissions.
 */
export declare class AnalyticsEventsBridge {
    private _module;
    private _callbackPtr;
    private _telemetryCallback;
    /**
     * Register this bridge with the WASM module.
     * Must be called after the module is loaded.
     */
    register(module: LlamaCppModule, telemetryCallback?: AnalyticsEventCallback): void;
    /**
     * Unregister and free the function pointer.
     */
    cleanup(): void;
    private handleEvent;
    private emitToEventBus;
    private readStringAt;
}
//# sourceMappingURL=AnalyticsEventsBridge.d.ts.map