/**
 * @runanywhere/web-onnx
 *
 * ONNX backend for the RunAnywhere Web SDK.
 * Provides on-device STT (speech-to-text), TTS (text-to-speech),
 * and VAD (voice activity detection) via sherpa-onnx compiled to WASM.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { RunAnywhere } from '@runanywhere/web';
 * import { ONNX } from '@runanywhere/web-onnx';
 *
 * await RunAnywhere.initialize();
 * await ONNX.register();
 *
 * // Now STT, TTS, VAD are available
 * const result = await STT.transcribe(audioData);
 * ```
 */
export { ONNX, autoRegister } from './ONNX';
export type { ONNXRegisterOptions } from './ONNX';
export { ONNXProvider } from './ONNXProvider';
export { STT, STTModelType } from './Extensions/RunAnywhere+STT';
export type { STTModelConfig, STTWhisperFiles, STTZipformerFiles, STTParaformerFiles } from './Extensions/RunAnywhere+STT';
export { TTS } from './Extensions/RunAnywhere+TTS';
export type { TTSVoiceConfig } from './Extensions/RunAnywhere+TTS';
export { VAD } from './Extensions/RunAnywhere+VAD';
export type { VADModelConfig } from './Extensions/RunAnywhere+VAD';
export { SherpaONNXBridge } from './Foundation/SherpaONNXBridge';
//# sourceMappingURL=index.d.ts.map