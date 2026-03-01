import { contextBridge, ipcRenderer } from 'electron'

export type Encoding = 'gb18030' | 'windows-1252' | 'utf-8'

export interface FileEntry {
    name: string
    path: string
    isDirectory: boolean
    children?: FileEntry[]
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

const api = {
    // File operations
    readFile: (filePath: string, encoding: Encoding): Promise<FileReadResult> =>
        ipcRenderer.invoke('file:read', filePath, encoding),

    saveFile: (filePath: string, content: string, encoding: Encoding): Promise<void> =>
        ipcRenderer.invoke('file:save', filePath, content, encoding),

    listDirectory: (dirPath: string): Promise<FileEntry[]> =>
        ipcRenderer.invoke('file:listDir', dirPath),

    reinterpretFile: (filePath: string, newEncoding: Encoding): Promise<FileReadResult> =>
        ipcRenderer.invoke('file:reinterpret', filePath, newEncoding),

    selectDirectory: (): Promise<string | null> =>
        ipcRenderer.invoke('file:selectDir'),

    // Search operations
    search: (query: string, projectRoot: string, fileExtensions?: string[]): Promise<SearchResult> =>
        ipcRenderer.invoke('search:across', query, projectRoot, fileExtensions),

    // Log watcher operations
    watchLog: (logPath: string, id: string): Promise<void> =>
        ipcRenderer.invoke('log:watch', logPath, id),

    unwatchLog: (id: string): Promise<void> =>
        ipcRenderer.invoke('log:unwatch', id),

    onLogData: (callback: (id: string, data: string) => void) => {
        const handler = (_event: any, id: string, data: string) => callback(id, data)
        ipcRenderer.on('log:data', handler)
        return () => ipcRenderer.removeListener('log:data', handler)
    },

    // Window controls
    platform: process.platform,
}

contextBridge.exposeInMainWorld('jx2', api)

export type JX2API = typeof api
