/**
 * Log watcher IPC handlers — tail JX2 server logs in real-time.
 * Uses chokidar to watch for file changes and streams new content to the renderer.
 */

import { IpcMain, BrowserWindow } from 'electron'
import * as fs from 'fs'
import * as chokidar from 'chokidar'

interface LogWatcher {
    watcher: chokidar.FSWatcher
    filePath: string
    lastSize: number
}

const activeWatchers = new Map<string, LogWatcher>()

export function registerLogHandlers(ipcMain: IpcMain, mainWindow: BrowserWindow) {
    // Start watching a log file
    ipcMain.handle('log:watch', async (_event, logPath: string, id: string) => {
        // Clean up existing watcher for this id
        if (activeWatchers.has(id)) {
            const existing = activeWatchers.get(id)!
            await existing.watcher.close()
            activeWatchers.delete(id)
        }

        try {
            // Get initial file size
            let lastSize = 0
            try {
                const stat = fs.statSync(logPath)
                lastSize = stat.size

                // Send last 4KB of existing content
                const tailSize = Math.min(stat.size, 4096)
                const buffer = Buffer.alloc(tailSize)
                const fd = fs.openSync(logPath, 'r')
                fs.readSync(fd, buffer, 0, tailSize, stat.size - tailSize)
                fs.closeSync(fd)

                const content = buffer.toString('utf-8')
                mainWindow.webContents.send('log:data', id, content)
            } catch {
                // File doesn't exist yet, that's ok
            }

            // Watch for changes
            const watcher = chokidar.watch(logPath, {
                persistent: true,
                usePolling: true,
                interval: 500,
            })

            watcher.on('change', (filePath) => {
                try {
                    const stat = fs.statSync(filePath)
                    if (stat.size > lastSize) {
                        // Read only new bytes
                        const newBytes = stat.size - lastSize
                        const buffer = Buffer.alloc(newBytes)
                        const fd = fs.openSync(filePath, 'r')
                        fs.readSync(fd, buffer, 0, newBytes, lastSize)
                        fs.closeSync(fd)

                        const content = buffer.toString('utf-8')
                        mainWindow.webContents.send('log:data', id, content)
                        lastSize = stat.size
                    } else if (stat.size < lastSize) {
                        // File was truncated/rotated — read from beginning
                        const buffer = fs.readFileSync(filePath)
                        const content = buffer.toString('utf-8')
                        mainWindow.webContents.send('log:data', id, '\n--- Log rotated ---\n' + content)
                        lastSize = stat.size
                    }
                } catch {
                    // File may have been deleted
                }
            })

            activeWatchers.set(id, { watcher, filePath: logPath, lastSize })
        } catch (err: any) {
            throw new Error(`Failed to watch log: ${err.message}`)
        }
    })

    // Stop watching a log file
    ipcMain.handle('log:unwatch', async (_event, id: string) => {
        const watcher = activeWatchers.get(id)
        if (watcher) {
            await watcher.watcher.close()
            activeWatchers.delete(id)
        }
    })
}
