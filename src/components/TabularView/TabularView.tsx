import React, { useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import type { OpenTab } from '../../stores/editorStore'
import { useEditorStore } from '../../stores/editorStore'

interface TabularViewProps {
    tab: OpenTab
}

export function TabularView({ tab }: TabularViewProps) {
    const { updateTabContent } = useEditorStore()

    // Parse TSV content into rows and columns
    const { columnDefs, rowData } = useMemo(() => {
        const lines = tab.content.split(/\r?\n/).filter((l) => l.trim().length > 0)
        if (lines.length === 0) return { columnDefs: [], rowData: [] }

        // First line is the header
        const headerLine = lines[0]
        const delimiter = headerLine.includes('\t') ? '\t' : ','
        const headers = headerLine.split(delimiter)

        const columnDefs = headers.map((header, index) => ({
            headerName: header.trim() || `Col ${index + 1}`,
            field: `col_${index}`,
            editable: true,
            resizable: true,
            sortable: true,
            filter: true,
            minWidth: 80,
            flex: 1,
        }))

        const rowData = lines.slice(1).map((line, rowIndex) => {
            const cells = line.split(delimiter)
            const row: Record<string, any> = { __rowIndex: rowIndex + 1 }
            headers.forEach((_, colIndex) => {
                row[`col_${colIndex}`] = cells[colIndex] ?? ''
            })
            return row
        })

        return { columnDefs, rowData }
    }, [tab.content])

    // Handle cell edits — reconstruct TSV and update tab content
    const handleCellValueChanged = useCallback((params: any) => {
        if (!params.data) return

        const lines = tab.content.split(/\r?\n/)
        const delimiter = lines[0].includes('\t') ? '\t' : ','
        const headers = lines[0].split(delimiter)

        // Reconstruct the changed line
        const dataRowIndex = params.data.__rowIndex
        const newCells = headers.map((_, colIndex) => params.data[`col_${colIndex}`] ?? '')
        lines[dataRowIndex] = newCells.join(delimiter)

        const newContent = lines.join('\r\n')
        updateTabContent(tab.id, newContent)
    }, [tab.content, tab.id, updateTabContent])

    if (rowData.length === 0) {
        return (
            <div className="tabular-view">
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <span>No tabular data found</span>
                </div>
            </div>
        )
    }

    return (
        <div className="tabular-view">
            <div className="tabular-grid ag-theme-alpine-dark">
                <AgGridReact
                    columnDefs={columnDefs}
                    rowData={rowData}
                    onCellValueChanged={handleCellValueChanged}
                    defaultColDef={{
                        resizable: true,
                        sortable: true,
                        filter: true,
                        editable: true,
                    }}
                    animateRows={true}
                    suppressRowClickSelection={true}
                    rowSelection="multiple"
                    enableCellTextSelection={true}
                />
            </div>
        </div>
    )
}
