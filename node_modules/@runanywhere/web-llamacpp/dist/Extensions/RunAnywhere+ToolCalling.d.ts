/**
 * RunAnywhere Web SDK - Tool Calling Extension
 *
 * Adds tool calling (function calling) capabilities to LLM generation.
 * The LLM can request external actions (API calls, calculations, etc.)
 * and the SDK orchestrates the generate -> parse -> execute -> loop cycle.
 *
 * Architecture:
 *   - C++ (rac_tool_calling.h): ALL parsing, prompt formatting, JSON handling
 *   - This file: Tool registry, executor storage, orchestration
 *
 * Mirrors: sdk/runanywhere-swift/Sources/RunAnywhere/Public/Extensions/LLM/
 *
 * Usage:
 *   import { ToolCalling } from '@runanywhere/web';
 *
 *   ToolCalling.registerTool(
 *     { name: 'get_weather', description: 'Gets weather', parameters: [...] },
 *     async (args) => ({ temperature: '72F', condition: 'Sunny' })
 *   );
 *
 *   const result = await ToolCalling.generateWithTools('What is the weather?');
 *   console.log(result.text);
 */
import { type ToolValue, type ToolDefinition, type ToolCall, type ToolResult, type ToolCallingOptions, type ToolCallingResult, type ToolExecutor } from './ToolCallingTypes';
export { ToolCallFormat, type ToolValue, type ToolParameterType, type ToolParameter, type ToolDefinition, type ToolCall, type ToolResult, type ToolCallingOptions, type ToolCallingResult, type ToolExecutor, } from './ToolCallingTypes';
/** Create a ToolValue from a plain JS value. */
export declare function toToolValue(val: unknown): ToolValue;
/** Convert a ToolValue to a plain JS value. */
export declare function fromToolValue(tv: ToolValue): unknown;
/** Get a string argument from tool call args. */
export declare function getStringArg(args: Record<string, ToolValue>, key: string): string | undefined;
/** Get a number argument from tool call args. */
export declare function getNumberArg(args: Record<string, ToolValue>, key: string): number | undefined;
declare class ToolCallingImpl {
    readonly extensionName = "ToolCalling";
    private toolRegistry;
    /**
     * Register a tool that the LLM can use.
     *
     * @param definition - Tool definition (name, description, parameters)
     * @param executor - Async function that executes the tool
     */
    registerTool(definition: ToolDefinition, executor: ToolExecutor): void;
    /**
     * Unregister a tool by name.
     */
    unregisterTool(name: string): void;
    /**
     * Get all registered tool definitions.
     */
    getRegisteredTools(): ToolDefinition[];
    /**
     * Clear all registered tools.
     */
    clearTools(): void;
    /**
     * Execute a tool call by looking up the registered executor.
     */
    executeTool(toolCall: ToolCall): Promise<ToolResult>;
    /**
     * Generate a response with tool calling support.
     *
     * Orchestrates: generate -> parse -> execute -> loop
     *
     * @param prompt - The user's prompt
     * @param options - Tool calling options
     * @returns Result with final text, all tool calls, and their results
     */
    generateWithTools(prompt: string, options?: ToolCallingOptions): Promise<ToolCallingResult>;
    /**
     * Clean up the tool calling extension (clears all registered tools).
     */
    cleanup(): void;
    /**
     * Continue generation after manual tool execution.
     * Use when autoExecute is false.
     */
    continueWithToolResult(previousPrompt: string, toolCall: ToolCall, toolResult: ToolResult, options?: ToolCallingOptions): Promise<ToolCallingResult>;
}
export declare const ToolCalling: ToolCallingImpl;
//# sourceMappingURL=RunAnywhere+ToolCalling.d.ts.map