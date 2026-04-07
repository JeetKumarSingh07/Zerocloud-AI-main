/**
 * RunAnywhere Web SDK - Event Bus
 *
 * Central event system matching the pattern across all SDKs.
 * Provides typed event subscription and publishing.
 */
import type { SDKEventType } from '../types/enums';
/** Generic event listener */
export type EventListener<T = unknown> = (event: T) => void;
/** Unsubscribe function returned by subscribe */
export type Unsubscribe = () => void;
/** Event envelope wrapping all emitted events */
export interface SDKEventEnvelope {
    type: string;
    category: SDKEventType;
    timestamp: number;
    data: Record<string, unknown>;
}
/** Known SDK event types and their payload shapes. */
export interface SDKEventMap {
    'sdk.initialized': {
        environment: string;
    };
    'sdk.accelerationMode': {
        mode: string;
    };
    'model.registered': {
        count: number;
    };
    'model.downloadStarted': {
        modelId: string;
        url: string;
    };
    'model.downloadProgress': {
        modelId: string;
        progress: number;
        bytesDownloaded: number;
        totalBytes: number;
        stage?: string;
    };
    'model.downloadCompleted': {
        modelId: string;
        sizeBytes?: number;
        localPath?: string;
    };
    'model.downloadFailed': {
        modelId: string;
        error: string;
    };
    'model.loadStarted': {
        modelId: string;
        component?: string;
        category?: string;
    };
    'model.loadCompleted': {
        modelId: string;
        component?: string;
        category?: string;
        loadTimeMs?: number;
    };
    'model.loadFailed': {
        modelId: string;
        error: string;
    };
    'model.unloaded': {
        modelId: string;
        category: string;
    };
    'model.quotaExceeded': {
        modelId: string;
        availableBytes: number;
        neededBytes: number;
    };
    'model.evicted': {
        modelId: string;
        modelName: string;
        freedBytes: number;
    };
    'generation.started': {
        prompt: string;
    };
    'generation.completed': {
        tokensUsed: number;
        latencyMs: number;
    };
    'generation.failed': {
        error: string;
    };
    'stt.transcribed': {
        text: string;
        confidence: number;
        audioDurationMs?: number;
        wordCount?: number;
    };
    'stt.transcriptionFailed': {
        error: string;
    };
    'tts.synthesized': {
        durationMs: number;
        sampleRate: number;
        characterCount?: number;
        processingMs?: number;
        charsPerSec?: number;
        textLength?: number;
    };
    'tts.synthesisFailed': {
        error: string;
    };
    'vad.speechStarted': {
        activity: string;
    };
    'vad.speechEnded': {
        activity: string;
        speechDurationMs?: number;
    };
    'voice.turnCompleted': {
        speechDetected: boolean;
        transcription: string;
        response: string;
    };
    'embeddings.generated': {
        numEmbeddings: number;
        dimension: number;
        processingTimeMs: number;
    };
    'diffusion.generated': {
        width: number;
        height: number;
        generationTimeMs: number;
    };
    'vlm.processed': {
        tokensPerSecond: number;
        totalTokens: number;
        hardwareUsed: string;
    };
    'playback.started': {
        durationMs: number;
        sampleRate: number;
    };
    'playback.completed': {
        durationMs: number;
    };
    [key: string]: Record<string, unknown>;
}
/**
 * EventBus - Central event system for the SDK.
 *
 * Mirrors the EventBus pattern used in Swift, Kotlin, React Native, and Flutter SDKs.
 * On web, this is a pure TypeScript implementation (no C++ bridge needed for events
 * since we subscribe to RACommons events via rac_event_subscribe and re-emit here).
 */
export declare class EventBus {
    private static _instance;
    private listeners;
    private wildcardListeners;
    static get shared(): EventBus;
    /**
     * Subscribe to events of a specific type.
     * @returns Unsubscribe function
     */
    on<K extends keyof SDKEventMap>(eventType: K, listener: EventListener<SDKEventMap[K]>): Unsubscribe;
    /**
     * Subscribe to ALL events (wildcard).
     * @returns Unsubscribe function
     */
    onAny(listener: EventListener<SDKEventEnvelope>): Unsubscribe;
    /**
     * Subscribe to events once (auto-unsubscribe after first event).
     */
    once<K extends keyof SDKEventMap>(eventType: K, listener: EventListener<SDKEventMap[K]>): Unsubscribe;
    /**
     * Emit an event.
     */
    emit<K extends keyof SDKEventMap>(eventType: K, category: SDKEventType, data?: SDKEventMap[K]): void;
    /**
     * Remove all listeners.
     */
    removeAll(): void;
    /** Reset singleton (for testing) */
    static reset(): void;
}
//# sourceMappingURL=EventBus.d.ts.map