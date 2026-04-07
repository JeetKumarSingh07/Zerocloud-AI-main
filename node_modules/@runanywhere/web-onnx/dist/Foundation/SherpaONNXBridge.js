/**
 * RunAnywhere Web SDK - Sherpa-ONNX WASM Bridge
 *
 * Loads the sherpa-onnx WASM module (separate from RACommons) and provides
 * typed access to the sherpa-onnx C API for:
 *   - STT (Speech-to-Text) via Whisper, Zipformer, Paraformer
 *   - TTS (Text-to-Speech) via Piper/VITS
 *   - VAD (Voice Activity Detection) via Silero
 *
 * Architecture:
 *   RACommons WASM handles LLM, VLM, Embeddings (llama.cpp)
 *   Sherpa-ONNX WASM handles STT, TTS, VAD (onnxruntime)
 *
 * The sherpa-onnx module is lazy-loaded on first use of STT/TTS/VAD.
 */
import { SDKError, SDKErrorCode, SDKLogger } from '@runanywhere/web';
const logger = new SDKLogger('SherpaONNX');
// ---------------------------------------------------------------------------
// SherpaONNXBridge
// ---------------------------------------------------------------------------
/**
 * SherpaONNXBridge - Loads and manages the sherpa-onnx WASM module.
 *
 * Singleton that provides access to sherpa-onnx C API functions.
 * Lazy-loaded: only initializes when STT/TTS/VAD is first used.
 */
