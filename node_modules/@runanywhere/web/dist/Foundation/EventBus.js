/**
 * RunAnywhere Web SDK - Event Bus
 *
 * Central event system matching the pattern across all SDKs.
 * Provides typed event subscription and publishing.
 */
import { SDKLogger } from './SDKLogger';
const logger = new SDKLogger('EventBus');
/**
 * EventBus - Central event system for the SDK.
 *
 * Mirrors the EventBus pattern used in Swift, Kotlin, React Native, and Flutter SDKs.
 * On web, this is a pure TypeScript implementation (no C++ bridge needed for events
 * since we subscribe to RACommons events via rac_event_subscribe and re-emit here).
 */
export class EventBus {
    static _instance = null;
    listeners = new Map();
    wildcardListeners = new Set();
    static get shared() {
        if (!EventBus._instance) {
            EventBus._instance = new EventBus();
        }
        return EventBus._instance;
    }
    /**
     * Subscribe to events of a specific type.
     * @returns Unsubscribe function
     */
    on(eventType, listener) {
        const key = eventType;
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        const set = this.listeners.get(key);
        set.add(listener);
        return () => {
            set.delete(listener);
            if (set.size === 0) {
                this.listeners.delete(key);
            }
        };
    }
    /**
     * Subscribe to ALL events (wildcard).
     * @returns Unsubscribe function
     */
    onAny(listener) {
        this.wildcardListeners.add(listener);
        return () => {
            this.wildcardListeners.delete(listener);
        };
    }
    /**
     * Subscribe to events once (auto-unsubscribe after first event).
     */
    once(eventType, listener) {
        const unsubscribe = this.on(eventType, (event) => {
            unsubscribe();
            listener(event);
        });
        return unsubscribe;
    }
    /**
     * Emit an event.
     */
    emit(eventType, category, data) {
        const key = eventType;
        const payload = (data ?? {});
        const envelope = {
            type: key,
            category,
            timestamp: Date.now(),
            data: payload,
        };
        // Notify specific listeners
        const specific = this.listeners.get(key);
        if (specific) {
            for (const listener of specific) {
                try {
                    listener(payload);
                }
                catch (error) {
                    logger.error(`Listener error for ${key}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }
        // Notify wildcard listeners
        for (const listener of this.wildcardListeners) {
            try {
                listener(envelope);
            }
            catch (error) {
                logger.error(`Wildcard listener error: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    /**
     * Remove all listeners.
     */
    removeAll() {
        this.listeners.clear();
        this.wildcardListeners.clear();
    }
    /** Reset singleton (for testing) */
    static reset() {
        if (EventBus._instance) {
            EventBus._instance.removeAll();
        }
        EventBus._instance = null;
    }
}
//# sourceMappingURL=EventBus.js.map