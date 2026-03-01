/**
 * Search IPC handlers — expose cross-encoding search to the renderer.
 */

import { IpcMain } from 'electron'
import { searchEngine } from '../core/SearchEngine'

export function registerSearchHandlers(ipcMain: IpcMain) {
    ipcMain.handle(
        'search:across',
        async (_event, query: string, projectRoot: string, fileExtensions?: string[]) => {
            try {
                return await searchEngine.searchAcrossEncodings(query, projectRoot, fileExtensions)
            } catch (err: any) {
                throw new Error(`Search failed: ${err.message}`)
            }
        }
    )
}
