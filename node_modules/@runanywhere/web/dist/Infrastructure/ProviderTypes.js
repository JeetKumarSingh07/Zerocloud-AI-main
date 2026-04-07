/**
 * Typed provider interfaces for cross-package communication.
 *
 * Backend packages (@runanywhere/web-llamacpp, @runanywhere/web-onnx) implement
 * these interfaces and register instances via `ExtensionPoint.registerProvider()`.
 * Core code (e.g. VoicePipeline) retrieves them at runtime via
 * `ExtensionPoint.getProvider()` with full compile-time type safety.
 *
 * All referenced types (LLMGenerationResult, STTTranscriptionResult, etc.)
 * are defined in core so providers return properly typed results.
 */
export {};
//# sourceMappingURL=ProviderTypes.js.map