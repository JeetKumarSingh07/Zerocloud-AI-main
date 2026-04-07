/**
 * RunAnywhere Web SDK - Error Types
 *
 * Structured error handling matching the RACommons error code system.
 * Error codes map to rac_error.h ranges (-100 to -999).
 */
/** RACommons error code ranges */
export var SDKErrorCode;
(function (SDKErrorCode) {
    // Success
    SDKErrorCode[SDKErrorCode["Success"] = 0] = "Success";
    // Initialization errors (-100 to -109)
    SDKErrorCode[SDKErrorCode["NotInitialized"] = -100] = "NotInitialized";
    SDKErrorCode[SDKErrorCode["AlreadyInitialized"] = -101] = "AlreadyInitialized";
    SDKErrorCode[SDKErrorCode["InvalidConfiguration"] = -102] = "InvalidConfiguration";
    SDKErrorCode[SDKErrorCode["InitializationFailed"] = -103] = "InitializationFailed";
    // Model errors (-110 to -129)
    SDKErrorCode[SDKErrorCode["ModelNotFound"] = -110] = "ModelNotFound";
    SDKErrorCode[SDKErrorCode["ModelLoadFailed"] = -111] = "ModelLoadFailed";
    SDKErrorCode[SDKErrorCode["ModelInvalidFormat"] = -112] = "ModelInvalidFormat";
    SDKErrorCode[SDKErrorCode["ModelNotLoaded"] = -113] = "ModelNotLoaded";
    SDKErrorCode[SDKErrorCode["ModelAlreadyLoaded"] = -114] = "ModelAlreadyLoaded";
    // Generation errors (-130 to -149)
    SDKErrorCode[SDKErrorCode["GenerationFailed"] = -130] = "GenerationFailed";
    SDKErrorCode[SDKErrorCode["GenerationCancelled"] = -131] = "GenerationCancelled";
    SDKErrorCode[SDKErrorCode["GenerationTimeout"] = -132] = "GenerationTimeout";
    SDKErrorCode[SDKErrorCode["InvalidPrompt"] = -133] = "InvalidPrompt";
    SDKErrorCode[SDKErrorCode["ContextLengthExceeded"] = -134] = "ContextLengthExceeded";
    // Network errors (-150 to -179)
    SDKErrorCode[SDKErrorCode["NetworkError"] = -150] = "NetworkError";
    SDKErrorCode[SDKErrorCode["NetworkTimeout"] = -151] = "NetworkTimeout";
    SDKErrorCode[SDKErrorCode["AuthenticationFailed"] = -152] = "AuthenticationFailed";
    SDKErrorCode[SDKErrorCode["DownloadFailed"] = -160] = "DownloadFailed";
    SDKErrorCode[SDKErrorCode["DownloadCancelled"] = -161] = "DownloadCancelled";
    // Storage errors (-180 to -219)
    SDKErrorCode[SDKErrorCode["StorageError"] = -180] = "StorageError";
    SDKErrorCode[SDKErrorCode["InsufficientStorage"] = -181] = "InsufficientStorage";
    SDKErrorCode[SDKErrorCode["FileNotFound"] = -182] = "FileNotFound";
    SDKErrorCode[SDKErrorCode["FileWriteFailed"] = -183] = "FileWriteFailed";
    // Parameter errors (-220 to -229)
    SDKErrorCode[SDKErrorCode["InvalidParameter"] = -220] = "InvalidParameter";
    // Component errors (-230 to -249)
    SDKErrorCode[SDKErrorCode["ComponentNotReady"] = -230] = "ComponentNotReady";
    SDKErrorCode[SDKErrorCode["ComponentBusy"] = -231] = "ComponentBusy";
    SDKErrorCode[SDKErrorCode["InvalidState"] = -232] = "InvalidState";
    // Backend errors (-600 to -699)
    SDKErrorCode[SDKErrorCode["BackendNotAvailable"] = -600] = "BackendNotAvailable";
    SDKErrorCode[SDKErrorCode["BackendError"] = -601] = "BackendError";
    // WASM-specific errors (-900 to -999)
    SDKErrorCode[SDKErrorCode["WASMLoadFailed"] = -900] = "WASMLoadFailed";
    SDKErrorCode[SDKErrorCode["WASMNotLoaded"] = -901] = "WASMNotLoaded";
    SDKErrorCode[SDKErrorCode["WASMCallbackError"] = -902] = "WASMCallbackError";
    SDKErrorCode[SDKErrorCode["WASMMemoryError"] = -903] = "WASMMemoryError";
})(SDKErrorCode || (SDKErrorCode = {}));
/**
 * SDK Error class matching the error handling pattern across all SDKs.
 */
export class SDKError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.name = 'SDKError';
        this.code = code;
        this.details = details;
    }
    /** Create from a RACommons rac_result_t error code */
    static fromRACResult(resultCode, details) {
        const message = `RACommons error: ${resultCode}`;
        return new SDKError(resultCode, message, details);
    }
    /** Check if error code indicates success */
    static isSuccess(resultCode) {
        return resultCode === 0;
    }
    /** Convenience constructors */
    static notInitialized(message = 'SDK not initialized') {
        return new SDKError(SDKErrorCode.NotInitialized, message);
    }
    static wasmNotLoaded(message = 'WASM module not loaded') {
        return new SDKError(SDKErrorCode.WASMNotLoaded, message);
    }
    static modelNotFound(modelId) {
        return new SDKError(SDKErrorCode.ModelNotFound, `Model not found: ${modelId}`);
    }
    static componentNotReady(component, details) {
        return new SDKError(SDKErrorCode.ComponentNotReady, `Component not ready: ${component}`, details);
    }
    static generationFailed(details) {
        return new SDKError(SDKErrorCode.GenerationFailed, 'Generation failed', details);
    }
}
/** Type guard: returns true if the value is an SDKError instance. */
export function isSDKError(error) {
    return error instanceof SDKError;
}
//# sourceMappingURL=ErrorTypes.js.map