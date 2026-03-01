import React, { useCallback, useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import type { SearchResult, SearchMatch, Encoding } from '../../types'

export function SearchPanel() {
    const {
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        isSearching,
        setIsSearching,
        projectRoot,
        openFile,
    } = useEditorStore()

    const inputRef = useRef<HTMLInputElement>(null)
    const [localQuery, setLocalQuery] = useState(searchQuery)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleSearch = useCallback(async () => {
        if (!localQuery.trim() || !projectRoot) return

        setSearchQuery(localQuery)
        setIsSearching(true)

        try {
            const results = await window.jx2.search(localQuery, projectRoot)
            setSearchResults(results)
        } catch (err) {
            console.error('Search failed:', err)
            setSearchResults(null)
        } finally {
            setIsSearching(false)
        }
    }, [localQuery, projectRoot, setSearchQuery, setIsSearching, setSearchResults])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
        if (e.key === 'Escape') {
            useEditorStore.getState().toggleSearch()
        }
    }, [handleSearch])

    const handleResultClick = useCallback(async (match: SearchMatch) => {
        try {
            const result = await window.jx2.readFile(match.filePath, match.matchEncoding)
            const fileName = match.filePath.split('/').pop() || match.filePath
            openFile({
                id: match.filePath,
                filePath: match.filePath,
                fileName,
                content: result.content,
                encoding: result.encoding as Encoding,
                isDirty: false,
                isTabular: match.filePath.endsWith('.txt'),
            })
        } catch (err) {
            console.error('Failed to open search result:', err)
        }
    }, [openFile])

    const results = searchResults as SearchResult | null

    return (
        <div className="search-panel">
            <div className="search-header">
                <span style={{ fontSize: 14 }}>🔍</span>
                <input
                    ref={inputRef}
                    className="search-input"
                    type="text"
                    placeholder="Search across all encodings (UTF-8, GB18030, Windows-1252)..."
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="search-btn"
                    onClick={handleSearch}
                    disabled={isSearching || !localQuery.trim()}
                >
                    {isSearching ? '⏳ Searching...' : 'Search'}
                </button>
            </div>

            {results && (
                <>
                    <div className="search-stats">
                        {results.matches.length} results in {results.totalFiles} files ({results.searchTime}ms)
                        — Query: "{results.query}"
                    </div>
                    <div className="search-results">
                        {results.matches.map((match, i) => (
                            <div
                                key={`${match.filePath}:${match.lineNumber}:${i}`}
                                className="search-result-item"
                                onClick={() => handleResultClick(match)}
                            >
                                <span className="search-result-file">
                                    {match.filePath.split('/').slice(-2).join('/')}
                                </span>
                                <span className="search-result-line">
                                    :{match.lineNumber}
                                </span>
                                <span className="search-result-encoding">
                                    {match.matchEncoding}
                                </span>
                                <span className="search-result-content">
                                    {match.lineContent.substring(0, 120)}
                                </span>
                            </div>
                        ))}
                        {results.matches.length === 0 && (
                            <div className="empty-state" style={{ padding: 24 }}>
                                <span>No results found</span>
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                    Try a different query or check the project path
                                </span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
