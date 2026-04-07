/**
 * Model Registry - Model catalog management
 *
 * Manages the list of registered models, their statuses, and notifies
 * listeners when the catalog changes. Extracted from ModelManager to keep
 * catalog concerns separate from download/load orchestration.
 */
import { EventBus } from '../Foundation/EventBus';
import { ModelCategory, LLMFramework, ModelStatus, SDKEventType } from '../types/enums';
// Re-export SDK enums for convenience (consumers can import from either location)
export { ModelCategory, LLMFramework, ModelStatus };
// ---------------------------------------------------------------------------
// Compact Model Definition & Resolver
// ---------------------------------------------------------------------------
const HF_BASE = 'https://huggingface.co';
/** Expand a compact definition into the full ManagedModel shape (minus status). */
function resolveModelDef(def) {
    const files = def.files ?? [];
    const baseUrl = def.repo ? `${HF_BASE}/${def.repo}/resolve/main` : undefined;
    // Archive models: URL is the archive itself, no individual files
    if (def.artifactType === 'archive') {
        const archiveUrl = def.url;
        if (!archiveUrl) {
            throw new Error(`Archive model '${def.id}' must specify a 'url' for the archive.`);
        }
        return {
            id: def.id,
            name: def.name,
            url: archiveUrl,
            framework: def.framework,
            modality: def.modality,
            memoryRequirement: def.memoryRequirement,
            isArchive: true,
        };
    }
    // Individual-file models: first file = primary, rest = additional
    const primaryUrl = def.url ?? `${baseUrl}/${files[0]}`;
    const additionalFiles = files.slice(1).map((filename) => ({
        url: baseUrl ? `${baseUrl}/${filename}` : filename,
        filename,
    }));
    return {
        id: def.id,
        name: def.name,
        url: primaryUrl,
        framework: def.framework,
        modality: def.modality,
        memoryRequirement: def.memoryRequirement,
        ...(additionalFiles.length > 0 ? { additionalFiles } : {}),
    };
}
// ---------------------------------------------------------------------------
// Model Registry
// ---------------------------------------------------------------------------
/**
 * ModelRegistry — manages the model catalog, status tracking, and listener
 * notifications. Does NOT handle downloads or loading.
 */
export class ModelRegistry {
    models = [];
    listeners = [];
    // --- Registration ---
    /**
     * Register a catalog of models. Resolves compact definitions into full
     * ManagedModel entries.
     *
     * @returns The resolved models array (callers can use this for further checks).
     */
    registerModels(defs) {
        const resolved = defs.map(resolveModelDef);
        this.models = resolved.map((m) => ({ ...m, status: ModelStatus.Registered }));
        this.notifyListeners();
        EventBus.shared.emit('model.registered', SDKEventType.Model, { count: defs.length });
        return this.getModels();
    }
    /**
     * Add a single model to the registry without replacing existing ones.
     * Used for importing models via file picker or drag-and-drop.
     * If a model with the same ID already exists, this is a no-op.
     */
    addModel(model) {
        if (this.models.some((m) => m.id === model.id))
            return;
        this.models.push(model);
        this.notifyListeners();
    }
    // --- Queries ---
    getModels() {
        return [...this.models];
    }
    getModel(id) {
        return this.models.find((m) => m.id === id);
    }
    getModelsByCategory(category) {
        return this.models.filter((m) => m.modality === category);
    }
    getModelsByFramework(framework) {
        return this.models.filter((m) => m.framework === framework);
    }
    getLLMModels() {
        return this.models.filter((m) => m.modality === ModelCategory.Language);
    }
    getVLMModels() {
        return this.models.filter((m) => m.modality === ModelCategory.Multimodal);
    }
    getSTTModels() {
        return this.models.filter((m) => m.modality === ModelCategory.SpeechRecognition);
    }
    getTTSModels() {
        return this.models.filter((m) => m.modality === ModelCategory.SpeechSynthesis);
    }
    getVADModels() {
        return this.models.filter((m) => m.modality === ModelCategory.Audio);
    }
    // --- Status tracking ---
    updateModel(id, patch) {
        this.models = this.models.map((m) => (m.id === id ? { ...m, ...patch } : m));
        this.notifyListeners();
    }
    // --- Listener / onChange pattern ---
    onChange(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
        };
    }
    notifyListeners() {
        for (const listener of this.listeners) {
            listener(this.getModels());
        }
    }
}
//# sourceMappingURL=ModelRegistry.js.map