import React, { useCallback, useEffect, useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import type { FileEntry, Encoding } from '../../types'
import { FolderIcon, FolderOpenIcon, FileIcon, ChevronIcon, GearIcon, DotIcon } from '../Icons'

import { ContextMenu, ContextMenuAction } from './ContextMenu'
import { Modal, ModalProps } from './Modal'

function getFileIcon(entry: FileEntry) {
    if (entry.isDirectory) return { icon: <FolderIcon />, className: 'folder' }
    const ext = entry.extension || ''
    if (ext === '.lua') return { icon: <FileIcon />, className: 'lua' }
    if (ext === '.ini' || ext === '.cfg') return { icon: <GearIcon />, className: 'ini' }
    return { icon: <FileIcon />, className: 'txt' }
}

interface TreeItemProps {
    entry: FileEntry
    depth: number
    onContextMenu: (e: React.MouseEvent, entry: FileEntry | null, refreshItem: () => void, refreshParent: () => void) => void
    parentRefresh: () => void
}

function TreeItem({ entry, depth, onContextMenu, parentRefresh }: TreeItemProps) {
    const {
        expandedDirs,
        toggleDir,
        openFile,
        activeTabId,
        openTabs,
    } = useEditorStore()

    const [children, setChildren] = useState<FileEntry[]>([])
    const [loaded, setLoaded] = useState(false)

    const isExpanded = expandedDirs.has(entry.path)
    const isActive = openTabs.some(t => t.filePath === entry.path && t.id === activeTabId)
    const isDirty = !entry.isDirectory && openTabs.some(t => t.filePath === entry.path && t.isDirty)
    const { icon, className } = getFileIcon(entry)

    const loadChildren = useCallback(async () => {
        if (!entry.isDirectory) return
        try {
            const items = await window.jx2.listDirectory(entry.path)
            setChildren(items)
            setLoaded(true)
        } catch (err) {
            console.error('Failed to load directory:', err)
        }
    }, [entry])

    const handleClick = useCallback(async () => {
        if (entry.isDirectory) {
            toggleDir(entry.path)
            if (!loaded) loadChildren()
        } else {
            try {
                const result = await window.jx2.readFile(entry.path, undefined as any)
                const isTxt = entry.extension === '.txt'
                openFile({
                    id: entry.path,
                    filePath: entry.path,
                    fileName: entry.displayName,
                    content: result.content,
                    encoding: result.encoding as Encoding,
                    isDirty: false,
                    isTabular: isTxt,
                })
            } catch (err) {
                console.error('Failed to read file:', err)
            }
        }
    }, [entry, loaded, toggleDir, openFile, loadChildren])

    const handleContextMenu = (e: React.MouseEvent) => {
        e.stopPropagation()
        onContextMenu(e, entry, loadChildren, parentRefresh)
    }

    const indent = depth * 16 + 8

    return (
        <>
            <div
                className={`tree-item ${isActive ? 'active' : ''} ${isDirty ? 'dirty' : ''}`}
                style={{ '--indent': `${indent}px` } as React.CSSProperties}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                title={entry.path}
            >
                {entry.isDirectory && (
                    <span className={`tree-icon chevron ${isExpanded ? 'expanded' : ''}`}>
                        <ChevronIcon />
                    </span>
                )}
                <span className={`tree-icon ${className}`}>{icon}</span>
                <span className="tree-name">
                    {entry.displayName}
                    {isDirty && (
                        <span className="tree-dirty-dot" title="Unsaved changes">
                            <DotIcon size={6} color="var(--accent-orange)" />
                        </span>
                    )}
                </span>
            </div>
            {entry.isDirectory && isExpanded && children.map((child) => (
                <TreeItem
                    key={child.path}
                    entry={child}
                    depth={depth + 1}
                    onContextMenu={onContextMenu}
                    parentRefresh={loadChildren}
                />
            ))}
        </>
    )
}

export function FileExplorer() {
    const { fileTree, projectRoot, setFileTree, clipboard, setClipboard, toggleDir } = useEditorStore()
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, actions: ContextMenuAction[] } | null>(null)
    const [modalConfig, setModalConfig] = useState<ModalProps | null>(null)

    const requestPrompt = (title: string, defaultValue: string = ''): Promise<string | null> => {
        return new Promise((resolve) => {
            setModalConfig({
                title,
                isPrompt: true,
                defaultValue,
                onConfirm: (val?: string) => { setModalConfig(null); resolve(val || null) },
                onCancel: () => { setModalConfig(null); resolve(null) }
            })
        })
    }

    const requestConfirm = (title: string, message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setModalConfig({
                title,
                message,
                danger: true,
                confirmLabel: 'Delete',
                onConfirm: () => { setModalConfig(null); resolve(true) },
                onCancel: () => { setModalConfig(null); resolve(false) }
            })
        })
    }

    const refreshRoot = async () => {
        if (!projectRoot) return
        try {
            const tree = await window.jx2.listDirectory(projectRoot)
            setFileTree(tree)
        } catch (err) {
            console.error(err)
        }
    }

    // Triggered when a context menu action completes on a child directory
    const handleContextMenu = (e: React.MouseEvent, entry: FileEntry | null, refreshItem?: () => void, refreshParent?: () => void) => {
        e.preventDefault()
        e.stopPropagation()

        const targetPath = entry ? entry.path : projectRoot
        if (!targetPath) return

        const isDir = entry ? entry.isDirectory : true

        // refreshItem targets the clicked item (if it's a dir, it refreshes inside it)
        // refreshParent targets the container holding the clicked item
        const doRefreshItem = refreshItem || refreshRoot
        const doRefreshParent = refreshParent || refreshRoot

        const actions: ContextMenuAction[] = [
            {
                label: 'New File',
                disabled: !isDir,
                onClick: async () => {
                    const name = await requestPrompt('New file name:')
                    if (name) {
                        try {
                            await window.jx2.createFile(`${targetPath}/${name}`, false)
                            console.log('Created file successfully')
                            await doRefreshItem()
                        } catch (err) {
                            console.error('Failed to create file:', err)
                            alert(`Failed to create file: ${err}`)
                        }
                    }
                }
            },
            {
                label: 'New Folder',
                disabled: !isDir,
                onClick: async () => {
                    const name = await requestPrompt('New folder name:')
                    if (name) {
                        try {
                            await window.jx2.createFile(`${targetPath}/${name}`, true)
                            console.log('Created folder successfully')
                            await doRefreshItem()
                        } catch (err) {
                            console.error('Failed to create folder:', err)
                            alert(`Failed to create folder: ${err}`)
                        }
                    }
                }
            },
            { separator: true },
            {
                label: 'Rename',
                disabled: !entry,
                onClick: async () => {
                    if (!entry) return
                    const newName = await requestPrompt('Rename to:', entry.name)
                    if (newName && newName !== entry.name) {
                        try {
                            // Extract directory path by removing the old filename
                            const parentDir = targetPath.substring(0, targetPath.lastIndexOf('/'))
                            const newPath = `${parentDir}/${newName}`

                            await window.jx2.renameFile(targetPath, newPath)
                            console.log('Renamed successfully to', newPath)
                            await doRefreshParent()
                        } catch (err) {
                            console.error('Failed to rename:', err)
                            alert(`Failed to rename: ${err}`)
                        }
                    }
                }
            },
            {
                label: 'Delete',
                disabled: !entry,
                onClick: async () => {
                    if (!entry) return
                    if (await requestConfirm('Confirm Deletion', `Are you sure you want to delete ${entry.name}?`)) {
                        try {
                            await window.jx2.deleteFile(targetPath)
                            console.log('Deleted successfully')
                            await doRefreshParent()
                        } catch (err) {
                            console.error('Failed to delete:', err)
                            alert(`Failed to delete: ${err}`)
                        }
                    }
                }
            },
            { separator: true },
            {
                label: 'Cut',
                disabled: !entry,
                onClick: () => {
                    if (entry) {
                        setClipboard({ action: 'cut', path: targetPath })
                        console.log('Cut to clipboard:', targetPath)
                    }
                }
            },
            {
                label: 'Copy',
                disabled: !entry,
                onClick: () => {
                    if (entry) {
                        setClipboard({ action: 'copy', path: targetPath })
                        console.log('Copied to clipboard:', targetPath)
                    }
                }
            },
            {
                label: 'Paste',
                disabled: !isDir || !clipboard,
                onClick: async () => {
                    if (!clipboard) return
                    const sourceName = clipboard.path.split('/').pop()
                    if (!sourceName) return
                    const destPath = `${targetPath}/${sourceName}`

                    try {
                        if (clipboard.action === 'cut') {
                            await window.jx2.renameFile(clipboard.path, destPath)
                            setClipboard(null)
                        } else {
                            await window.jx2.copyFile(clipboard.path, destPath)
                        }
                        console.log('Pasted successfully to', destPath)
                        await doRefreshItem()
                        await refreshRoot() // Safefy fallback if we pasted across the tree
                    } catch (err) {
                        console.error('Failed to paste:', err)
                        alert(`Failed to paste: ${err}`)
                    }
                }
            }
        ]

        setContextMenu({ x: e.clientX, y: e.clientY, actions })
    }

    if (!projectRoot || fileTree.length === 0) {
        return (
            <div className="file-tree" onContextMenu={(e) => handleContextMenu(e, null)}>
                <div className="empty-state">
                    <div className="empty-state-icon"><FolderOpenIcon size={32} /></div>
                    <span>No folder open</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        Use Ctrl+O to open a project
                    </span>
                </div>
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        actions={contextMenu.actions}
                        onClose={() => setContextMenu(null)}
                    />
                )}
                {modalConfig && <Modal {...modalConfig} />}
            </div>
        )
    }

    return (
        <div className="file-tree" onContextMenu={(e) => handleContextMenu(e, null)}>
            {fileTree.map((entry) => (
                <TreeItem
                    key={entry.path}
                    entry={entry}
                    depth={0}
                    onContextMenu={handleContextMenu}
                    parentRefresh={refreshRoot}
                />
            ))}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    actions={contextMenu.actions}
                    onClose={() => setContextMenu(null)}
                />
            )}
            {modalConfig && <Modal {...modalConfig} />}
        </div>
    )
}
