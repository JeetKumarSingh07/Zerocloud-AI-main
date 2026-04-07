/**
 * Archive Utility - Tar.gz extraction for model archives
 *
 * Provides browser-native tar.gz extraction using DecompressionStream (gzip)
 * and a minimal tar parser. This matches the Swift SDK approach where Piper TTS
 * models are distributed as .tar.gz archives bundling model files + espeak-ng-data.
 */
/** A single entry extracted from a tar archive. */
export interface TarEntry {
    /** Relative path within the archive (e.g., 'espeak-ng-data/phondata') */
    path: string;
    /** File contents */
    data: Uint8Array;
}
/**
 * Extract a .tar.gz archive into an array of file entries.
 *
 * Uses the browser-native DecompressionStream for gzip decompression,
 * then parses the tar format (512-byte header blocks).
 *
 * @param tarGzData - The raw tar.gz bytes
 * @returns Array of extracted files (directories are skipped)
 */
export declare function extractTarGz(tarGzData: Uint8Array): Promise<TarEntry[]>;
//# sourceMappingURL=ArchiveUtility.d.ts.map