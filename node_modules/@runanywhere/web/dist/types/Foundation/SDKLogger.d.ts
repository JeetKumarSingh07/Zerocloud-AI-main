/**
 * RunAnywhere Web SDK - Logger
 *
 * Logging system matching the pattern across all SDKs.
 * Routes to console.* methods in the browser.
 */
export declare enum LogLevel {
    Trace = 0,
    Debug = 1,
    Info = 2,
    Warning = 3,
    Error = 4,
    Fatal = 5
}
/** Map LogLevel to RACommons rac_log_level_t values */
export declare const LOG_LEVEL_TO_RAC: Record<LogLevel, number>;
export declare class SDKLogger {
    private static _level;
    private static _enabled;
    private readonly category;
    constructor(category: string);
    static get level(): LogLevel;
    static set level(level: LogLevel);
    static get enabled(): boolean;
    static set enabled(value: boolean);
    trace(message: string): void;
    debug(message: string): void;
    info(message: string): void;
    warning(message: string): void;
    error(message: string): void;
    private log;
}
//# sourceMappingURL=SDKLogger.d.ts.map