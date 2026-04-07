/**
 * RunAnywhere Web SDK - VLM Types (LlamaCpp Backend)
 *
 * Re-exports generic VLM types from core and adds backend-specific
 * model family enum for llama.cpp architectures.
 */
export { VLMImageFormat, type VLMImage, type VLMGenerationOptions, type VLMGenerationResult, type VLMStreamingResult, } from '@runanywhere/web';
/** llama.cpp-specific VLM model architecture families. */
export declare enum VLMModelFamily {
    Auto = 0,
    Qwen2VL = 1,
    SmolVLM = 2,
    LLaVA = 3,
    Custom = 99
}
//# sourceMappingURL=VLMTypes.d.ts.map