import React, { useState, useEffect, useRef } from 'react'

export interface ModalProps {
    title: string
    message?: string
    isPrompt?: boolean
    defaultValue?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    onConfirm: (value?: string) => void
    onCancel: () => void
}

export function Modal({
    title,
    message,
    isPrompt,
    defaultValue = '',
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    danger,
    onConfirm,
    onCancel
}: ModalProps) {
    const [inputValue, setInputValue] = useState(defaultValue)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isPrompt && inputRef.current) {
            inputRef.current.focus()
            // Select all text if there's a default, or just focus
            if (defaultValue) {
                inputRef.current.select()
            }
        }
    }, [isPrompt, defaultValue])

    const handleConfirm = () => {
        if (isPrompt) {
            onConfirm(inputValue)
        } else {
            onConfirm()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleConfirm()
        if (e.key === 'Escape') onCancel()
    }

    return (
        <div className="modal-overlay" onMouseDown={(e) => {
            if (e.target === e.currentTarget) onCancel()
        }}>
            <div className="modal">
                <div className="modal-header">{title}</div>
                <div className="modal-body">
                    {message && <div>{message}</div>}
                    {isPrompt && (
                        <input
                            ref={inputRef}
                            className="modal-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    )}
                </div>
                <div className="modal-footer">
                    <button className="modal-btn secondary" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        className={`modal-btn ${danger ? 'danger' : 'primary'}`}
                        onClick={handleConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
