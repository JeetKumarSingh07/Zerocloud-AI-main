/**
 * RunAnywhere Web SDK - Text Generation Extension
 *
 * Adds LLM text generation capabilities to RunAnywhere.
 * Mirrors: sdk/runanywhere-swift/Sources/RunAnywhere/Public/Extensions/LLM/
 *
 * Usage:
 *   import { RunAnywhere } from '@runanywhere/web';
 *
 *   await RunAnywhere.loadModel('tinyllama-1.1b-q4');
 *   const result = await RunAnywhere.generate('Hello!', { maxTokens: 100 });
 *   console.log(result.text);
 *
 *   // Streaming
 *   for await (const token of RunAnywhere.generateStream('Tell me a story')) {
 *     process.stdout.write(token);
 *   }
 */
import type { ModelLoadContext } from '@runanywhere/web';
import type { LLMGenerationOptions, LLMGenerationResult, LLMStreamingResult } from '@runanywhere/web';
declare class TextGenerationImpl {
    readonly extensionName = "TextGeneration";
    private _llmComponentHandle;
    private _mountedPath;
    /** Ensure the SDK is initialized and return the bridge. */
    private requireBridge;
    /** Ensure the LLM component is created. */
    private ensureLLMComponent;
    /**
     * Load an LLM model from raw data or stream via ModelLoadContext.
     * Implements LLMModelLoader interface for ModelManager integration.
     */
    loadModelFromData(ctx: ModelLoadContext): Promise<void>;
    /**
     * Load an LLM model for text generation.
     *
     * @param modelPath - Path to the model file (in Emscripten FS)
     * @param modelId - Model identifier
     * @param modelName - Human-readable model name
     */
    loadModel(modelPath: string, modelId: string, modelName?: string): Promise<void>;
    /**
     * Unload the currently loaded LLM model.
     */
    unloadModel(): Promise<void>;
    /**
     * Check if an LLM model is currently loaded.
     */
    get isModelLoaded(): boolean;
    /**
     * Generate text from a prompt (non-streaming).
     *
     * Uses `ccall` with `{async: true}` so that Emscripten's JSPI / Asyncify
     * can suspend the WASM stack for async WebGPU buffer operations. Without
     * this the blocking C function traps with `RuntimeError: unreachable` on
     * WebGPU builds because the browser event-loop cannot pump GPU command
     * buffers while the main thread is blocked in a synchronous ccall.
     *
     * @param prompt - Input text prompt
     * @param options - Generation options (temperature, maxTokens, etc.)
     * @returns Generation result with text and metrics
     */
    generate(prompt: string, options?: LLMGenerationOptions): Promise<LLMGenerationResult>;
    /**
     * Generate text with streaming (returns AsyncIterable of tokens).
     *
     * Async because the underlying C call uses `{async: true}` so Emscripten's
     * JSPI can suspend the WASM stack during WebGPU buffer operations.  On
     * CPU-only builds the result is simply an already-resolved Promise.
     *
     * @param prompt - Input text prompt
     * @param options - Generation options
     * @returns Streaming result with async token stream and final result promise
     */
    generateStream(prompt: string, options?: LLMGenerationOptions): Promise<LLMStreamingResult>;
    /**
     * Cancel any in-progress generation.
     */
    cancel(): void;
    /**
     * Clean up the LLM component (frees memory).
     */
    cleanup(): void;
}
export declare const TextGeneration: TextGenerationImpl;
export {};
//# sourceMappingURL=RunAnywhere+TextGeneration.d.ts.map