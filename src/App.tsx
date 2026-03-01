import React, { useCallback, useEffect } from 'react'
import { useEditorStore } from './stores/editorStore'
import { FileExplorer } from './components/FileExplorer/FileExplorer'
import { TabBar } from './components/TabBar/TabBar'
import { EditorPane } from './components/Editor/EditorPane'
import { StatusBar } from './components/StatusBar/StatusBar'
import { SearchPanel } from './components/SearchPanel/SearchPanel'
import { LogWatcher } from './components/LogWatcher/LogWatcher'

export default function App() {
    const {
        projectRoot,
        setProjectRoot,
        setFileTree,
        openTabs,
        activeTabId,
        showSearch,
        toggleSearch,
        showLogPanel,
        toggleLogPanel,
    } = useEditorStore()

    const loadProject = useCallback(async (root: string) => {
        setProjectRoot(root)
        try {
            const tree = await window.jx2.listDirectory(root)
            setFileTree(tree)
        } catch (err) {
            console.error('Failed to load project:', err)
        }
    }, [setProjectRoot, setFileTree])

    const handleOpenFolder = useCallback(async () => {
        const dir = await window.jx2.selectDirectory()
        if (dir) {
            loadProject(dir)
        }
    }, [loadProject])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Shift+F — Global search
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault()
                toggleSearch()
            }
            // Ctrl+` — Toggle log panel
            if (e.ctrlKey && e.key === '`') {
                e.preventDefault()
                toggleLogPanel()
            }
            // Ctrl+S — Save current file
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault()
                const activeTab = useEditorStore.getState().openTabs.find(
                    t => t.id === useEditorStore.getState().activeTabId
                )
                if (activeTab && activeTab.isDirty) {
                    window.jx2.saveFile(activeTab.filePath, activeTab.content, activeTab.encoding)
                        .then(() => useEditorStore.getState().markTabClean(activeTab.id))
                        .catch(console.error)
                }
            }
            // Ctrl+O — Open folder
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault()
                handleOpenFolder()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [toggleSearch, toggleLogPanel, handleOpenFolder])

    const activeTab = openTabs.find(t => t.id === activeTabId)

    return (
        <div className="app-container">
            {/* Title bar */}
            <div className="titlebar">
                <span className="titlebar-logo">JX2</span>
                <span className="titlebar-title">
                    DevStudio {projectRoot ? `— ${projectRoot.split('/').pop()}` : ''}
                </span>
                <div className="titlebar-actions">
                    <button className="titlebar-btn" onClick={handleOpenFolder} title="Open Folder (Ctrl+O)">
                        📂
                    </button>
                    <button className={`titlebar-btn ${showSearch ? 'active' : ''}`}
                        onClick={toggleSearch} title="Search (Ctrl+Shift+F)">
                        🔍
                    </button>
                    <button className={`titlebar-btn ${showLogPanel ? 'active' : ''}`}
                        onClick={toggleLogPanel} title="Log Watcher (Ctrl+`)">
                        📋
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="main-content">
                {/* Sidebar */}
                <div className="sidebar">
                    <div className="sidebar-header">
                        <span className="sidebar-title">Explorer</span>
                        <div className="sidebar-actions">
                            <button className="sidebar-btn" onClick={handleOpenFolder} title="Open Folder">
                                📂
                            </button>
                        </div>
                    </div>
                    <FileExplorer />
                </div>

                {/* Editor area */}
                <div className="editor-area">
                    {showSearch && <SearchPanel />}
                    {openTabs.length > 0 ? (
                        <>
                            <TabBar />
                            <EditorPane tab={activeTab || null} />
                        </>
                    ) : (
                        <div className="welcome">
                            <div className="welcome-logo">JX2 DevStudio</div>
                            <div className="welcome-subtitle">
                                A specialized IDE for JX2 game server development with multi-encoding support for GB18030 &amp; Windows-1252
                            </div>
                            <button className="welcome-btn" onClick={handleOpenFolder}>
                                📂 Open Project Folder
                            </button>
                            <div className="welcome-shortcuts">
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+O</kbd> Open Folder
                                </div>
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+S</kbd> Save File
                                </div>
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+Shift+F</kbd> Global Search
                                </div>
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+`</kbd> Log Watcher
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Log panel */}
                    {showLogPanel && <LogWatcher />}
                </div>
            </div>

            {/* Status bar */}
            <StatusBar />
        </div>
    )
}
