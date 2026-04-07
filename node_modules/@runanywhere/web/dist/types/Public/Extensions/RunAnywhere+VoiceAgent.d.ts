/**
 * RunAnywhere Web SDK - VoiceAgent Extension
 *
 * Orchestrates the complete voice pipeline: VAD -> STT -> LLM -> TTS.
 * Uses the RACommons rac_voice_agent_* C API for pipeline management.
 *
 * Mirrors: sdk/runanywhere-swift/Sources/RunAnywhere/Public/Extensions/VoiceAgent/
 *
 * Usage:
 *   import { VoiceAgent } from '@runanywhere/web';
 *
 *   const agent = await VoiceAgent.create();
 *   await agent.loadModels({ stt: '/models/whisper.bin', llm: '/models/llama.gguf', tts: '/models/piper.onnx' });
 *   const result = await agent.processVoiceTurn(audioData);
 *   console.log('Transcription:', result.transcription);
 *   console.log('Response:', result.response);
 */
import type { VoiceAgentModels, VoiceTurnResult } from './VoiceAgentTypes';
export { PipelineState } from './VoiceAgentTypes';
export type { VoiceAgentModels, VoiceTurnResult, VoiceAgentEventData, VoiceAgentEventCallback } from './VoiceAgentTypes';
/**
 * VoiceAgentSession orchestrates the complete voice pipeline (VAD → STT → LLM → TTS).
 *
 * TODO: Refactor to use the ExtensionPoint/provider pattern.
 * The previous implementation called rac_voice_agent_* C functions via WASMBridge,
 * which has been removed from the core package. Each backend package (e.g.
 * @runanywhere/web-llamacpp) should register a VoiceAgent provider through
 * ExtensionPoint so that this session can delegate to it.
 */
export declare class VoiceAgentSession {
    private _handle;
    constructor(handle: number);
    /**
     * Load models for all components.
     *
     * TODO: Delegate to backend provider via ExtensionPoint.
     */
    loadModels(models: VoiceAgentModels): Promise<void>;
    /**
     * Process a complete voice turn (audio in → text response + audio out).
     *
     * TODO: Delegate to backend provider via ExtensionPoint.
     */
    processVoiceTurn(_audioData: Uint8Array): Promise<VoiceTurnResult>;
    /**
     * Check if the voice agent is ready.
     *
     * TODO: Delegate to backend provider via ExtensionPoint.
     */
    get isReady(): boolean;
    /**
     * Transcribe audio without the full pipeline.
     *
     * TODO: Delegate to backend provider via ExtensionPoint.
     */
    transcribe(_audioData: Uint8Array): Promise<string>;
    /**
     * Generate LLM response without the full pipeline.
     *
     * TODO: Delegate to backend provider via ExtensionPoint.
     */
    generateResponse(_prompt: string): Promise<string>;
    /** Get the native handle (used by backend providers). */
    get handle(): number;
    /**
     * Destroy the voice agent session.
     *
     * TODO: Delegate cleanup to backend provider via ExtensionPoint.
     */
    destroy(): void;
}
export declare const VoiceAgent: {
    /**
     * Create a standalone VoiceAgent session.
     * The agent manages its own STT, LLM, TTS, and VAD components.
     *
     * TODO: Delegate to backend provider via ExtensionPoint.
     */
    create(): Promise<VoiceAgentSession>;
};
//# sourceMappingURL=RunAnywhere+VoiceAgent.d.ts.map