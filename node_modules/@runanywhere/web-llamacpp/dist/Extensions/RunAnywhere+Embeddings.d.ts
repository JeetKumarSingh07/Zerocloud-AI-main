/**
 * RunAnywhere Web SDK - Embeddings Extension
 *
 * Adds text embedding generation capabilities via RACommons WASM.
 * Uses the rac_embeddings_component_* C API for model lifecycle
 * and embedding generation.
 *
 * Embeddings convert text into fixed-dimensional dense vectors
 * useful for semantic search, clustering, and RAG.
 *
 * Backend: llama.cpp (GGUF embedding models like nomic-embed-text)
 *
 * Usage:
 *   import { Embeddings } from '@runanywhere/web';
 *
 *   await Embeddings.loadModel('/models/nomic-embed-text-v1.5.Q4_K_M.gguf', 'nomic-embed');
 *   const result = await Embeddings.embed('Hello, world!');
 *   console.log('Dimension:', result.dimension);
 *   console.log('Vector:', result.embeddings[0].data);
 *
 *   // Batch embedding
 *   const batch = await Embeddings.embedBatch(['text1', 'text2', 'text3']);
 */
import type { EmbeddingsResult, EmbeddingsOptions } from './EmbeddingsTypes';
export { EmbeddingsNormalize, EmbeddingsPooling, type EmbeddingVector, type EmbeddingsResult, type EmbeddingsOptions, } from './EmbeddingsTypes';
declare class EmbeddingsImpl {
    readonly extensionName = "Embeddings";
    private _embeddingsComponentHandle;
    private requireBridge;
    private ensureEmbeddingsComponent;
    /**
     * Load an embedding model (GGUF format).
     */
    loadModel(modelPath: string, modelId: string, modelName?: string): Promise<void>;
    /** Unload the embeddings model. */
    unloadModel(): Promise<void>;
    /** Check if an embeddings model is loaded. */
    get isModelLoaded(): boolean;
    /**
     * Generate embedding for a single text.
     */
    embed(text: string, options?: EmbeddingsOptions): Promise<EmbeddingsResult>;
    /**
     * Generate embeddings for multiple texts at once.
     */
    embedBatch(texts: string[], options?: EmbeddingsOptions): Promise<EmbeddingsResult>;
    /**
     * Compute cosine similarity between two embedding vectors.
     * Pure TypeScript utility -- no WASM call needed.
     */
    cosineSimilarity(a: Float32Array, b: Float32Array): number;
    /** Clean up the embeddings component. */
    cleanup(): void;
}
export declare const Embeddings: EmbeddingsImpl;
//# sourceMappingURL=RunAnywhere+Embeddings.d.ts.map