/**
 * Zustand store for JX2 DevStudio editor state.
 */

import { create } from 'zustand'
import type { Encoding, FileEntry } from './types'

export interface OpenTab {
    id: string
    filePath: string
    fileName: string
    content: string
    encoding: Encoding
    isDirty: boolean
    isTabular: boolean // TSV grid view for .txt files
}

interface EditorState {
    // Project
    projectRoot: string | null
    setProjectRoot: (root: string) => void

    // File tree
    fileTree: FileEntry[]
    setFileTree: (tree: FileEntry[]) => void
    expandedDirs: Set<string>
    toggleDir: (path: string) => void

    // Tabs
    openTabs: OpenTab[]
    activeTabId: string | null
    openFile: (tab: OpenTab) => void
    closeTab: (id: string) => void
    setActiveTab: (id: string) => void
    updateTabContent: (id: string, content: string) => void
    updateTabEncoding: (id: string, encoding: Encoding, content: string) => void
    markTabClean: (id: string) => void

    // Search
    searchQuery: string
    setSearchQuery: (query: string) => void
    searchResults: any | null
    setSearchResults: (results: any) => void
    isSearching: boolean
    setIsSearching: (searching: boolean) => void

    // Panels
    showSearch: boolean
    toggleSearch: () => void
    showLogPanel: boolean
    toggleLogPanel: () => void
    sidebarWidth: number
    setSidebarWidth: (width: number) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
    // Project
    projectRoot: null,
    setProjectRoot: (root) => set({ projectRoot: root }),

    // File tree
    fileTree: [],
    setFileTree: (tree) => set({ fileTree: tree }),
    expandedDirs: new Set<string>(),
    toggleDir: (path) =>
        set((state) => {
            const dirs = new Set(state.expandedDirs)
            if (dirs.has(path)) {
                dirs.delete(path)
            } else {
                dirs.add(path)
            }
            return { expandedDirs: dirs }
        }),

    // Tabs
    openTabs: [],
    activeTabId: null,

    openFile: (tab) =>
        set((state) => {
            // Check if already open
            const existing = state.openTabs.find((t) => t.filePath === tab.filePath)
            if (existing) {
                return { activeTabId: existing.id }
            }
            return {
                openTabs: [...state.openTabs, tab],
                activeTabId: tab.id,
            }
        }),

    closeTab: (id) =>
        set((state) => {
            const tabs = state.openTabs.filter((t) => t.id !== id)
            let activeId = state.activeTabId
            if (activeId === id) {
                const idx = state.openTabs.findIndex((t) => t.id === id)
                activeId = tabs[Math.min(idx, tabs.length - 1)]?.id ?? null
            }
            return { openTabs: tabs, activeTabId: activeId }
        }),

    setActiveTab: (id) => set({ activeTabId: id }),

    updateTabContent: (id, content) =>
        set((state) => ({
            openTabs: state.openTabs.map((t) =>
                t.id === id ? { ...t, content, isDirty: true } : t
            ),
        })),

    updateTabEncoding: (id, encoding, content) =>
        set((state) => ({
            openTabs: state.openTabs.map((t) =>
                t.id === id ? { ...t, encoding, content, isDirty: false } : t
            ),
        })),

    markTabClean: (id) =>
        set((state) => ({
            openTabs: state.openTabs.map((t) =>
                t.id === id ? { ...t, isDirty: false } : t
            ),
        })),

    // Search
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
    searchResults: null,
    setSearchResults: (results) => set({ searchResults: results }),
    isSearching: false,
    setIsSearching: (searching) => set({ isSearching: searching }),

    // Panels
    showSearch: false,
    toggleSearch: () => set((state) => ({ showSearch: !state.showSearch })),
    showLogPanel: false,
    toggleLogPanel: () => set((state) => ({ showLogPanel: !state.showLogPanel })),
    sidebarWidth: 280,
    setSidebarWidth: (width) => set({ sidebarWidth: width }),
}))
