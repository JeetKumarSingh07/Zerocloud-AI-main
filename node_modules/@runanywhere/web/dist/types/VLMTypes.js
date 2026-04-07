/**
 * RunAnywhere Web SDK - VLM Types (Backend-Agnostic)
 *
 * Generic type definitions for Vision Language Model inference.
 * Backend-specific model family enums live in the respective backend packages.
 */
export var VLMImageFormat;
(function (VLMImageFormat) {
    VLMImageFormat[VLMImageFormat["FilePath"] = 0] = "FilePath";
    VLMImageFormat[VLMImageFormat["RGBPixels"] = 1] = "RGBPixels";
    VLMImageFormat[VLMImageFormat["Base64"] = 2] = "Base64";
})(VLMImageFormat || (VLMImageFormat = {}));
//# sourceMappingURL=VLMTypes.js.map