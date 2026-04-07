/**
 * RunAnywhere Web SDK - VLM Types (LlamaCpp Backend)
 *
 * Re-exports generic VLM types from core and adds backend-specific
 * model family enum for llama.cpp architectures.
 */
// Re-export all generic VLM types from core
export { VLMImageFormat, } from '@runanywhere/web';
/** llama.cpp-specific VLM model architecture families. */
export var VLMModelFamily;
(function (VLMModelFamily) {
    VLMModelFamily[VLMModelFamily["Auto"] = 0] = "Auto";
    VLMModelFamily[VLMModelFamily["Qwen2VL"] = 1] = "Qwen2VL";
    VLMModelFamily[VLMModelFamily["SmolVLM"] = 2] = "SmolVLM";
    VLMModelFamily[VLMModelFamily["LLaVA"] = 3] = "LLaVA";
    VLMModelFamily[VLMModelFamily["Custom"] = 99] = "Custom";
})(VLMModelFamily || (VLMModelFamily = {}));
//# sourceMappingURL=VLMTypes.js.map