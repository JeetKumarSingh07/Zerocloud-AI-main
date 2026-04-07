/**
 * LlamaCppBridge - Independent WASM module bridge for the llama.cpp backend
 *
 * Loads racommons-llamacpp.wasm (which contains rac_commons + llama.cpp)
 * as a fully independent WASM module with its own Emscripten runtime,
 * linear memory, and virtual filesystem.
 *
 * Follows the same pattern as SherpaONNXBridge in @runanywhere/web-onnx:
 *   - Singleton with lazy loading
 *   - Dynamic import of glue JS + fetch of .wasm binary
 *   - Async WebAssembly.instantiate
 *   - Own MEMFS for model files
 *   - Platform adapter registration
 *   - rac_init() + backend registration
 *
 * This module is completely independent from any core WASM — the core
 * package (@runanywhere/web) is pure TypeScript.
 */
import { SDKError, SDKErrorCode, SDKLogger, EventBus, SDKEventType, SDKEnvironment, RunAnywhere } from '@runanywhere/web';
import { getDeviceInfo } from '@runanywhere/web';
import { PlatformAdapter } from './PlatformAdapter';
import { AnalyticsEventsBridge } from './AnalyticsEventsBridge';
import { TelemetryService } from './TelemetryService';
const logger = new SDKLogger('LlamaCppBridge');
// ---------------------------------------------------------------------------
// LlamaCppBridge
// ---------------------------------------------------------------------------
export class LlamaCppBridge {
    static _instance = null;
    static _nextMountId = 0;
    _module = null;
    _loaded = false;
    _loading = null;
    _accelerationMode = 'cpu';
    _platformAdapter = null;
    _analyticsEventsBridge = null;
    _telemetryService = null;
    /** Override the default URL to the racommons-llamacpp.js glue file. */
    wasmUrl = null;
    /** Override the URL for the WebGPU variant. */
    webgpuWasmUrl = null;
    static get shared() {
        if (!LlamaCppBridge._instance) {
            LlamaCppBridge._instance = new LlamaCppBridge();
        }
        return LlamaCppBridge._instance;
    }
    get isLoaded() {
        return this._loaded && this._module !== null;
    }
    get module() {
        if (!this._module) {
            throw new SDKError(SDKErrorCode.WASMNotLoaded, 'LlamaCpp WASM not loaded. Call LlamaCPP.register() first.');
        }
        return this._module;
    }
    get accelerationMode() {
        return this._accelerationMode;
    }
    // -----------------------------------------------------------------------
    // Loading
    // -----------------------------------------------------------------------
    async ensureLoaded(acceleration = 'auto') {
        if (this._loaded)
            return;
        if (this._loading) {
            await this._loading;
            return;
        }
        this._loading = this._doLoad(acceleration);
        try {
            await this._loading;
        }
        finally {
            this._loading = null;
        }
    }
    async _doLoad(acceleration) {
        logger.info('Loading LlamaCpp WASM module...');
        try {
            // Determine acceleration mode
            const useWebGPU = acceleration === 'webgpu' ||
                (acceleration === 'auto' && await this.detectWebGPUWithJSPI());
            this._accelerationMode = useWebGPU ? 'webgpu' : 'cpu';
            // Select module URL
            const moduleUrl = useWebGPU
                ? (this.webgpuWasmUrl ?? new URL('../../wasm/racommons-llamacpp-webgpu.js', import.meta.url).href)
                : (this.wasmUrl ?? new URL('../../wasm/racommons-llamacpp.js', import.meta.url).href);
            logger.info(`Loading ${useWebGPU ? 'WebGPU' : 'CPU'} variant: ${moduleUrl}`);
            // Persist the resolved URL so VLMWorkerBridge (and others) can read it
            if (useWebGPU) {
                this.webgpuWasmUrl = moduleUrl;
            }
            this.wasmUrl = moduleUrl;
            // Dynamic import of Emscripten glue JS
            const { default: createModule } = await import(/* @vite-ignore */ moduleUrl);
            // Derive the base URL so the Emscripten glue resolves the companion
            // .wasm binary from the same directory, regardless of bundler output.
            const baseUrl = moduleUrl.substring(0, moduleUrl.lastIndexOf('/') + 1);
            // Instantiate the WASM module
            this._module = await createModule({
                print: (text) => logger.info(text),
                printErr: (text) => logger.error(text),
                locateFile: (path) => baseUrl + path,
            });
            // Verify module loaded
            const pingResult = this._module._rac_wasm_ping();
            const ping = typeof pingResult === 'object' && pingResult !== null && 'then' in pingResult
                ? await pingResult
                : pingResult;
            if (ping !== 42) {
                throw new Error(`WASM ping failed: expected 42, got ${ping}`);
            }
            // Register platform adapter (browser callbacks for logging, file ops, etc.)
            this._platformAdapter = new PlatformAdapter();
            this._platformAdapter.register();
            // Initialize RACommons core within this WASM module
            await this.initRACommons(this._platformAdapter.getAdapterPtr());
            // Register the llama.cpp backend
            await this.registerBackend();
            // Initialize analytics events bridge (subscribe to C++ events → TypeScript EventBus)
            this._analyticsEventsBridge = new AnalyticsEventsBridge();
            // Initialize telemetry service (C++ telemetry manager → browser fetch)
            this._telemetryService = TelemetryService.shared;
            const deviceInfo = await getDeviceInfo();
            const environment = RunAnywhere.environment ?? SDKEnvironment.Production;
            await this._telemetryService.initialize(this._module, environment, deviceInfo);
            // Wire analytics bridge: forwards C++ events to EventBus + TelemetryService
            this._analyticsEventsBridge.register(this._module, (eventType, dataPtr) => this._telemetryService?.trackAnalyticsEvent(eventType, dataPtr));
            this._loaded = true;
            logger.info(`LlamaCpp WASM module loaded successfully (${this._accelerationMode})`);
            EventBus.shared.emit('llamacpp.wasmLoaded', SDKEventType.Initialization, {
                accelerationMode: this._accelerationMode,
            });
        }
        catch (error) {
            // WebGPU fallback to CPU
            if (this._accelerationMode === 'webgpu' && acceleration === 'auto') {
                const reason = error instanceof Error ? error.message : String(error);
                logger.warning(`WebGPU WASM failed (${reason}), falling back to CPU`);
                this._module = null;
                this._loaded = false;
                this._accelerationMode = 'cpu';
                return this._doLoad('cpu');
            }
            this._module = null;
            this._loaded = false;
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to load LlamaCpp WASM: ${message}`);
            throw new SDKError(SDKErrorCode.WASMLoadFailed, `Failed to load LlamaCpp WASM module: ${message}`);
        }
    }
    async initRACommons(adapterPtr) {
        const m = this._module;
        // Create rac_config_t
        const configSize = m._rac_wasm_sizeof_config();
        const configPtr = m._malloc(configSize);
        for (let i = 0; i < configSize; i++) {
            m.setValue(configPtr + i, 0, 'i8');
        }
        // Set platform_adapter pointer (offset 0)
        m.setValue(configPtr, adapterPtr, '*');
        // Set log_level (offset queried at runtime)
        const logLevelOffset = this.wasmOffsetOf('config_log_level');
        m.setValue(configPtr + logLevelOffset, 2, 'i32'); // INFO level
        const result = await m.ccall('rac_init', 'number', ['number'], [configPtr], { async: true });
        m._free(configPtr);
        if (result !== 0) {
            const errMsg = this.readString(m._rac_error_message(result));
            throw new Error(`rac_init failed in LlamaCpp module: ${errMsg}`);
        }
        logger.info('RACommons initialized within LlamaCpp WASM module');
    }
    async registerBackend() {
        const m = this._module;
        if (typeof m._rac_backend_llamacpp_register === 'function') {
            const result = await m.ccall('rac_backend_llamacpp_register', 'number', [], [], { async: true });
            if (result === 0) {
                logger.info('llama.cpp C++ backend registered');
            }
            else {
                logger.warning(`llama.cpp backend registration returned: ${result}`);
            }
        }
        if (typeof m._rac_backend_llamacpp_vlm_register === 'function') {
            const result = await m.ccall('rac_backend_llamacpp_vlm_register', 'number', [], [], { async: true });
            if (result === 0) {
                logger.info('llama.cpp VLM backend registered');
            }
        }
    }
    // -----------------------------------------------------------------------
    // Filesystem (model files written to this module's MEMFS)
    // -----------------------------------------------------------------------
    /**
     * Write a model file to this WASM module's Emscripten virtual filesystem.
     */
    writeFile(path, data) {
        const m = this.module;
        const dir = path.substring(0, path.lastIndexOf('/'));
        if (dir && typeof m.FS_createPath === 'function') {
            m.FS_createPath('/', dir.replace(/^\//, ''), true, true);
        }
        if (typeof m.FS_createDataFile === 'function') {
            const parentDir = dir || '/';
            const filename = path.substring(path.lastIndexOf('/') + 1);
            try {
                m.FS_unlink?.(path);
            }
            catch { /* doesn't exist */ }
            m.FS_createDataFile(parentDir, filename, data, true, true, true);
            logger.debug(`Wrote ${data.length} bytes to LlamaCpp FS: ${path}`);
        }
    }
    /**
     * Write a model from a ReadableStream to this WASM module's Emscripten virtual filesystem.
     * Useful for loading models without buffering the entire file in JS memory.
     */
    async writeFileStream(path, stream) {
        const m = this.module;
        const FS = m.FS;
        if (!FS)
            throw new Error('Emscripten FS not available on module');
        const dir = path.substring(0, path.lastIndexOf('/'));
        if (dir && typeof m.FS_createPath === 'function') {
            m.FS_createPath('/', dir.replace(/^\//, ''), true, true);
        }
        try {
            FS.unlink(path);
        }
        catch { /* ignore */ }
        logger.debug(`Streaming to LlamaCpp FS: ${path}...`);
        const fileStream = FS.open(path, 'w+');
        try {
            const reader = stream.getReader();
            let totalBytes = 0;
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    FS.write(fileStream, value, 0, value.length, undefined);
                    totalBytes += value.length;
                }
                logger.debug(`Finished streaming ${totalBytes} bytes to LlamaCpp FS: ${path}`);
            }
            finally {
                reader.releaseLock();
            }
        }
        finally {
            FS.close(fileStream);
        }
    }
    /**
     * Remove a file from this WASM module's filesystem.
     */
    unlinkFile(path) {
        try {
            this.module.FS_unlink?.(path);
        }
        catch { /* doesn't exist */ }
    }
    /**
     * Mount a File object into the WASM filesystem (if WORKERFS is available).
     * Returns the path to the mounted file, or null if mounting failed/unsupported.
     *
     * @param file - The browser File object
     * @returns The absolute path to the file in WASM FS (e.g. /mnt-123/model.gguf) or null
     */
    mountFile(file) {
        const m = this.module;
        if (!m.FS_mount || !m.WORKERFS)
            return null;
        let createdMountDir = false;
        let mountDir = '';
        try {
            // Create a unique mount point directory
            const mountId = LlamaCppBridge._nextMountId++;
            mountDir = `/mnt-${mountId}`;
            if (m.FS_mkdir) {
                m.FS_mkdir(mountDir);
                createdMountDir = true;
            }
            // Mount the file. WORKERFS expects { files: [File, ...] } or { files: [{name, data: File}] }
            // We assume the standard Emscripten WORKERFS behavior where `files` array mounts them by name.
            m.FS_mount(m.WORKERFS, { files: [file] }, mountDir);
            logger.debug(`Mounted ${file.name} to ${mountDir}`);
            return `${mountDir}/${file.name}`;
        }
        catch (err) {
            if (createdMountDir && m.FS_rmdir) {
                try {
                    m.FS_rmdir(mountDir);
                }
                catch {
                    logger.warning(`Failed to clean up mount dir ${mountDir}`);
                }
            }
            const msg = err instanceof Error ? err.message : String(err);
            logger.warning(`Failed to mount file (WORKERFS): ${msg}`);
            return null;
        }
    }
    /**
     * Unmount a directory (and remove it).
     * @param mountDir - The directory path (e.g. /mnt-123)
     */
    unmount(mountPath) {
        if (!mountPath.startsWith('/mnt-'))
            return; // Safety check
        // Strip filename if present
        const parts = mountPath.split('/');
        // formatted like ["", "mnt-123", "filename"]
        let dir = mountPath;
        if (parts.length >= 3) {
            dir = `/${parts[1]}`;
        }
        try {
            const m = this.module;
            if (m.FS_unmount)
                m.FS_unmount(dir);
            if (m.FS_rmdir)
                m.FS_rmdir(dir);
            logger.debug(`Unmounted ${dir}`);
        }
        catch {
            /* ignore cleanup errors */
        }
    }
    // -----------------------------------------------------------------------
    // WebGPU Detection
    // -----------------------------------------------------------------------
    async detectWebGPUWithJSPI() {
        if (typeof navigator === 'undefined' || !('gpu' in navigator))
            return false;
        try {
            const gpu = navigator.gpu;
            const adapter = await gpu?.requestAdapter();
            if (!adapter)
                return false;
            // Also need JSPI
            return typeof WebAssembly !== 'undefined' &&
                'promising' in WebAssembly &&
                'Suspending' in WebAssembly;
        }
        catch {
            return false;
        }
    }
    // -----------------------------------------------------------------------
    // String / Memory Helpers (same as WASMBridge)
    // -----------------------------------------------------------------------
    allocString(str) {
        const m = this.module;
        const len = m.lengthBytesUTF8(str) + 1;
        const ptr = m._malloc(len);
        m.stringToUTF8(str, ptr, len);
        return ptr;
    }
    readString(ptr) {
        if (ptr === 0)
            return '';
        return this.module.UTF8ToString(ptr);
    }
    free(ptr) {
        if (ptr !== 0)
            this.module._free(ptr);
    }
    writeBytes(src, destPtr) {
        const m = this.module;
        if (m.HEAPU8) {
            m.HEAPU8.set(src, destPtr);
            return;
        }
        for (let i = 0; i < src.length; i++)
            m.setValue(destPtr + i, src[i], 'i8');
    }
    readBytes(srcPtr, length) {
        const m = this.module;
        if (m.HEAPU8)
            return m.HEAPU8.slice(srcPtr, srcPtr + length);
        const result = new Uint8Array(length);
        for (let i = 0; i < length; i++)
            result[i] = m.getValue(srcPtr + i, 'i8') & 0xFF;
        return result;
    }
    readFloat32Array(srcPtr, count) {
        const m = this.module;
        if (m.HEAPF32)
            return m.HEAPF32.slice(srcPtr >> 2, (srcPtr >> 2) + count);
        const result = new Float32Array(count);
        for (let i = 0; i < count; i++)
            result[i] = m.getValue(srcPtr + i * 4, 'float');
        return result;
    }
    writeFloat32Array(src, destPtr) {
        const m = this.module;
        if (m.HEAPF32) {
            m.HEAPF32.set(src, destPtr >> 2);
            return;
        }
        for (let i = 0; i < src.length; i++)
            m.setValue(destPtr + i * 4, src[i], 'float');
    }
    readFloat32(ptr) {
        const m = this.module;
        if (m.HEAPF32)
            return m.HEAPF32[ptr >> 2];
        return m.getValue(ptr, 'float');
    }
    checkResult(result, operation) {
        if (result !== 0) {
            const errMsgPtr = this.module._rac_error_message(result);
            const errMsg = this.readString(errMsgPtr);
            throw new SDKError(SDKErrorCode.BackendError, `${operation}: ${errMsg}`);
        }
    }
    getErrorMessage(resultCode) {
        return this.readString(this.module._rac_error_message(resultCode));
    }
    callFunction(funcName, returnType, argTypes, args, opts) {
        if (!this._module)
            throw new SDKError(SDKErrorCode.WASMNotLoaded, 'LlamaCpp WASM not loaded');
        return this._module.ccall(funcName, returnType, argTypes, args, opts);
    }
    // -----------------------------------------------------------------------
    // Offset Helpers
    // -----------------------------------------------------------------------
    wasmOffsetOf(name) {
        const fn = this.module[`_rac_wasm_offsetof_${name}`];
        return typeof fn === 'function' ? fn() : 0;
    }
    wasmSizeOf(name) {
        const fn = this.module[`_rac_wasm_sizeof_${name}`];
        return typeof fn === 'function' ? fn() : 0;
    }
    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------
    shutdown() {
        // Flush and teardown telemetry before shutting down WASM
        if (this._analyticsEventsBridge) {
            try {
                this._analyticsEventsBridge.cleanup();
            }
            catch { /* ignore */ }
            this._analyticsEventsBridge = null;
        }
        if (this._telemetryService) {
            try {
                this._telemetryService.shutdown();
            }
            catch { /* ignore */ }
            this._telemetryService = null;
        }
        if (this._module && this._loaded) {
            try {
                this._module._rac_shutdown();
            }
            catch (err) {
                logger.debug(`LlamaCpp module shutdown failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        // Clean up platform adapter
        if (this._platformAdapter) {
            try {
                this._platformAdapter.cleanup();
            }
            catch (err) {
                logger.debug(`Platform adapter cleanup failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`);
            }
            this._platformAdapter = null;
        }
        this._module = null;
        this._loaded = false;
        this._loading = null;
        this._accelerationMode = 'cpu';
        LlamaCppBridge._instance = null;
        logger.info('LlamaCpp bridge shut down');
    }
}
//# sourceMappingURL=LlamaCppBridge.js.map