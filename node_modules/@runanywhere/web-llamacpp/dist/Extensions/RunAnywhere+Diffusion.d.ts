/**
 * RunAnywhere Web SDK - Diffusion Extension
 *
 * Adds image generation capabilities using diffusion models.
 * Uses the RACommons rac_diffusion_component_* C API (same as iOS/Android).
 *
 * Mirrors: sdk/runanywhere-swift/Sources/RunAnywhere/Public/Extensions/Diffusion/
 *
 * Usage:
 *   import { Diffusion, DiffusionScheduler, DiffusionMode } from '@runanywhere/web';
 *
 *   await Diffusion.loadModel('/models/sd-v1-5', 'sd-1.5');
 *   const result = await Diffusion.generate({
 *     prompt: 'A sunset over mountains',
 *     width: 512, height: 512, steps: 28,
 *   });
 *   // result.imageData is Uint8ClampedArray RGBA
 */
import { type DiffusionGenerationOptions, type DiffusionGenerationResult } from './DiffusionTypes';
export { DiffusionScheduler, DiffusionModelVariant, DiffusionMode, type DiffusionGenerationOptions, type DiffusionGenerationResult, type DiffusionProgressCallback, } from './DiffusionTypes';
declare class DiffusionImpl {
    readonly extensionName = "Diffusion";
    private _diffusionComponentHandle;
    private requireBridge;
    private ensureDiffusionComponent;
    /**
     * Load a diffusion model.
     */
    loadModel(modelPath: string, modelId: string, modelName?: string): Promise<void>;
    /** Unload the diffusion model. */
    unloadModel(): Promise<void>;
    /** Check if a diffusion model is loaded. */
    get isModelLoaded(): boolean;
    /**
     * Generate an image from a text prompt.
     */
    generate(options: DiffusionGenerationOptions): Promise<DiffusionGenerationResult>;
    /** Cancel in-progress generation. */
    cancel(): void;
    /** Clean up the diffusion component. */
    cleanup(): void;
}
export declare const Diffusion: DiffusionImpl;
//# sourceMappingURL=RunAnywhere+Diffusion.d.ts.map