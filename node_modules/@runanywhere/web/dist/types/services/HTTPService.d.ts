/**
 * HTTPService.ts
 *
 * Core HTTP service for the RunAnywhere Web SDK.
 * Ported from sdk/runanywhere-react-native/packages/core/src/services/Network/HTTPService.ts
 * Adapted for browser (uses native fetch, AbortController, setTimeout globals).
 *
 * Responsibilities:
 * - Centralized HTTP transport layer for telemetry, device registration, etc.
 * - Environment-aware routing (Supabase for dev, Railway for prod/staging)
 * - Automatic header management (API key, auth tokens, SDK metadata)
 */
import { SDKEnvironment } from '../types/enums';
/**
 * HTTP Service Configuration for non-dev environments.
 */
export interface HTTPServiceConfig {
    /** Base URL for API requests */
    baseURL: string;
    /** API key for authentication */
    apiKey: string;
    /** SDK environment */
    environment: SDKEnvironment;
    /** Request timeout in milliseconds */
    timeoutMs?: number;
}
/**
 * Development (Supabase) Configuration
 */
export interface DevModeConfig {
    /** Supabase project URL */
    supabaseURL: string;
    /** Supabase anon key */
    supabaseKey: string;
}
/**
 * HTTPService - Centralized HTTP transport layer for the Web SDK.
 *
 * Environment-aware routing:
 * - Development: Supabase credentials compiled into WASM (rac_dev_config_*)
 * - Staging/Production: Railway backend with API key
 */
export declare class HTTPService {
    private static _instance;
    static get shared(): HTTPService;
    private baseURL;
    private apiKey;
    private environment;
    private accessToken;
    private timeoutMs;
    private supabaseURL;
    private supabaseKey;
    private constructor();
    private get defaultHeaders();
    /**
     * @deprecated Use `AnalyticsEmitter` instead.  All telemetry now routes
     * through the C++ telemetry manager via `rac_analytics_emit_*()`.
     * Kept as a fallback for edge cases where C++ is unavailable.
     */
    postTelemetryEvent(partialPayload: Record<string, unknown>): void;
    /**
     * Returns the persistent device UUID, creating one if it doesn't exist.
     * Mirrors getOrCreateDeviceId() in TelemetryService.ts.
     */
    getOrCreateDeviceId(): string;
    configure(config: HTTPServiceConfig): void;
    /**
     * Configure development mode using Supabase credentials.
     * Called during WASM init using credentials read from rac_dev_config_*.
     */
    configureDev(config: DevModeConfig): void;
    setToken(token: string): void;
    clearToken(): void;
    get isConfigured(): boolean;
    get currentBaseURL(): string;
    post<T = unknown, R = unknown>(path: string, data?: T): Promise<R>;
    get<R = unknown>(path: string): Promise<R>;
    delete<R = unknown>(path: string): Promise<R>;
    private executeRequest;
    private buildHeaders;
    private buildFullURL;
    private isDeviceRegistrationPath;
    private parseResponse;
    private handleResponse;
    private mapHttpError;
}
//# sourceMappingURL=HTTPService.d.ts.map