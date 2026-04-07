/**
 * Model File Inference - Infer model metadata from filenames
 *
 * When a user imports a model file via picker or drag-and-drop,
 * we need to determine the model type, framework, and a human-friendly
 * name from the filename alone.
 *
 * Usage:
 *   import { inferModelFromFilename } from './ModelFileInference';
 *   const meta = inferModelFromFilename('smollm2-360m.Q8_0.gguf');
 *   // { id: 'smollm2-360m-q8_0', name: 'smollm2-360m.Q8_0', category: Language, framework: LlamaCpp }
 */
import { ModelCategory, LLMFramework } from '../types/enums';
export interface InferredModelMeta {
    /** Sanitized model ID (lowercase, no special chars). */
    id: string;
    /** Human-readable display name. */
    name: string;
    /** Inferred model category. */
    category: ModelCategory;
    /** Inferred inference framework. */
    framework: LLMFramework;
}
/**
 * Infer model metadata from a filename.
 *
 * Rules:
 * - `.gguf` -> Language model, LlamaCpp framework
 * - `.onnx` -> Depends on filename keywords (vad/tts/stt/whisper/silero)
 * - `.bin`  -> Language model, LlamaCpp framework (generic)
 * - Other   -> Language model, LlamaCpp framework (best guess)
 */
export declare function inferModelFromFilename(filename: string): InferredModelMeta;
/**
 * Sanitize a filename into a valid model ID.
 * Lowercase, replace non-alphanumeric with dashes, collapse multiples.
 */
export declare function sanitizeId(name: string): string;
//# sourceMappingURL=ModelFileInference.d.ts.map