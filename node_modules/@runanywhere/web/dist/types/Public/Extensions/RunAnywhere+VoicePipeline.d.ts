/**
 * RunAnywhere Web SDK - VoicePipeline Extension
 *
 * High-level streaming voice orchestrator: STT -> LLM (streaming) -> TTS.
 *
 * Uses runtime capability lookups via ExtensionPoint, so it doesn't import
 * backend packages directly. Requires both @runanywhere/web-llamacpp and
 * @runanywhere/web-onnx to be registered.
 *
 * Usage:
 *   ```typescript
 *   import { VoicePipeline } from '@runanywhere/web';
 *
 *   const pipeline = new VoicePipeline();
 *   const result = await pipeline.processTurn(audioData, {
 *     maxTokens: 150,
 *     systemPrompt: 'You are a helpful voice assistant.',
 *   }, {
 *     onTranscription: (text) => updateUI('You said: ' + text),
 *     onResponseToken: (_tok, acc) => updateUI('Assistant: ' + acc),
 *     onSynthesisComplete: (audio, sr) => playAudio(audio, sr),
 *   });
 *   ```
 */
import { PipelineState } from './VoiceAgentTypes';
import type { VoicePipelineCallbacks, VoicePipelineOptions, VoicePipelineTurnResult } from './VoicePipelineTypes';
export { PipelineState } from './VoiceAgentTypes';
export type { VoicePipelineCallbacks, VoicePipelineOptions, VoicePipelineTurnResult, } from './VoicePipelineTypes';
export declare class VoicePipeline {
    private _cancelGeneration;
    private _state;
    get state(): PipelineState;
    processTurn(audioData: Float32Array, options?: VoicePipelineOptions, callbacks?: VoicePipelineCallbacks): Promise<VoicePipelineTurnResult>;
    cancel(): void;
    private transition;
}
//# sourceMappingURL=RunAnywhere+VoicePipeline.d.ts.map