/**
 * RunAnywhere Web SDK - Sherpa-ONNX Helper Loader
 *
 * Loads sherpa-onnx CJS wrapper files (sherpa-onnx-asr.js, -tts.js, -vad.js)
 * at runtime via Blob URLs so they work in ESM strict mode without build-time
 * patching.
 *
 * The upstream files have two ESM incompatibilities:
 *   1. No `export` statements (CJS only)
 *   2. Implicit globals (`offset = 0` without `var`/`let`)
 *
 * This loader fixes both in-memory before importing:
 *   - Prepends `var offset;` to pre-declare the implicit global
 *   - Appends `export { ... };` if not already present
 *   - Creates a Blob URL and `import()`s it as an ES module
 *
 * Results are cached per file so subsequent calls return instantly.
 *
 * This mirrors the same runtime-loading pattern used by SherpaONNXBridge
 * for sherpa-onnx-glue.js (see SherpaONNXBridge._doLoad).
 */
import type { SherpaONNXModule } from './SherpaONNXBridge';
/** Opaque config struct handle returned by sherpa-onnx init*Config() helpers. */
export interface SherpaConfigHandle {
    ptr: number;
    [key: string]: unknown;
}
/** ASR (Speech-to-Text) helpers from sherpa-onnx-asr.js */
export interface SherpaASRHelpers {
    freeConfig: (config: SherpaConfigHandle, module: SherpaONNXModule) => void;
    initSherpaOnnxOfflineRecognizerConfig: (config: object, module: SherpaONNXModule) => SherpaConfigHandle;
    initSherpaOnnxOnlineRecognizerConfig: (config: object, module: SherpaONNXModule) => SherpaConfigHandle;
}
/** TTS (Text-to-Speech) helpers from sherpa-onnx-tts.js */
export interface SherpaTTSHelpers {
    freeConfig: (config: SherpaConfigHandle, module: SherpaONNXModule) => void;
    initSherpaOnnxOfflineTtsConfig: (config: object, module: SherpaONNXModule) => SherpaConfigHandle;
}
/** VAD (Voice Activity Detection) helpers from sherpa-onnx-vad.js */
export interface SherpaVADHelpers {
    freeConfig: (config: SherpaConfigHandle, module: SherpaONNXModule) => void;
    initSherpaOnnxVadModelConfig: (config: object, module: SherpaONNXModule) => SherpaConfigHandle;
}
/** Load ASR struct-packing helpers (sherpa-onnx-asr.js). */
export declare function loadASRHelpers(): Promise<SherpaASRHelpers>;
/** Load TTS struct-packing helpers (sherpa-onnx-tts.js). */
export declare function loadTTSHelpers(): Promise<SherpaTTSHelpers>;
/** Load VAD struct-packing helpers (sherpa-onnx-vad.js). */
export declare function loadVADHelpers(): Promise<SherpaVADHelpers>;
//# sourceMappingURL=SherpaHelperLoader.d.ts.map