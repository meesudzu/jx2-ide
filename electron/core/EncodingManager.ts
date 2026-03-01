/**
 * EncodingManager — The heart of JX2 DevStudio.
 * 
 * Handles all byte-level encoding operations for GB18030, Windows-1252, and UTF-8.
 * Files are always read as raw Buffers, cached, and decoded on demand.
 * Saving writes bytes in the selected encoding — never auto-converts to UTF-8.
 */

import * as fs from 'fs'
import * as iconv from 'iconv-lite'
import * as path from 'path'

export type Encoding = 'gb18030' | 'windows-1252' | 'utf-8'

export interface FileReadResult {
    content: string
    encoding: Encoding
    rawBufferBase64: string
}

// Cache raw bytes per file path so encoding toggles don't re-read from disk
const rawBufferCache = new Map<string, Buffer>()

export class EncodingManager {
    /**
     * Read a file as raw bytes, decode using the specified encoding.
     * Caches the raw buffer for re-interpretation.
     */
    readFile(filePath: string, encoding?: Encoding): FileReadResult {
        const rawBuffer = fs.readFileSync(filePath)
        rawBufferCache.set(filePath, rawBuffer)

        const detectedEncoding = encoding || this.detectEncoding(rawBuffer)
        const content = this.decode(rawBuffer, detectedEncoding)

        return {
            content,
            encoding: detectedEncoding,
            rawBufferBase64: rawBuffer.toString('base64'),
        }
    }

    /**
     * Re-decode the cached raw bytes with a different encoding.
     * This is the "toggle switch" — no disk I/O, pure re-interpretation.
     */
    reinterpret(filePath: string, newEncoding: Encoding): FileReadResult {
        let rawBuffer = rawBufferCache.get(filePath)
        if (!rawBuffer) {
            // If not cached, read from disk
            rawBuffer = fs.readFileSync(filePath)
            rawBufferCache.set(filePath, rawBuffer)
        }

        const content = this.decode(rawBuffer, newEncoding)
        return {
            content,
            encoding: newEncoding,
            rawBufferBase64: rawBuffer.toString('base64'),
        }
    }

    /**
     * Encode the editor's string content back to bytes and save to disk.
     * Saves in the specified encoding — never auto-converts to UTF-8.
     */
    saveFile(filePath: string, content: string, encoding: Encoding): void {
        const encodedBuffer = this.encode(content, encoding)
        fs.writeFileSync(filePath, encodedBuffer)
        // Update the cache with new bytes
        rawBufferCache.set(filePath, encodedBuffer)
    }

    /**
     * Decode a raw byte buffer into a string using the given encoding.
     */
    decode(buffer: Buffer, encoding: Encoding): string {
        return iconv.decode(buffer, encoding)
    }

    /**
     * Encode a string into a raw byte buffer in the given encoding.
     */
    encode(content: string, encoding: Encoding): Buffer {
        return iconv.encode(content, encoding)
    }

    /**
     * Decode a filename from raw bytes (common for GB18030-encoded filenames).
     * Falls back through GB18030 → UTF-8 → raw bytes.
     */
    decodeFilename(rawName: string | Buffer, encoding: Encoding = 'gb18030'): string {
        if (typeof rawName === 'string') {
            // If it's already a string, try to re-encode and decode
            // This handles cases where the OS decoded it incorrectly
            try {
                const buf = Buffer.from(rawName, 'latin1') // Preserve raw bytes
                const decoded = iconv.decode(buf, encoding)
                // Check if decoding produced valid characters
                if (decoded && !decoded.includes('\uFFFD')) {
                    return decoded
                }
            } catch {
                // Fall through
            }
            return rawName
        }
        return iconv.decode(rawName, encoding)
    }

    /**
     * Detect the most likely encoding of a buffer using byte-pattern heuristics.
     * 
     * Strategy:
     * 1. UTF-8 BOM (EF BB BF) → UTF-8
     * 2. Valid strict UTF-8 with multibyte sequences → UTF-8
     * 3. GB18030 double-byte patterns (lead byte 0x81-0xFE) → GB18030
     * 4. High bytes present but not GB18030 → Windows-1252
     * 5. Pure ASCII → UTF-8 (safe default)
     */
    detectEncoding(buffer: Buffer): Encoding {
        if (buffer.length === 0) return 'utf-8'

        // Check for UTF-8 BOM
        if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            return 'utf-8'
        }

        // Try strict UTF-8 validation
        if (this.isValidUtf8(buffer)) {
            // Check if it actually has multibyte sequences (not just ASCII)
            const hasMultibyte = buffer.some(b => b > 0x7F)
            if (hasMultibyte) return 'utf-8'
            // Pure ASCII — check file extension or default
            return 'utf-8'
        }

        // Check for GB18030 patterns
        const gb18030Score = this.scoreGb18030(buffer)
        const win1252Score = this.scoreWindows1252(buffer)

