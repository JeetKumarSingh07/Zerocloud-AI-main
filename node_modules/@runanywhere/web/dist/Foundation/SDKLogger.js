/**
 * RunAnywhere Web SDK - Logger
 *
 * Logging system matching the pattern across all SDKs.
 * Routes to console.* methods in the browser.
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Trace"] = 0] = "Trace";
    LogLevel[LogLevel["Debug"] = 1] = "Debug";
    LogLevel[LogLevel["Info"] = 2] = "Info";
    LogLevel[LogLevel["Warning"] = 3] = "Warning";
    LogLevel[LogLevel["Error"] = 4] = "Error";
    LogLevel[LogLevel["Fatal"] = 5] = "Fatal";
})(LogLevel || (LogLevel = {}));
/** Map LogLevel to RACommons rac_log_level_t values */
export const LOG_LEVEL_TO_RAC = {
    [LogLevel.Trace]: 0,
    [LogLevel.Debug]: 1,
    [LogLevel.Info]: 2,
    [LogLevel.Warning]: 3,
    [LogLevel.Error]: 4,
    [LogLevel.Fatal]: 5,
};
export class SDKLogger {
    static _level = LogLevel.Info;
    static _enabled = true;
    category;
    constructor(category) {
        this.category = category;
    }
    static get level() {
        return SDKLogger._level;
    }
    static set level(level) {
        SDKLogger._level = level;
    }
    static get enabled() {
        return SDKLogger._enabled;
    }
    static set enabled(value) {
        SDKLogger._enabled = value;
    }
    trace(message) {
        this.log(LogLevel.Trace, message);
    }
    debug(message) {
        this.log(LogLevel.Debug, message);
    }
    info(message) {
        this.log(LogLevel.Info, message);
    }
    warning(message) {
        this.log(LogLevel.Warning, message);
    }
    error(message) {
        this.log(LogLevel.Error, message);
    }
    log(level, message) {
        if (!SDKLogger._enabled || level < SDKLogger._level) {
            return;
        }
        const prefix = `[RunAnywhere:${this.category}]`;
        switch (level) {
            case LogLevel.Trace:
            case LogLevel.Debug:
                console.debug(prefix, message);
                break;
            case LogLevel.Info:
                console.info(prefix, message);
                break;
            case LogLevel.Warning:
                console.warn(prefix, message);
                break;
            case LogLevel.Error:
            case LogLevel.Fatal:
                console.error(prefix, message);
                break;
        }
    }
}
//# sourceMappingURL=SDKLogger.js.map