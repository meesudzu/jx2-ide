import React, { useEffect } from 'react'

export interface ContextMenuAction {
    label?: string
    onClick?: () => void
    disabled?: boolean
    separator?: boolean
}

interface ContextMenuProps {
    x: number
    y: number
    actions: ContextMenuAction[]
    onClose: () => void
}

export function ContextMenu({ x, y, actions, onClose }: ContextMenuProps) {
    useEffect(() => {
        const handleClick = () => onClose()
        // Use mousedown instead of click to fire before React's synthetic onClick
        // which may get swallowed or bypassed if the component unmounts too fast
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [onClose])

    return (
        <div
            className="context-menu"
            style={{ top: y, left: x }}
            onContextMenu={(e) => { e.preventDefault(); onClose() }}
        >
            {actions.map((action, i) => {
                if (action.separator) {
                    return <div key={i} className="context-menu-separator" />
                }
                return (
                    <div
                        key={i}
                        className={`context-menu-item ${action.disabled ? 'disabled' : ''}`}
                        onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (!action.disabled && action.onClick) {
                                action.onClick()
                                onClose()
                            }
                        }}
                    >
                        {action.label}
                    </div>
                )
            })}
        </div>
    )
}
