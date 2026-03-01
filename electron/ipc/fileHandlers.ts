/**
 * File IPC handlers — bridge between renderer and EncodingManager.
 */

import { IpcMain, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { encodingManager, Encoding } from '../core/EncodingManager'

export interface FileEntry {
    name: string
    displayName: string
    path: string
    isDirectory: boolean
    children?: FileEntry[]
    extension?: string
}

export function registerFileHandlers(ipcMain: IpcMain) {
    // Read a file with specified or auto-detected encoding
    ipcMain.handle('file:read', (_event, filePath: string, encoding?: Encoding) => {
        try {
            const rawBuffer = fs.readFileSync(filePath)
            const detectedEncoding = encoding || encodingManager.detectEncodingWithHint(rawBuffer, filePath)
            const result = encodingManager.readFile(filePath, detectedEncoding)
            return result
        } catch (err: any) {
            throw new Error(`Failed to read file: ${err.message}`)
        }
    })

    // Save file with specified encoding
    ipcMain.handle('file:save', (_event, filePath: string, content: string, encoding: Encoding) => {
        try {
            encodingManager.saveFile(filePath, content, encoding)
        } catch (err: any) {
            throw new Error(`Failed to save file: ${err.message}`)
        }
    })

    // Helper to resolve duplicate file names by appending (1), (2), etc.
    const resolveDuplicatePath = (targetPath: string): string => {
        if (!fs.existsSync(targetPath)) return targetPath

        const parsed = path.parse(targetPath)
        let newPath = targetPath
        let counter = 1

        while (fs.existsSync(newPath)) {
            newPath = path.join(parsed.dir, `${parsed.name} (${counter})${parsed.ext}`)
            counter++
        }
        return newPath
    }

    // Create a new empty file or directory
    ipcMain.handle('file:create', (_event, targetPath: string, isDirectory: boolean) => {
        try {
            const finalPath = resolveDuplicatePath(targetPath)
            if (isDirectory) {
                fs.mkdirSync(finalPath, { recursive: true })
            } else {
                fs.writeFileSync(finalPath, '')
            }
        } catch (err: any) {
            throw new Error(`Failed to create: ${err.message}`)
        }
    })

    // Rename a file or directory
    ipcMain.handle('file:rename', (_event, oldPath: string, newPath: string) => {
        try {
            const finalPath = resolveDuplicatePath(newPath)
            fs.renameSync(oldPath, finalPath)
        } catch (err: any) {
            throw new Error(`Failed to rename: ${err.message}`)
        }
    })

    // Delete a file or directory
    ipcMain.handle('file:delete', (_event, targetPath: string) => {
        try {
            fs.rmSync(targetPath, { recursive: true, force: true })
        } catch (err: any) {
            throw new Error(`Failed to delete: ${err.message}`)
        }
    })

    // Copy a file or directory
    ipcMain.handle('file:copy', (_event, sourcePath: string, targetPath: string) => {
        try {
            const finalPath = resolveDuplicatePath(targetPath)
            fs.cpSync(sourcePath, finalPath, { recursive: true })
        } catch (err: any) {
            throw new Error(`Failed to copy: ${err.message}`)
        }
    })

    // List directory contents with GB18030 filename decoding
    ipcMain.handle('file:listDir', (_event, dirPath: string) => {
        try {
            return listDirectoryRecursive(dirPath, 1)
        } catch (err: any) {
            throw new Error(`Failed to list directory: ${err.message}`)
        }
    })

    // Re-interpret a cached file with a different encoding
    ipcMain.handle('file:reinterpret', (_event, filePath: string, newEncoding: Encoding) => {
        try {
            return encodingManager.reinterpret(filePath, newEncoding)
        } catch (err: any) {
            throw new Error(`Failed to reinterpret file: ${err.message}`)
        }
    })

    // Open a directory selection dialog
    ipcMain.handle('file:selectDir', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Open JX2 Project Folder',
        })
        if (result.canceled || result.filePaths.length === 0) return null
        return result.filePaths[0]
    })
}

/**
 * List directory entries, decoding filenames and expanding one level.
 */
function listDirectoryRecursive(dirPath: string, depth: number): FileEntry[] {
    const entries: FileEntry[] = []

    try {
        const dirEntries = fs.readdirSync(dirPath, { withFileTypes: true })

        for (const entry of dirEntries) {
            // Skip hidden files/dirs
            if (entry.name.startsWith('.')) continue

            const fullPath = path.join(dirPath, entry.name)
            const displayName = encodingManager.decodeFilename(entry.name)
            const ext = path.extname(entry.name).toLowerCase()

            const fileEntry: FileEntry = {
                name: entry.name,
                displayName,
                path: fullPath,
                isDirectory: entry.isDirectory(),
                extension: ext || undefined,
            }

            // Lazy loading: only expand children for first level
            if (entry.isDirectory() && depth > 0) {
                try {
                    // Just check if it has children, don't fully expand
                    const childCount = fs.readdirSync(fullPath).length
                    fileEntry.children = childCount > 0 ? [] : undefined
                } catch {
                    // Can't read directory
                }
            }

            entries.push(fileEntry)
        }

        // Sort: directories first, then alphabetically
        entries.sort((a, b) => {
            if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
            return a.displayName.localeCompare(b.displayName)
        })
    } catch {
        // Skip unreadable directories
    }

    return entries
}
