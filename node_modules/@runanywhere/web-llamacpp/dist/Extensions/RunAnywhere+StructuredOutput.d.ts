/**
 * RunAnywhere Web SDK - Structured Output Extension
 *
 * Adds JSON-structured output capabilities for LLM generation.
 * Uses the RACommons rac_structured_output_* C API for schema-guided
 * generation and JSON extraction/validation.
 *
 * Mirrors: sdk/runanywhere-swift/Sources/RunAnywhere/Public/Extensions/StructuredOutput/
 *
 * Usage:
 *   import { StructuredOutput, TextGeneration } from '@runanywhere/web';
 *
 *   const schema = JSON.stringify({ type: 'object', properties: { name: { type: 'string' } } });
 *   const prompt = await StructuredOutput.preparePrompt('List 3 colors', schema);
 *   const result = await TextGeneration.generate(prompt);
 *   const validated = StructuredOutput.validate(result.text, schema);
 *   console.log(validated.extractedJson); // parsed JSON
 */
export interface StructuredOutputConfig {
    /** JSON Schema string */
    jsonSchema: string;
    /** Whether to include the schema in the prompt (default: true) */
    includeSchemaInPrompt?: boolean;
}
export interface StructuredOutputValidation {
    isValid: boolean;
    errorMessage?: string;
    extractedJson?: string;
}
export declare const StructuredOutput: {
    /**
     * Extract JSON from a text response (finds first complete JSON object/array).
     *
     * @param text - Raw LLM output text
     * @returns Extracted JSON string, or null if none found
     */
    extractJson(text: string): string | null;
    /**
     * Prepare a prompt with schema instructions for structured output.
     *
     * @param originalPrompt - The user's original prompt
     * @param config - Schema configuration
     * @returns Enhanced prompt with schema instructions
     */
    preparePrompt(originalPrompt: string, config: StructuredOutputConfig): string;
    /**
     * Get a system prompt that instructs the LLM to produce JSON matching a schema.
     *
     * @param jsonSchema - JSON Schema string
     * @returns System prompt string
     */
    getSystemPrompt(jsonSchema: string): string;
    /**
     * Validate LLM output against a JSON schema.
     *
     * @param text - Raw LLM output
     * @param config - Schema configuration
     * @returns Validation result with extracted JSON if valid
     */
    validate(text: string, config: StructuredOutputConfig): StructuredOutputValidation;
    /**
     * Check if text contains a complete JSON object or array.
     *
     * @param text - Text to check
     * @returns True if a complete JSON block was found
     */
    hasCompleteJson(text: string): boolean;
};
//# sourceMappingURL=RunAnywhere+StructuredOutput.d.ts.map