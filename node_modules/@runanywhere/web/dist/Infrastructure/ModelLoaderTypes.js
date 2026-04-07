/**
 * Model Loader Interfaces
 *
 * Defines the contracts that model-loading extensions must implement.
 * ModelManager depends on these interfaces (Infrastructure layer) rather
 * than on the concrete extension objects in the Public layer, keeping the
 * dependency flow correct: Public -> Infrastructure -> Foundation.
 *
 * Registrations are performed by backend provider packages during their
 * registration phase.
 *
 * The loader interfaces are self-contained: they receive raw model data
 * and a context object for fetching additional files. All backend-specific
 * logic (e.g. writing to sherpa-onnx FS, extracting archives) is handled
 * by the loader implementation in the backend package.
 */
export {};
//# sourceMappingURL=ModelLoaderTypes.js.map