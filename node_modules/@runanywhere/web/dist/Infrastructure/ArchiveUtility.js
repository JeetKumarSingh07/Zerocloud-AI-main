/**
 * Archive Utility - Tar.gz extraction for model archives
 *
 * Provides browser-native tar.gz extraction using DecompressionStream (gzip)
 * and a minimal tar parser. This matches the Swift SDK approach where Piper TTS
 * models are distributed as .tar.gz archives bundling model files + espeak-ng-data.
 */
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/** Tar header block size */
const TAR_BLOCK_SIZE = 512;
/** Tar file type flags */
var TarFileType;
(function (TarFileType) {
    TarFileType[TarFileType["Regular"] = 48] = "Regular";
    TarFileType[TarFileType["RegularAlt"] = 0] = "RegularAlt";
    TarFileType[TarFileType["Directory"] = 53] = "Directory";
})(TarFileType || (TarFileType = {}));
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Extract a .tar.gz archive into an array of file entries.
 *
 * Uses the browser-native DecompressionStream for gzip decompression,
 * then parses the tar format (512-byte header blocks).
 *
 * @param tarGzData - The raw tar.gz bytes
 * @returns Array of extracted files (directories are skipped)
 */
export async function extractTarGz(tarGzData) {
    const tarData = await decompressGzip(tarGzData);
    return parseTar(tarData);
}
// ---------------------------------------------------------------------------
// Gzip Decompression (browser-native)
// ---------------------------------------------------------------------------
/**
 * Decompress gzip data using the browser's native DecompressionStream API.
 * Supported in Chrome 80+, Firefox 113+, Safari 16.4+.
 */
async function decompressGzip(compressed) {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    // Write compressed data and close the stream
    writer.write(compressed);
    writer.close();
    // Read all decompressed chunks
    const chunks = [];
    let totalLength = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        chunks.push(value);
        totalLength += value.length;
    }
    // Concatenate into a single buffer
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}
// ---------------------------------------------------------------------------
// Tar Parser
// ---------------------------------------------------------------------------
/**
 * Parse a tar archive and return all regular file entries.
 * Directories and special entries are skipped.
 *
 * Tar format:
 *  - Each entry = 512-byte header + ceil(fileSize/512)*512 bytes of data
 *  - Header contains filename (0-100), size (124-136 octal), type (156)
 *  - Archive ends with two consecutive zero-filled 512-byte blocks
 */
function parseTar(tarData) {
    const entries = [];
    let offset = 0;
    while (offset + TAR_BLOCK_SIZE <= tarData.length) {
        const header = tarData.subarray(offset, offset + TAR_BLOCK_SIZE);
        // End of archive: two zero-filled blocks
        if (isZeroBlock(header))
            break;
        const name = readString(header, 0, 100);
        const size = readOctal(header, 124, 12);
        const typeFlag = header[156];
        // UStar prefix (for paths longer than 100 chars)
        const prefix = readString(header, 345, 155);
        const fullPath = prefix ? `${prefix}/${name}` : name;
        // Normalise: strip leading './' or '/'
        const normalisedPath = fullPath.replace(/^\.\//, '').replace(/^\//, '');
        offset += TAR_BLOCK_SIZE;
        if (size > 0) {
            const dataStart = offset;
            const dataEnd = dataStart + size;
            // Only include regular files (skip directories, symlinks, etc.)
            if (typeFlag === TarFileType.Regular || typeFlag === TarFileType.RegularAlt) {
                entries.push({
                    path: normalisedPath,
                    data: tarData.slice(dataStart, dataEnd),
                });
            }
            // Advance past data blocks (padded to 512-byte boundary)
            offset += Math.ceil(size / TAR_BLOCK_SIZE) * TAR_BLOCK_SIZE;
        }
    }
    return entries;
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Read a null-terminated ASCII string from a tar header field. */
function readString(header, offset, length) {
    let end = offset;
    const limit = offset + length;
    while (end < limit && header[end] !== 0)
        end++;
    const decoder = new TextDecoder('ascii');
    return decoder.decode(header.subarray(offset, end));
}
/** Read an octal number from a tar header field. */
function readOctal(header, offset, length) {
    const str = readString(header, offset, length).trim();
    return str ? parseInt(str, 8) : 0;
}
/** Check if a 512-byte block is all zeros (end-of-archive marker). */
function isZeroBlock(block) {
    for (let i = 0; i < block.length; i++) {
        if (block[i] !== 0)
            return false;
    }
    return true;
}
//# sourceMappingURL=ArchiveUtility.js.map