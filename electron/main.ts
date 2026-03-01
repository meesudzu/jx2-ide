import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { registerFileHandlers } from './ipc/fileHandlers'
import { registerSearchHandlers } from './ipc/searchHandlers'
import { registerLogHandlers } from './ipc/logHandlers'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
    ? process.env.DIST
    : path.join(process.env.DIST, '../public')

let mainWindow: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: 'JX2 DevStudio',
        backgroundColor: '#0d1117',
        titleBarStyle: 'hiddenInset',
        frame: process.platform !== 'darwin',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    })

    // Register IPC handlers
    registerFileHandlers(ipcMain)
    registerSearchHandlers(ipcMain)
    registerLogHandlers(ipcMain, mainWindow)

    if (VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(VITE_DEV_SERVER_URL)
    } else {
        mainWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        mainWindow = null
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(createWindow)
