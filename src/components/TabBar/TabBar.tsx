import React from 'react'
import { useEditorStore } from '../../stores/editorStore'

export function TabBar() {
    const { openTabs, activeTabId, setActiveTab, closeTab } = useEditorStore()

    return (
        <div className="tabbar">
            {openTabs.map((tab) => (
                <div
                    key={tab.id}
                    className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                >
                    {tab.isDirty && <span className="tab-dot" title="Unsaved changes" />}
                    <span className="tab-name" title={tab.filePath}>
                        {tab.fileName}
                    </span>
                    <button
                        className="tab-close"
                        onClick={(e) => {
                            e.stopPropagation()
                            closeTab(tab.id)
                        }}
                        title="Close"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    )
}
