import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'

interface LogTab {
    id: string
    name: string
    path: string
}

const DEFAULT_LOG_TABS: LogTab[] = [
    { id: 'gs', name: 'Game Server', path: '' },
    { id: 'relay', name: 'S3 Relay', path: '' },
    { id: 'gateway', name: 'Gateway', path: '' },
]

export function LogWatcher() {
    const { toggleLogPanel, projectRoot } = useEditorStore()
    const [logTabs] = useState<LogTab[]>(DEFAULT_LOG_TABS)
    const [activeLogTab, setActiveLogTab] = useState('gs')
    const [logContent, setLogContent] = useState<Record<string, string>>({})
    const [filter, setFilter] = useState('')
    const contentRef = useRef<HTMLDivElement>(null)
    const cleanupRef = useRef<(() => void) | null>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight
        }
    }, [logContent, activeLogTab])

    // Setup log listener
    useEffect(() => {
        const cleanup = window.jx2.onLogData((id: string, data: string) => {
            setLogContent((prev) => ({
                ...prev,
                [id]: (prev[id] || '') + data,
            }))
        })
        cleanupRef.current = cleanup
        return () => cleanup()
    }, [])

    const handlePathInput = useCallback(async (logId: string) => {
        // For now, use a simple prompt-style approach
        const defaultPaths: Record<string, string> = {
            gs: `${projectRoot || '.'}/gs0/server.log`,
            relay: `${projectRoot || '.'}/gw/Relay/relay.log`,
            gateway: `${projectRoot || '.'}/gw/Goddess/goddess.log`,
        }
        const logPath = defaultPaths[logId]
        if (logPath) {
            try {
                await window.jx2.watchLog(logPath, logId)
            } catch (err) {
                setLogContent((prev) => ({
                    ...prev,
                    [logId]: `⚠️ Could not watch: ${logPath}\n${err}\n\nTip: Set the correct log path for this server component.`,
                }))
            }
        }
    }, [projectRoot])

    const currentContent = logContent[activeLogTab] || 'No log data yet. Click a tab to start watching.\n\nExpected log locations:\n  • Game Server: gs0/server.log\n  • S3 Relay: gw/Relay/relay.log\n  • Gateway: gw/Goddess/goddess.log'

    // Apply filter
    const filteredContent = filter
        ? currentContent
            .split('\n')
            .filter((line) => line.toLowerCase().includes(filter.toLowerCase()))
            .join('\n')
        : currentContent

    // Colorize log lines
    const renderLogLine = (line: string, index: number) => {
        let className = ''
        const lower = line.toLowerCase()
        if (lower.includes('error') || lower.includes('fail') || lower.includes('exception')) {
            className = 'log-line-error'
        } else if (lower.includes('warn') || lower.includes('warning')) {
            className = 'log-line-warn'
        } else if (lower.includes('info') || lower.includes('connect') || lower.includes('start')) {
            className = 'log-line-info'
        }
        return (
            <span key={index} className={className}>
                {line}
                {'\n'}
            </span>
        )
    }

    return (
        <div className="log-panel">
            <div className="log-header">
                <span className="log-title">Log Watcher</span>
                <div className="log-tabs">
                    {logTabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`log-tab ${tab.id === activeLogTab ? 'active' : ''}`}
                            onClick={() => {
                                setActiveLogTab(tab.id)
                                handlePathInput(tab.id)
                            }}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
                <input
                    className="log-filter"
                    type="text"
                    placeholder="Filter logs..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
                <button className="log-close" onClick={toggleLogPanel} title="Close">
                    ×
                </button>
            </div>
            <div className="log-content" ref={contentRef}>
                {filteredContent.split('\n').map(renderLogLine)}
            </div>
        </div>
    )
}
