/**
 * RunAnywhere Web SDK - Public API Type Definitions
 *
 * Single entry point for all public-facing types. Re-exports from types/enums
 * and types/models, and adds chat/generation/IRunAnywhere interfaces for
 * full TypeScript parity with the React Native SDK.
 */
// Re-export all enums and models (existing types)
export { AccelerationPreference, ComponentState, ConfigurationSource, DownloadStage, ExecutionTarget, FrameworkModality, HardwareAcceleration, LLMFramework, ModelCategory, ModelFormat, ModelStatus, RoutingPolicy, SDKComponent, SDKEnvironment, SDKEventType, } from './types/enums';
// VLM Types (backend-agnostic image/generation types)
export { VLMImageFormat } from './types/VLMTypes';
// VAD Types (backend-agnostic activity/segment types)
export { SpeechActivity } from './types/VADTypes';
/** How the model artifact is packaged (public API). */
export var ModelArtifactType;
(function (ModelArtifactType) {
    ModelArtifactType["SingleFile"] = "single_file";
    ModelArtifactType["TarGzArchive"] = "tar_gz_archive";
    ModelArtifactType["Directory"] = "directory";
})(ModelArtifactType || (ModelArtifactType = {}));
//# sourceMappingURL=types.js.map