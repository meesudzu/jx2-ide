/**
 * SearchEngine — Cross-encoding search for JX2 projects.
 * 
 * Converts the search query into byte sequences for all three encodings,
 * then searches for those byte patterns in raw file buffers.
 * This ensures we find matches regardless of file encoding.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as iconv from 'iconv-lite'
import { Encoding } from './EncodingManager'

export interface SearchMatch {
    filePath: string
    lineNumber: number
    lineContent: string
    matchEncoding: Encoding
    column: number
}

export interface SearchResult {
    query: string
    matches: SearchMatch[]
    totalFiles: number
    searchTime: number
}

export class SearchEngine {
    private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB limit
    private readonly SUPPORTED_EXTENSIONS = new Set([
        '.lua', '.txt', '.ini', '.cfg', '.log', '.xml', '.tab',
    ])

    /**
     * Search for a query string across all files in a project,
     * checking UTF-8, GB18030, and Windows-1252 byte representations.
     */
    async searchAcrossEncodings(
        query: string,
        projectRoot: string,
        fileExtensions?: string[],
    ): Promise<SearchResult> {
        const startTime = Date.now()
        const matches: SearchMatch[] = []

        if (!query || query.length === 0) {
            return { query, matches, totalFiles: 0, searchTime: 0 }
        }

        // Step 1: Encode the query string into byte sequences for all encodings
        const queryBytes = this.encodeQueryToBytes(query)

        // Step 2: Collect all searchable files
        const extensions = fileExtensions
            ? new Set(fileExtensions.map(e => e.startsWith('.') ? e : `.${e}`))
            : this.SUPPORTED_EXTENSIONS

        const files = this.collectFiles(projectRoot, extensions)

        // Step 3: Search each file for byte-level matches
        for (const filePath of files) {
            try {
                const fileMatches = this.searchFile(filePath, queryBytes)
                matches.push(...fileMatches)
            } catch {
                // Skip files that can't be read (permissions, etc.)
                continue
            }
        }

        const searchTime = Date.now() - startTime

        return {
            query,
            matches,
            totalFiles: files.length,
            searchTime,
        }
    }

    /**
     * Encode a search query into byte sequences for all three encodings.
     * Returns only unique byte patterns (some may overlap for ASCII-only queries).
     */
    private encodeQueryToBytes(query: string): Map<Encoding, Buffer> {
        const results = new Map<Encoding, Buffer>()

        const encodings: Encoding[] = ['utf-8', 'gb18030', 'windows-1252']

        for (const encoding of encodings) {
            try {
                const encoded = iconv.encode(query, encoding)
                // Only add if encoding actually produced valid bytes
                // (some characters may not be representable in all encodings)
                if (encoded.length > 0) {
                    // Verify round-trip: decode back and check if it matches
                    const decoded = iconv.decode(encoded, encoding)
                    if (decoded === query) {
                        results.set(encoding, encoded)
                    }
                }
            } catch {
                // Encoding doesn't support these characters, skip
            }
        }

        return results
    }

    /**
     * Search a single file for all encoding variants of the query.
     * Uses Boyer-Moore-Horspool-style byte matching.
     */
    private searchFile(
        filePath: string,
        queryBytes: Map<Encoding, Buffer>,
    ): SearchMatch[] {
        const stat = fs.statSync(filePath)
        if (stat.size > this.MAX_FILE_SIZE) return []

        const fileBuffer = fs.readFileSync(filePath)
        const matches: SearchMatch[] = []
        // Track matched byte offsets to avoid duplicates
        const matchedOffsets = new Set<number>()

        for (const [encoding, pattern] of queryBytes) {
            // Skip if the byte patterns are identical to one already searched
            // (e.g., ASCII text is the same in UTF-8 and Windows-1252)
            const patternKey = pattern.toString('hex')
            let isDuplicate = false
            for (const [otherEnc, otherPattern] of queryBytes) {
                if (otherEnc === encoding) break // Only check prior encodings
                if (otherPattern.toString('hex') === patternKey) {
                    isDuplicate = true
                    break
                }
            }
            if (isDuplicate) continue

            // Find all occurrences of the pattern in the file buffer
            const offsets = this.findAllOccurrences(fileBuffer, pattern)

            for (const offset of offsets) {
                if (matchedOffsets.has(offset)) continue
                matchedOffsets.add(offset)

                // Calculate line number and extract context
                const { lineNumber, lineContent, column } = this.getLineContext(
                    fileBuffer,
                    offset,
                    encoding,
                )

                matches.push({
                    filePath,
                    lineNumber,
                    lineContent,
                    matchEncoding: encoding,
                    column,
                })
            }
        }

        return matches
    }

    /**
     * Find all occurrences of a byte pattern in a buffer.
     * Simple but effective byte-by-byte search with early exit.
     */
    private findAllOccurrences(buffer: Buffer, pattern: Buffer): number[] {
        const offsets: number[] = []
        if (pattern.length === 0 || buffer.length < pattern.length) return offsets

        let pos = 0
        while (pos <= buffer.length - pattern.length) {
            const idx = buffer.indexOf(pattern, pos)
            if (idx === -1) break
            offsets.push(idx)
            pos = idx + 1
        }

        return offsets
    }

    /**
     * Given a byte offset in a file buffer, calculate the line number
     * and extract the surrounding line content.
     */
    private getLineContext(
        buffer: Buffer,
        offset: number,
        encoding: Encoding,
    ): { lineNumber: number; lineContent: string; column: number } {
        // Count newlines before offset to determine line number
        let lineNumber = 1
        let lineStart = 0

        for (let i = 0; i < offset; i++) {
            if (buffer[i] === 0x0A) { // \n
                lineNumber++
                lineStart = i + 1
            }
        }

        // Find end of current line
        let lineEnd = buffer.indexOf(0x0A, offset)
        if (lineEnd === -1) lineEnd = buffer.length

        // Remove trailing \r if present
        if (lineEnd > 0 && buffer[lineEnd - 1] === 0x0D) {
            lineEnd--
        }

        // Extract line bytes and decode
        const lineBytes = buffer.subarray(lineStart, Math.min(lineEnd, lineStart + 500))
        const lineContent = iconv.decode(lineBytes, encoding)
        const column = offset - lineStart

        return { lineNumber, lineContent, column }
    }

    /**
     * Recursively collect all files matching the given extensions.
     */
    private collectFiles(dirPath: string, extensions: Set<string>): string[] {
        const files: string[] = []

        const walk = (dir: string) => {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true })
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name)
                    if (entry.isDirectory()) {
                        // Skip hidden directories and common non-source directories
                        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
                        walk(fullPath)
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).toLowerCase()
                        if (extensions.has(ext)) {
                            files.push(fullPath)
                        }
                    }
                }
            } catch {
                // Skip directories we can't read
            }
        }

        walk(dirPath)
        return files
    }
}

export const searchEngine = new SearchEngine()