export class SherpaONNXBridge {
    static _instance = null;
    _module = null;
    _loaded = false;
    _loading = null;
    /**
     * Override the default URL to the sherpa-onnx-glue.js file.
     * Set this before any STT/TTS/VAD model is loaded.
     *
     * In a Vite app, resolve it like:
     * ```typescript
     * SherpaONNXBridge.shared.wasmUrl = new URL(
     *   '@runanywhere/web-onnx/wasm/sherpa/sherpa-onnx-glue.js',
     *   import.meta.url,
     * ).href;
     * ```
     */
    wasmUrl = null;
    /**
     * Override the base URL for sherpa-onnx helper files (sherpa-onnx-asr.js,
     * sherpa-onnx-tts.js, sherpa-onnx-vad.js).
     *
     * When `null` (default), this is auto-derived from `wasmUrl` after the
     * glue JS loads successfully. Set explicitly only if helper files are
     * served from a different location than the glue JS.
     *
     * Must end with a trailing `/`.
     */
    helperBaseUrl = null;
    static get shared() {
        if (!SherpaONNXBridge._instance) {
            SherpaONNXBridge._instance = new SherpaONNXBridge();
        }
        return SherpaONNXBridge._instance;
    }
    get isLoaded() {
        return this._loaded && this._module !== null;
    }
    get module() {
        if (!this._module) {
            throw new SDKError(SDKErrorCode.WASMNotLoaded, 'Sherpa-ONNX WASM not loaded. Call ensureLoaded() first.');
        }
        return this._module;
    }
    /**
     * Ensure the sherpa-onnx WASM module is loaded.
     * Safe to call multiple times -- will only load once.
     *
     * @param wasmUrl - URL/path to the sherpa-onnx glue JS file.
     *                  Defaults to wasm/sherpa/sherpa-onnx-glue.js
     */
    async ensureLoaded(wasmUrl) {
        if (this._loaded)
            return;
        // Prevent duplicate loading
        if (this._loading) {
            await this._loading;
            return;
        }
        this._loading = this._doLoad(wasmUrl);
        await this._loading;
        this._loading = null;
    }
    async _doLoad(wasmUrl) {
        logger.info('Loading Sherpa-ONNX WASM module...');
        try {
            const moduleUrl = wasmUrl ?? this.wasmUrl ?? new URL('../../wasm/sherpa/sherpa-onnx-glue.js', import.meta.url).href;
            const { default: createModule } = await import(/* @vite-ignore */ moduleUrl);
            // Derive the base URL for the .wasm binary
            const baseUrl = moduleUrl.substring(0, moduleUrl.lastIndexOf('/') + 1);
            const wasmBinaryUrl = baseUrl + 'sherpa-onnx.wasm';
            // Pre-fetch the WASM binary to avoid Emscripten's sync XHR
            // (the Node.js-targeted build uses sync fetch which fails in browsers)
            logger.info(`Fetching sherpa-onnx WASM binary from ${wasmBinaryUrl}`);
            const wasmResponse = await fetch(wasmBinaryUrl);
            if (!wasmResponse.ok) {
                throw new Error(`Failed to fetch sherpa-onnx.wasm: ${wasmResponse.status} ${wasmResponse.statusText}`);
            }
            const wasmBinary = await wasmResponse.arrayBuffer();
            logger.info(`Sherpa-ONNX WASM binary fetched: ${(wasmBinary.byteLength / 1_000_000).toFixed(1)} MB`);
            // Use instantiateWasm for async compilation (Chrome blocks sync compile for >8MB).
            //
            // The sherpa-onnx glue JS was compiled with NODERAWFS but we patched it:
            //   1. ENVIRONMENT_IS_NODE = false → forces browser code paths
            //   2. NODERAWFS mounting skipped → FS uses MEMFS
            //   3. receiveInstance patched → re-assigns Module exports after wasmExports is set
            //
            // We pass noFSInit: true to skip FS.init() (which creates /dev/stdin etc.).
            // We don't need standard streams — only file operations for staging model files.
            // This ensures initRuntime() succeeds and the ready promise resolves.
            //
            // We track a separate wasmReady promise so that if WebAssembly.instantiate
            // itself fails, we get the actual error instead of a generic timeout.
            let resolveWasm;
            let rejectWasm;
            const wasmReady = new Promise((resolve, reject) => {
                resolveWasm = resolve;
                rejectWasm = reject;
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const modOrPromise = createModule({
                noFSInit: true,
                print: (text) => logger.debug(text),
                printErr: (text) => logger.warning(text),
                wasmBinary,
                locateFile: (path) => baseUrl + path,
                instantiateWasm: (imports, receiveInstance) => {
                    WebAssembly.instantiate(wasmBinary, imports)
                        .then((result) => {
                        try {
                            receiveInstance(result.instance, result.module);
                            resolveWasm();
                        }
                        catch (err) {
                            // receiveInstance may throw if initRuntime fails (e.g. FS errors).
                            logger.warning(`receiveInstance completed with error: ${err}`);
                            resolveWasm();
                        }
                    })
                        .catch((err) => {
                        const error = err instanceof Error ? err : new Error(String(err));
                        logger.error(`WASM instantiation failed: ${error.message}`);
                        rejectWasm(error);
                    });
                    return {}; // Indicates async instantiation
                },
            });
            // Wait for WASM instantiation + receiveInstance + initRuntime to complete.
            // With Patch 6 applied, createModule returns a Promise (resolved after initRuntime).
            // wasmReady resolves first (after receiveInstance), then initRuntime fires synchronously.
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Sherpa-ONNX WASM module timed out after 30s')), 30_000);
            });
            await Promise.race([wasmReady, timeoutPromise]);
            // Resolve the module: Emscripten returns a Promise<Module> when using async WASM init.
            // Promise.resolve() is a no-op if modOrPromise is already the Module object.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mod = await Promise.resolve(modOrPromise);
            this._module = mod;
            // Verify critical exports are available (set by our patched receiveInstance)
            if (typeof mod._malloc !== 'function') {
                const available = ['_malloc', '_free', '_SherpaOnnxCreateOfflineRecognizer']
                    .map(fn => `${fn}: ${typeof mod[fn]}`)
                    .join(', ');
                throw new Error(`WASM exports not available after initialization. Available: ${available}`);
            }
            // Auto-derive helperBaseUrl so SherpaHelperLoader uses the same
            // resolved base path (fixes fetch vs import asymmetry in Vite dev).
            if (!this.helperBaseUrl) {
                this.helperBaseUrl = baseUrl;
            }
            this._loaded = true;
            logger.info('Sherpa-ONNX WASM module loaded successfully');
        }
        catch (error) {
            this._module = null;
            this._loaded = false;
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to load Sherpa-ONNX WASM: ${message}`);
            throw new SDKError(SDKErrorCode.WASMLoadFailed, `Failed to load Sherpa-ONNX WASM module: ${message}. ` +
                'Build with: ./wasm/scripts/build-sherpa-onnx.sh');
        }
    }
    // -----------------------------------------------------------------------
    // Filesystem Helpers
    // -----------------------------------------------------------------------
    /**
     * Get the Emscripten FS object from the module.
     * Handles both direct FS property and module-level helper functions.
     */
    getFS() {
        const m = this.module;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod = m;
        // First try direct FS property
        if (m.FS && typeof m.FS.mkdir === 'function') {
            return m.FS;
        }
        // Fallback: construct FS-like interface from Emscripten module-level helpers
        if (typeof mod.FS_createPath === 'function') {
            return {
                mkdir: (p) => {
                    const parent = p.substring(0, p.lastIndexOf('/')) || '/';
                    const name = p.substring(p.lastIndexOf('/') + 1);
                    mod.FS_createPath(parent, name, true, true);
                },
                writeFile: (p, data) => {
                    const dir = p.substring(0, p.lastIndexOf('/')) || '/';
                    const name = p.substring(p.lastIndexOf('/') + 1);
                    try {
                        mod.FS_unlink(p);
                    }
                    catch { /* file may not exist */ }
                    mod.FS_createDataFile(dir, name, data, true, true, true);
                },
                readFile: (p) => mod.FS_readFile(p),
                unlink: (p) => mod.FS_unlink(p),
                analyzePath: (p) => {
                    try {
                        mod.FS_readFile(p);
                        return { exists: true };
                    }
                    catch {
                        return { exists: false };
                    }
                },
            };
        }
        throw new SDKError(SDKErrorCode.WASMNotLoaded, 'Sherpa-ONNX FS not available');
    }
    /**
     * Ensure a directory exists in the sherpa-onnx Emscripten virtual FS.
     */
    ensureDir(path) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod = this.module;
        if (typeof mod.FS_createPath === 'function') {
            // Use FS_createPath which creates all intermediate directories
            mod.FS_createPath('/', path.replace(/^\//, ''), true, true);
            return;
        }
        // Fallback to FS.mkdir
        const fs = this.getFS();
        const parts = path.split('/').filter(Boolean);
        let current = '';
        for (const part of parts) {
            current += '/' + part;
            if (!fs.analyzePath(current).exists) {
                fs.mkdir(current);
            }
        }
    }
    /**
     * Write a file into the sherpa-onnx Emscripten virtual FS.
     * Used to stage model files before loading.
     *
     * Prefers FS_createDataFile over FS.writeFile for reliability —
     * the module was compiled with NODERAWFS which can leave FS.writeFile
     * in a broken state even after our browser patches.
     */
    writeFile(path, data) {
        const dir = path.substring(0, path.lastIndexOf('/'));
        if (dir)
            this.ensureDir(dir);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod = this.module;
        // Prefer FS_createDataFile — it creates the file node and writes data
        // in one shot, avoiding potential issues with FS.open / FS.write on
        // NODERAWFS-patched modules.
        if (typeof mod.FS_createDataFile === 'function') {
            const parentDir = dir || '/';
            const filename = path.substring(path.lastIndexOf('/') + 1);
            // Remove existing file first (FS_createDataFile throws if it exists)
            try {
                if (typeof mod.FS_unlink === 'function') {
                    mod.FS_unlink(path);
                }
            }
            catch {
                // File doesn't exist — that's fine
            }
            mod.FS_createDataFile(parentDir, filename, data, true, true, false);
            logger.debug(`Wrote ${data.length} bytes to sherpa FS: ${path}`);
            return;
        }
        // Fallback to FS.writeFile
        const fs = this.getFS();
        fs.writeFile(path, data);
        logger.debug(`Wrote ${data.length} bytes to sherpa FS: ${path}`);
    }
    /**
     * Download a file from a URL and write it to the sherpa-onnx FS.
     */
    async downloadAndWrite(url, fsPath, onProgress) {
        logger.info(`Downloading ${url} -> ${fsPath}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new SDKError(SDKErrorCode.NetworkError, `Failed to download ${url}: ${response.status} ${response.statusText}`);
        }
        const contentLength = Number(response.headers.get('content-length') ?? 0);
        const reader = response.body?.getReader();
        if (!reader) {
            // Fallback: read all at once
            const buffer = await response.arrayBuffer();
            this.writeFile(fsPath, new Uint8Array(buffer));
            return;
        }
        // Stream download with progress
        const chunks = [];
        let loaded = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            chunks.push(value);
            loaded += value.length;
            onProgress?.(loaded, contentLength);
        }
        // Combine chunks
        const combined = new Uint8Array(loaded);
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }
        this.writeFile(fsPath, combined);
    }
    // -----------------------------------------------------------------------
    // String Helpers
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
    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------
    shutdown() {
        this._module = null;
        this._loaded = false;
        this._loading = null;
        SherpaONNXBridge._instance = null;
        logger.info('Sherpa-ONNX bridge shut down');
    }
}
//# sourceMappingURL=SherpaONNXBridge.js.map