        if (gb18030Score > win1252Score) return 'gb18030'
        if (win1252Score > 0) return 'windows-1252'

        return 'utf-8'
    }

    /**
     * Detect encoding with a file-extension hint.
     * .lua files in JX2 are typically GB18030, .txt configs are Windows-1252.
     */
    detectEncodingWithHint(buffer: Buffer, filePath: string): Encoding {
        const ext = path.extname(filePath).toLowerCase()

        // If pure ASCII, the encoding doesn't matter
        if (buffer.every(b => b <= 0x7F)) return 'utf-8'

        // Check for UTF-8 BOM
        if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            return 'utf-8'
        }

        // Try strict UTF-8 first
        if (this.isValidUtf8(buffer)) {
            return 'utf-8'
        }

        // Use extension hint to break ties
        if (ext === '.lua') return 'gb18030'
        if (ext === '.txt') return 'windows-1252'
        if (ext === '.ini') return 'gb18030'

        // Fall back to heuristic scoring
        return this.detectEncoding(buffer)
    }

    /**
     * Validate if buffer is valid strict UTF-8.
     */
    private isValidUtf8(buffer: Buffer): boolean {
        let i = 0
        while (i < buffer.length) {
            const byte = buffer[i]

            if (byte <= 0x7F) {
                i++
            } else if ((byte & 0xE0) === 0xC0) {
                // 2-byte sequence
                if (i + 1 >= buffer.length) return false
                if ((buffer[i + 1] & 0xC0) !== 0x80) return false
                // Overlong check
                if (byte < 0xC2) return false
                i += 2
            } else if ((byte & 0xF0) === 0xE0) {
                // 3-byte sequence
                if (i + 2 >= buffer.length) return false
                if ((buffer[i + 1] & 0xC0) !== 0x80) return false
                if ((buffer[i + 2] & 0xC0) !== 0x80) return false
                i += 3
            } else if ((byte & 0xF8) === 0xF0) {
                // 4-byte sequence
                if (i + 3 >= buffer.length) return false
                if ((buffer[i + 1] & 0xC0) !== 0x80) return false
                if ((buffer[i + 2] & 0xC0) !== 0x80) return false
                if ((buffer[i + 3] & 0xC0) !== 0x80) return false
                i += 4
            } else {
                return false
            }
        }
        return true
    }

    /**
     * Score how likely a buffer is GB18030 encoded.
     * GB18030 uses lead bytes 0x81-0xFE followed by 0x40-0x7E or 0x80-0xFE.
     */
    private scoreGb18030(buffer: Buffer): number {
        let score = 0
        let i = 0
        while (i < buffer.length) {
            const byte = buffer[i]
            if (byte >= 0x81 && byte <= 0xFE && i + 1 < buffer.length) {
                const next = buffer[i + 1]
                if ((next >= 0x40 && next <= 0x7E) || (next >= 0x80 && next <= 0xFE)) {
                    score += 2 // Valid double-byte sequence
                    i += 2
                    continue
                }
            }
            if (byte > 0x7F) {
                score -= 1 // High byte not part of valid GB18030 sequence
            }
            i++
        }
        return score
    }

    /**
     * Score how likely a buffer is Windows-1252 encoded.
     * Windows-1252 uses 0x80-0xFF as single-byte characters.
     * Vietnamese diacritics commonly use specific byte ranges.
     */
    private scoreWindows1252(buffer: Buffer): number {
        let score = 0
        // Common Windows-1252 Vietnamese characters:
        // à(0xE0), á(0xE1), ả, ã, ạ, ă, â, è(0xE8), é(0xE9), ê, ì(0xEC), 
        // í(0xED), ò(0xF2), ó(0xF3), ô, ơ, ù(0xF9), ú(0xFA), ư, ý(0xFD)
        const commonVietRange = new Set([
            0xC0, 0xC1, 0xC2, 0xC3, 0xC8, 0xC9, 0xCA, 0xCC, 0xCD,
            0xD0, 0xD2, 0xD3, 0xD4, 0xD5, 0xD9, 0xDA, 0xDD,
            0xE0, 0xE1, 0xE2, 0xE3, 0xE8, 0xE9, 0xEA, 0xEC, 0xED,
            0xF0, 0xF2, 0xF3, 0xF4, 0xF5, 0xF9, 0xFA, 0xFD,
        ])

        for (const byte of buffer) {
            if (byte > 0x7F && byte < 0xFF) {
                if (commonVietRange.has(byte)) {
                    score += 2
                } else {
                    score += 1
                }
            }
        }
        return score
    }

    /**
     * Evict a file from the raw buffer cache.
     */
    evictCache(filePath: string): void {
        rawBufferCache.delete(filePath)
    }

    /**
     * Clear the entire raw buffer cache.
     */
    clearCache(): void {
        rawBufferCache.clear()
    }
}

// Singleton instance
export const encodingManager = new EncodingManager()
