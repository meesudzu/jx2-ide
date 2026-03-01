/**
 * Global type declarations for the JX2 API exposed via preload.
 */

export type Encoding = 'gb18030' | 'windows-1252' | 'utf-8'

export interface FileEntry {
    name: string
    displayName: string
    path: string
    isDirectory: boolean
    children?: FileEntry[]
    extension?: string
}

export interface FileReadResult {
    content: string
    encoding: Encoding
    rawBufferBase64: string
}

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

export interface JX2API {
    readFile: (filePath: string, encoding: Encoding) => Promise<FileReadResult>
    saveFile: (filePath: string, content: string, encoding: Encoding) => Promise<void>
    listDirectory: (dirPath: string) => Promise<FileEntry[]>
    reinterpretFile: (filePath: string, newEncoding: Encoding) => Promise<FileReadResult>
    selectDirectory: () => Promise<string | null>
    search: (query: string, projectRoot: string, fileExtensions?: string[]) => Promise<SearchResult>
    watchLog: (logPath: string, id: string) => Promise<void>
    unwatchLog: (id: string) => Promise<void>
    onLogData: (callback: (id: string, data: string) => void) => () => void
    platform: string
    createFile: (targetPath: string, isDirectory: boolean) => Promise<void>
    renameFile: (oldPath: string, newPath: string) => Promise<void>
    deleteFile: (targetPath: string) => Promise<void>
    copyFile: (sourcePath: string, targetPath: string) => Promise<void>
}

declare global {
    interface Window {
        jx2: JX2API
    }
}
