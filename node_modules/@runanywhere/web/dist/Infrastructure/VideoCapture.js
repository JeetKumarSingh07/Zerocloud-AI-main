/**
 * RunAnywhere Web SDK - Video Capture
 *
 * Manages webcam lifecycle and frame extraction for VLM inference.
 * Provides aspect-ratio-preserving downscaling and RGBA->RGB conversion
 * matching the format expected by the C++ VLM backend
 * (RAC_VLM_IMAGE_FORMAT_RGB_PIXELS with RGBRGBRGB... byte layout).
 *
 * Follows the same pattern as AudioCapture: config, start/stop lifecycle,
 * and utility getters.
 *
 * Usage:
 *   ```typescript
 *   import { VideoCapture } from '@runanywhere/web';
 *
 *   const camera = new VideoCapture({ facingMode: 'environment' });
 *   await camera.start();
 *   document.body.appendChild(camera.videoElement);
 *
 *   const frame = camera.captureFrame(256);
 *   if (frame) {
 *     await vlm.process(frame.rgbPixels, frame.width, frame.height, prompt);
 *   }
 *
 *   camera.stop();
 *   ```
 */
import { SDKLogger } from '../Foundation/SDKLogger';
const logger = new SDKLogger('VideoCapture');
// ---------------------------------------------------------------------------
// VideoCapture
// ---------------------------------------------------------------------------
/**
 * VideoCapture - Manages webcam and frame extraction for VLM inference.
 *
 * Creates an internal HTMLVideoElement (for the media stream) and an
 * offscreen HTMLCanvasElement (for pixel extraction). The video element
 * is accessible via `videoElement` so the app can attach it to the DOM
 * for live preview.
 */
export class VideoCapture {
    config;
    _mediaStream = null;
    _videoEl;
    _canvasEl;
    _isCapturing = false;
    _startPromise = null;
    constructor(config = {}) {
        this.config = {
            facingMode: config.facingMode ?? 'environment',
            idealWidth: config.idealWidth ?? 640,
            idealHeight: config.idealHeight ?? 480,
        };
        // Create internal elements (not appended to DOM by default)
        this._videoEl = document.createElement('video');
        this._videoEl.playsInline = true;
        this._videoEl.autoplay = true;
        this._videoEl.muted = true;
        this._canvasEl = document.createElement('canvas');
    }
    // ---- Public getters ----
    /** Whether the camera is currently capturing. */
    get isCapturing() {
        return this._isCapturing;
    }
    /**
     * The HTMLVideoElement receiving the camera stream.
     * Attach this to the DOM for live preview:
     *
     * ```typescript
     * previewContainer.appendChild(camera.videoElement);
     * ```
     */
    get videoElement() {
        return this._videoEl;
    }
    /** Native video width from the camera (0 if not started). */
    get videoWidth() {
        return this._videoEl.videoWidth;
    }
    /** Native video height from the camera (0 if not started). */
    get videoHeight() {
        return this._videoEl.videoHeight;
    }
    // ---- Lifecycle ----
    /**
     * Start the camera and begin capturing video.
     *
     * Requests camera permission via `getUserMedia`. The returned Promise
     * resolves once the video stream is active and ready for frame capture.
     *
     * @throws If camera permission is denied or no camera is available.
     */
    async start() {
        if (this._isCapturing) {
            logger.debug('Already capturing');
            return;
        }
        // Coalesce concurrent start() calls — return the in-flight promise
        if (this._startPromise) {
            logger.debug('Start already in progress, awaiting existing attempt');
            return this._startPromise;
        }
        this._startPromise = this._doStart();
        try {
            await this._startPromise;
        }
        finally {
            this._startPromise = null;
        }
    }
    async _doStart() {
        logger.info(`Starting video capture (${this.config.facingMode}, ${this.config.idealWidth}x${this.config.idealHeight})`);
        try {
            this._mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: this.config.facingMode,
                    width: { ideal: this.config.idealWidth },
                    height: { ideal: this.config.idealHeight },
                },
                audio: false,
            });
            this._videoEl.srcObject = this._mediaStream;
            // Wait for video metadata to load so videoWidth/videoHeight are available
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Video stream timeout')), 10000);
                this._videoEl.onloadedmetadata = () => {
                    clearTimeout(timeout);
                    resolve();
                };
            });
            this._isCapturing = true;
            logger.info(`Camera started (${this._videoEl.videoWidth}x${this._videoEl.videoHeight})`);
        }
        catch (error) {
            this.cleanupResources();
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to start video capture: ${message}`);
            throw new Error(`Camera access failed: ${message}`);
        }
    }
    /**
     * Stop capturing video and release camera resources.
     */
    stop() {
        if (!this._isCapturing)
            return;
        this._isCapturing = false;
        this.cleanupResources();
        logger.info('Video capture stopped');
    }
    // ---- Frame Capture ----
    /**
     * Capture the current video frame as raw RGB pixels.
     *
     * The frame is downscaled to fit within `maxDimension` while preserving
     * aspect ratio. The CLIP encoder resizes to its fixed input size
     * internally, so capturing at larger sizes only wastes WASM copy time.
     *
     * @param maxDimension  Maximum width or height in pixels (default: 512).
     * @returns CapturedFrame or null if the video stream isn't ready.
     */
    captureFrame(maxDimension = 512) {
        if (!this._isCapturing || !this._videoEl.videoWidth || !this._videoEl.videoHeight) {
            return null;
        }
        const { w, h } = VideoCapture.fitSize(this._videoEl.videoWidth, this._videoEl.videoHeight, maxDimension);
        this._canvasEl.width = w;
        this._canvasEl.height = h;
        const ctx = this._canvasEl.getContext('2d');
        if (!ctx)
            return null;
        // Draw the video frame scaled down onto the offscreen canvas
        ctx.drawImage(this._videoEl, 0, 0, w, h);
        return VideoCapture.extractRGB(ctx, w, h);
    }
    // ---- Static Utilities ----
    /**
     * Compute a downscaled size that fits within `maxDim` while
     * preserving aspect ratio. Returns original size if already small enough.
     */
    static fitSize(srcW, srcH, maxDim) {
        if (srcW <= maxDim && srcH <= maxDim) {
            return { w: srcW, h: srcH };
        }
        const scale = maxDim / Math.max(srcW, srcH);
        return {
            w: Math.round(srcW * scale),
            h: Math.round(srcH * scale),
        };
    }
    /**
     * Extract raw RGB pixels from a canvas 2D context.
     *
     * Canvas gives RGBA; this strips the alpha channel to produce the
     * RGBRGBRGB... byte layout expected by the C++ VLM backend
     * (RAC_VLM_IMAGE_FORMAT_RGB_PIXELS).
     */
    static extractRGB(ctx, w, h) {
        const imageData = ctx.getImageData(0, 0, w, h);
        const rgba = imageData.data; // Uint8ClampedArray: RGBARGBA...
        const pixelCount = w * h;
        const rgb = new Uint8Array(pixelCount * 3);
        for (let i = 0; i < pixelCount; i++) {
            const src = i * 4;
            const dst = i * 3;
            rgb[dst] = rgba[src]; // R
            rgb[dst + 1] = rgba[src + 1]; // G
            rgb[dst + 2] = rgba[src + 2]; // B
        }
        return { rgbPixels: rgb, width: w, height: h };
    }
    // ---- Internals ----
    cleanupResources() {
        if (this._mediaStream) {
            this._mediaStream.getTracks().forEach((track) => track.stop());
            this._mediaStream = null;
        }
        this._videoEl.srcObject = null;
    }
}
//# sourceMappingURL=VideoCapture.js.map