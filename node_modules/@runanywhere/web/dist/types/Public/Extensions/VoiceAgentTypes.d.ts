/** RunAnywhere Web SDK - VoiceAgent Types */
export declare enum PipelineState {
    Idle = "idle",
    Listening = "listening",
    ProcessingSTT = "processingSTT",
    GeneratingResponse = "generatingResponse",
    PlayingTTS = "playingTTS",
    Cooldown = "cooldown",
    Error = "error"
}
export interface VoiceAgentModels {
    stt?: {
        path: string;
        id: string;
        name?: string;
    };
    llm?: {
        path: string;
        id: string;
        name?: string;
    };
    tts?: {
        path: string;
        id: string;
        name?: string;
    };
}
export interface VoiceTurnResult {
    speechDetected: boolean;
    transcription?: string;
    response?: string;
    synthesizedAudio?: Float32Array;
}
export interface VoiceAgentEventData {
    type: 'transcription' | 'response' | 'audioSynthesized' | 'vadTriggered' | 'error';
    text?: string;
    audioData?: Float32Array;
    speechActive?: boolean;
    errorCode?: number;
}
export type VoiceAgentEventCallback = (event: VoiceAgentEventData) => void;
//# sourceMappingURL=VoiceAgentTypes.d.ts.map