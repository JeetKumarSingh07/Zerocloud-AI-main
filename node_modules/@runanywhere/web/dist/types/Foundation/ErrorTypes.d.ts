/**
 * RunAnywhere Web SDK - Error Types
 *
 * Structured error handling matching the RACommons error code system.
 * Error codes map to rac_error.h ranges (-100 to -999).
 */
/** RACommons error code ranges */
export declare enum SDKErrorCode {
    Success = 0,
    NotInitialized = -100,
    AlreadyInitialized = -101,
    InvalidConfiguration = -102,
    InitializationFailed = -103,
    ModelNotFound = -110,
    ModelLoadFailed = -111,
    ModelInvalidFormat = -112,
    ModelNotLoaded = -113,
    ModelAlreadyLoaded = -114,
    GenerationFailed = -130,
    GenerationCancelled = -131,
    GenerationTimeout = -132,
    InvalidPrompt = -133,
    ContextLengthExceeded = -134,
    NetworkError = -150,
    NetworkTimeout = -151,
    AuthenticationFailed = -152,
    DownloadFailed = -160,
    DownloadCancelled = -161,
    StorageError = -180,
    InsufficientStorage = -181,
    FileNotFound = -182,
    FileWriteFailed = -183,
    InvalidParameter = -220,
    ComponentNotReady = -230,
    ComponentBusy = -231,
    InvalidState = -232,
    BackendNotAvailable = -600,
    BackendError = -601,
    WASMLoadFailed = -900,
    WASMNotLoaded = -901,
    WASMCallbackError = -902,
    WASMMemoryError = -903
}
/**
 * SDK Error class matching the error handling pattern across all SDKs.
 */
export declare class SDKError extends Error {
    readonly code: SDKErrorCode;
    readonly details?: string;
    constructor(code: SDKErrorCode, message: string, details?: string);
    /** Create from a RACommons rac_result_t error code */
    static fromRACResult(resultCode: number, details?: string): SDKError;
    /** Check if error code indicates success */
    static isSuccess(resultCode: number): boolean;
    /** Convenience constructors */
    static notInitialized(message?: string): SDKError;
    static wasmNotLoaded(message?: string): SDKError;
    static modelNotFound(modelId: string): SDKError;
    static componentNotReady(component: string, details?: string): SDKError;
    static generationFailed(details?: string): SDKError;
}
/** Type guard: returns true if the value is an SDKError instance. */
export declare function isSDKError(error: unknown): error is SDKError;
//# sourceMappingURL=ErrorTypes.d.ts.map