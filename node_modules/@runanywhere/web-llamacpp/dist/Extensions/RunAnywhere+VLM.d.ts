/**
 * RunAnywhere Web SDK - Vision Language Model Extension
 *
 * Adds VLM capabilities for image understanding + text generation.
 * Uses the RACommons rac_vlm_component_* C API (llama.cpp mtmd backend).
 *
 * Mirrors: sdk/runanywhere-swift/Sources/RunAnywhere/Public/Extensions/VLM/
 *
 * Usage:
 *   import { VLM } from '@runanywhere/web';
 *
 *   await VLM.loadModel('/models/qwen2-vl.gguf', '/models/qwen2-vl-mmproj.gguf', 'qwen2-vl');
 *   const result = await VLM.process(imageData, 'Describe this image');
 *   console.log(result.text);
 */
import type { VLMImage, VLMGenerationOptions, VLMGenerationResult } from './VLMTypes';
export { VLMModelFamily } from './VLMTypes';
declare class VLMImpl {
    readonly extensionName = "VLM";
    private _vlmComponentHandle;
    private _vlmBackendRegistered;
    private requireBridge;
    /**
     * Ensure the llama.cpp VLM backend is registered with the service registry.
     * Must be called before creating the VLM component so it can find a provider.
     */
    private ensureVLMBackendRegistered;
    private ensureVLMComponent;
    /**
     * Load a VLM model (GGUF model + multimodal projector).
     *
     * @param modelPath - Path to the GGUF model file in WASM FS
     * @param mmprojPath - Path to the mmproj file in WASM FS
     * @param modelId - Unique model identifier
     * @param modelName - Display name (optional)
     */
    loadModel(modelPath: string, mmprojPath: string, modelId: string, modelName?: string): Promise<void>;
    /** Unload the VLM model. */
    unloadModel(): Promise<void>;
    /** Check if a VLM model is loaded. */
    get isModelLoaded(): boolean;
    /**
     * Process an image with a text prompt.
     *
     * @param image - Image input (file path, pixel data, or base64)
     * @param prompt - Text prompt describing what to do with the image
     * @param options - Generation options
     * @returns VLM generation result
     */
    process(image: VLMImage, prompt: string, options?: VLMGenerationOptions): Promise<VLMGenerationResult>;
    /** Cancel in-progress VLM generation. */
    cancel(): void;
    /** Clean up the VLM component and unregister backend. */
    cleanup(): void;
}
export declare const VLM: VLMImpl;
//# sourceMappingURL=RunAnywhere+VLM.d.ts.map