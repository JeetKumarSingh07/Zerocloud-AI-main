/**
 * RunAnywhere Web SDK - VAD Types (Backend-Agnostic)
 *
 * Generic type definitions for Voice Activity Detection events and segments.
 * Backend-specific model configurations live in the respective backend packages.
 */
export var SpeechActivity;
(function (SpeechActivity) {
    SpeechActivity["Started"] = "started";
    SpeechActivity["Ended"] = "ended";
    SpeechActivity["Ongoing"] = "ongoing";
})(SpeechActivity || (SpeechActivity = {}));
//# sourceMappingURL=VADTypes.js.map