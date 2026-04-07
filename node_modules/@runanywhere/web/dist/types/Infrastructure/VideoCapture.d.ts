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
/** Configuration for the VideoCapture instance. */
export interface VideoCaptureConfig {
    /** Camera facing mode (default: 'environment' for back camera). */
    facingMode?: 'user' | 'environment';
    /** Ideal video width in pixels (default: 640). */
    idealWidth?: number;
    /** Ideal video height in pixels (default: 480). */
    idealHeight?: number;
}
/** Captured frame: raw RGB pixels suitable for VLM inference. */
export interface CapturedFrame {
    /** Raw RGBRGBRGB... byte layout (no alpha). */
    rgbPixels: Uint8Array;
    /** Frame width in pixels. */
    width: number;
    /** Frame height in pixels. */
    height: number;
}
/**
 * VideoCapture - Manages webcam and frame extraction for VLM inference.
 *
 * Creates an internal HTMLVideoElement (for the media stream) and an
 * offscreen HTMLCanvasElement (for pixel extraction). The video element
 * is accessible via `videoElement` so the app can attach it to the DOM
 * for live preview.
 */
export declare class VideoCapture {
    private readonly config;
    private _mediaStream;
    private _videoEl;
    private _canvasEl;
    private _isCapturing;
    private _startPromise;
    constructor(config?: VideoCaptureConfig);
    /** Whether the camera is currently capturing. */
    get isCapturing(): boolean;
    /**
     * The HTMLVideoElement receiving the camera stream.
     * Attach this to the DOM for live preview:
     *
     * ```typescript
     * previewContainer.appendChild(camera.videoElement);
     * ```
     */
    get videoElement(): HTMLVideoElement;
    /** Native video width from the camera (0 if not started). */
    get videoWidth(): number;
    /** Native video height from the camera (0 if not started). */
    get videoHeight(): number;
    /**
     * Start the camera and begin capturing video.
     *
     * Requests camera permission via `getUserMedia`. The returned Promise
     * resolves once the video stream is active and ready for frame capture.
     *
     * @throws If camera permission is denied or no camera is available.
     */
    start(): Promise<void>;
    private _doStart;
    /**
     * Stop capturing video and release camera resources.
     */
    stop(): void;
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
    captureFrame(maxDimension?: number): CapturedFrame | null;
    /**
     * Compute a downscaled size that fits within `maxDim` while
     * preserving aspect ratio. Returns original size if already small enough.
     */
    static fitSize(srcW: number, srcH: number, maxDim: number): {
        w: number;
        h: number;
    };
    /**
     * Extract raw RGB pixels from a canvas 2D context.
     *
     * Canvas gives RGBA; this strips the alpha channel to produce the
     * RGBRGBRGB... byte layout expected by the C++ VLM backend
     * (RAC_VLM_IMAGE_FORMAT_RGB_PIXELS).
     */
    static extractRGB(ctx: CanvasRenderingContext2D, w: number, h: number): CapturedFrame;
    private cleanupResources;
}
//# sourceMappingURL=VideoCapture.d.ts.map