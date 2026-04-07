/**
 * RunAnywhere Web SDK - STT Types (ONNX Backend)
 *
 * Re-exports generic STT types from core and defines backend-specific
 * model configuration types for sherpa-onnx.
 */
// ---------------------------------------------------------------------------
// Backend-specific: sherpa-onnx model configurations
// ---------------------------------------------------------------------------
export var STTModelType;
(function (STTModelType) {
    STTModelType["Whisper"] = "whisper";
    STTModelType["Zipformer"] = "zipformer";
    STTModelType["Paraformer"] = "paraformer";
})(STTModelType || (STTModelType = {}));
//# sourceMappingURL=STTTypes.js.map