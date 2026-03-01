import React, { useCallback, useRef, useEffect, useState } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import { useEditorStore, OpenTab } from '../../stores/editorStore'
import { TabularView } from '../TabularView/TabularView'

interface EditorPaneProps {
    tab: OpenTab | null
}

export function EditorPane({ tab }: EditorPaneProps) {
    const { updateTabContent } = useEditorStore()
    const editorRef = useRef<any>(null)
    const [showGrid, setShowGrid] = useState(false)

    // Reset grid view when switching tabs
    useEffect(() => {
        setShowGrid(tab?.isTabular ?? false)
    }, [tab?.id])

    const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
        editorRef.current = editor

        // Register Lua language if not already registered
        if (!monaco.languages.getLanguages().some((l: any) => l.id === 'lua')) {
            monaco.languages.register({ id: 'lua' })
            monaco.languages.setMonarchTokensProvider('lua', {
                defaultToken: '',
                tokenPostfix: '.lua',
                keywords: [
                    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
                    'function', 'goto', 'if', 'in', 'local', 'nil', 'not', 'or',
                    'repeat', 'return', 'then', 'true', 'until', 'while',
                ],
                brackets: [
                    { open: '{', close: '}', token: 'delimiter.curly' },
                    { open: '[', close: ']', token: 'delimiter.square' },
                    { open: '(', close: ')', token: 'delimiter.parenthesis' },
                ],
                operators: ['+', '-', '*', '/', '%', '^', '#', '==', '~=', '<=', '>=', '<', '>', '=', ';', ':', ',', '.', '..', '...'],
                symbols: /[=><!~?:&|+\-*\/\^%]+/,
                tokenizer: {
                    root: [
                        [/--\[([=]*)\[/, 'comment', '@comment.$1'],
                        [/--.*$/, 'comment'],
                        [/\[([=]*)\[/, 'string', '@string.$1'],
                        [/"([^"\\]|\\.)*$/, 'string.invalid'],
                        [/'([^'\\]|\\.)*$/, 'string.invalid'],
                        [/"/, 'string', '@string_double'],
                        [/'/, 'string', '@string_single'],
                        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                        [/\d+/, 'number'],
                        [/[,;]/, 'delimiter'],
                        [/[a-zA-Z_]\w*/, {
                            cases: {
                                '@keywords': { token: 'keyword.$0' },
                                '@default': 'identifier',
                            },
                        }],
                    ],
                    comment: [
                        [/[^\]]+/, 'comment'],
                        [/\]([=]*)\]/, {
                            cases: {
                                '$1==$S2': { token: 'comment', next: '@pop' },
                                '@default': 'comment',
                            },
                        }],
                        [/./, 'comment'],
                    ],
                    string: [
                        [/[^\]]+/, 'string'],
                        [/\]([=]*)\]/, {
                            cases: {
                                '$1==$S2': { token: 'string', next: '@pop' },
                                '@default': 'string',
                            },
                        }],
                        [/./, 'string'],
                    ],
                    string_double: [
                        [/[^\\"]+/, 'string'],
                        [/\\./, 'string.escape'],
                        [/"/, 'string', '@pop'],
                    ],
                    string_single: [
                        [/[^\\']+/, 'string'],
                        [/\\./, 'string.escape'],
                        [/'/, 'string', '@pop'],
                    ],
                },
            } as any)
        }

        // Set editor theme
        monaco.editor.defineTheme('jx2-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: 'c678dd', fontStyle: 'bold' },
                { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
                { token: 'string', foreground: 'ce9178' },
                { token: 'number', foreground: 'b5cea8' },
                { token: 'identifier', foreground: 'e6edf3' },
                { token: 'delimiter', foreground: '8b949e' },
                { token: 'number.float', foreground: 'b5cea8' },
                { token: 'number.hex', foreground: 'b5cea8' },
                { token: 'string.escape', foreground: 'd7ba7d' },
            ],
            colors: {
                'editor.background': '#0d1117',
                'editor.foreground': '#e6edf3',
                'editor.lineHighlightBackground': '#161b2280',
                'editor.selectionBackground': '#1f6feb44',
                'editorLineNumber.foreground': '#6e7681',
                'editorLineNumber.activeForeground': '#e6edf3',
                'editorCursor.foreground': '#58a6ff',
                'editor.inactiveSelectionBackground': '#1f6feb22',
            },
        })
        monaco.editor.setTheme('jx2-dark')
    }, [])

    const handleChange = useCallback((value: string | undefined) => {
        if (tab && value !== undefined) {
            updateTabContent(tab.id, value)
        }
    }, [tab?.id, updateTabContent])

    if (!tab) {
        return (
            <div className="editor-pane">
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <span>Select a file to edit</span>
                </div>
            </div>
        )
    }

    // Show tabular view for TSV files
    if (showGrid && tab.isTabular) {
        return (
            <div className="editor-pane">
                <div className="tabular-toolbar">
                    <button className="toggle-view" onClick={() => setShowGrid(false)}>
                        📝 Switch to Text View
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        Grid View — {tab.encoding.toUpperCase()}
                    </span>
                </div>
                <TabularView tab={tab} />
            </div>
        )
    }

    // Determine language based on file extension
    const ext = tab.filePath.split('.').pop()?.toLowerCase()
    const language = ext === 'lua' ? 'lua' : ext === 'ini' ? 'ini' : 'plaintext'

    return (
        <div className="editor-pane">
            {tab.isTabular && (
                <div className="tabular-toolbar">
                    <button className="toggle-view" onClick={() => setShowGrid(true)}>
                        📊 Switch to Grid View
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        Text View — {tab.encoding.toUpperCase()}
                    </span>
                </div>
            )}
            <div className="monaco-editor-container">
                <Editor
                    key={tab.id + tab.encoding}
                    language={language}
                    value={tab.content}
                    onChange={handleChange}
                    onMount={handleEditorDidMount}
                    theme="jx2-dark"
                    options={{
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontSize: 13,
                        lineHeight: 20,
                        minimap: { enabled: true, scale: 1 },
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        renderLineHighlight: 'all',
                        bracketPairColorization: { enabled: true },
                        padding: { top: 8, bottom: 8 },
                        wordWrap: 'off',
                        automaticLayout: true,
                    }}
                />
            </div>
        </div>
    )
}
