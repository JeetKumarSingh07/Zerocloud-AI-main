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
import { SDKLogger } from '../Foundation/SDKLogger';
import { SDKError, SDKErrorCode } from '../Foundation/ErrorTypes';
import { SDKEnvironment } from '../types/enums';
const logger = new SDKLogger('HTTPService');
const SDK_CLIENT = 'RunAnywhereSDK';
const SDK_PLATFORM = 'web';
const SDK_VERSION = '0.1.0-beta.8';
const DEFAULT_TIMEOUT_MS = 30000;
const DEVICE_ID_KEY = 'rac_device_id';
const TELEMETRY_TABLE = 'rest/v1/telemetry_events';
/**
 * HTTPService - Centralized HTTP transport layer for the Web SDK.
 *
 * Environment-aware routing:
 * - Development: Supabase credentials compiled into WASM (rac_dev_config_*)
 * - Staging/Production: Railway backend with API key
 */
export class HTTPService {
    static _instance = null;
    static get shared() {
        if (!HTTPService._instance) {
            HTTPService._instance = new HTTPService();
        }
        return HTTPService._instance;
    }
    baseURL = '';
    apiKey = '';
    environment = SDKEnvironment.Production;
    accessToken = null;
    timeoutMs = DEFAULT_TIMEOUT_MS;
    supabaseURL = '';
    supabaseKey = '';
    constructor() { }
    get defaultHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-SDK-Client': SDK_CLIENT,
            'X-SDK-Version': SDK_VERSION,
            'X-Platform': SDK_PLATFORM,
        };
    }
    // ---------------------------------------------------------------------------
    // Telemetry helpers
    // ---------------------------------------------------------------------------
    /**
     * @deprecated Use `AnalyticsEmitter` instead.  All telemetry now routes
     * through the C++ telemetry manager via `rac_analytics_emit_*()`.
     * Kept as a fallback for edge cases where C++ is unavailable.
     */
    postTelemetryEvent(partialPayload) {
        if (!this.isConfigured)
            return;
        const payload = {
            sdk_event_id: crypto.randomUUID(),
            event_timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            device_id: this.getOrCreateDeviceId(),
            platform: SDK_PLATFORM,
            sdk_version: SDK_VERSION,
            ...partialPayload,
        };
        const url = this.buildFullURL(TELEMETRY_TABLE);
        const headers = this.buildHeaders(false);
        this.executeRequest('POST', url, headers, [payload]).catch(() => { });
    }
    /**
     * Returns the persistent device UUID, creating one if it doesn't exist.
     * Mirrors getOrCreateDeviceId() in TelemetryService.ts.
     */
    getOrCreateDeviceId() {
        try {
            const existing = localStorage.getItem(DEVICE_ID_KEY);
            if (existing)
                return existing;
            const id = crypto.randomUUID();
            localStorage.setItem(DEVICE_ID_KEY, id);
            return id;
        }
        catch {
            return crypto.randomUUID();
        }
    }
    // ---------------------------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------------------------
    configure(config) {
        this.baseURL = config.baseURL;
        this.apiKey = config.apiKey;
        this.environment = config.environment;
        this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        logger.info(`Configured for ${config.environment} environment`);
    }
    /**
     * Configure development mode using Supabase credentials.
     * Called during WASM init using credentials read from rac_dev_config_*.
     */
    configureDev(config) {
        this.supabaseURL = config.supabaseURL;
        this.supabaseKey = config.supabaseKey;
        this.environment = SDKEnvironment.Development;
        logger.info('Development mode configured with Supabase');
    }
    setToken(token) {
        this.accessToken = token;
    }
    clearToken() {
        this.accessToken = null;
    }
    get isConfigured() {
        if (this.environment === SDKEnvironment.Development) {
            return !!this.supabaseURL;
        }
        return !!this.baseURL && !!this.apiKey;
    }
    get currentBaseURL() {
        if (this.environment === SDKEnvironment.Development && this.supabaseURL) {
            return this.supabaseURL;
        }
        return this.baseURL;
    }
    // ---------------------------------------------------------------------------
    // HTTP Methods
    // ---------------------------------------------------------------------------
    async post(path, data) {
        let url = this.buildFullURL(path);
        const isDeviceReg = this.isDeviceRegistrationPath(path);
        const headers = this.buildHeaders(isDeviceReg);
        if (isDeviceReg && this.environment === SDKEnvironment.Development) {
            const separator = url.includes('?') ? '&' : '?';
            url = `${url}${separator}on_conflict=device_id`;
        }
        const response = await this.executeRequest('POST', url, headers, data);
        if (isDeviceReg && response.status === 409) {
            logger.info('Device already registered (409) — treating as success');
            return this.parseResponse(response);
        }
        return this.handleResponse(response, path);
    }
    async get(path) {
        const url = this.buildFullURL(path);
        const headers = this.buildHeaders(false);
        const response = await this.executeRequest('GET', url, headers);
        return this.handleResponse(response, path);
    }
    async delete(path) {
        const url = this.buildFullURL(path);
        const headers = this.buildHeaders(false);
        const response = await this.executeRequest('DELETE', url, headers);
        return this.handleResponse(response, path);
    }
    // ---------------------------------------------------------------------------
    // Private
    // ---------------------------------------------------------------------------
    async executeRequest(method, url, headers, data) {
        logger.debug(`${method} ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const options = { method, headers, signal: controller.signal };
            if (data !== undefined && method !== 'GET') {
                options.body = JSON.stringify(data);
            }
            return await fetch(url, options);
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    buildHeaders(isDeviceRegistration) {
        const headers = { ...this.defaultHeaders };
        if (this.environment === SDKEnvironment.Development) {
            if (this.supabaseKey) {
                headers['apikey'] = this.supabaseKey;
                headers['Authorization'] = `Bearer ${this.supabaseKey}`;
                headers['Prefer'] = isDeviceRegistration ? 'resolution=merge-duplicates' : 'return=representation';
            }
        }
        else {
            const token = this.accessToken || this.apiKey;
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return headers;
    }
    buildFullURL(path) {
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        const base = this.currentBaseURL.replace(/\/$/, '');
        const endpoint = path.startsWith('/') ? path : `/${path}`;
        return `${base}${endpoint}`;
    }
    isDeviceRegistrationPath(path) {
        return path.includes('sdk_devices') || path.includes('devices/register') || path.includes('rest/v1/sdk_devices');
    }
    async parseResponse(response) {
        const text = await response.text();
        if (!text)
            return {};
        try {
            return JSON.parse(text);
        }
        catch {
            return text;
        }
    }
    async handleResponse(response, path) {
        if (response.ok) {
            return this.parseResponse(response);
        }
        let errorMessage = `HTTP ${response.status}`;
        try {
            const errorData = (await response.json());
            errorMessage = errorData.message || errorData.error || errorMessage;
        }
        catch {
            // ignore
        }
        // Telemetry failures are non-critical — log at debug level only
        if (path.includes('telemetry')) {
            logger.debug(`HTTP ${response.status}: ${path}`);
        }
        else {
            logger.error(`HTTP ${response.status}: ${path}`);
        }
        throw this.mapHttpError(response.status, errorMessage);
    }
    mapHttpError(status, message) {
        switch (status) {
            case 401:
            case 403:
                return new SDKError(SDKErrorCode.AuthenticationFailed, message);
            case 408:
            case 429:
                return new SDKError(SDKErrorCode.NetworkTimeout, message);
            default:
                return new SDKError(SDKErrorCode.NetworkError, `HTTP ${status}: ${message}`);
        }
    }
}
//# sourceMappingURL=HTTPService.js.map