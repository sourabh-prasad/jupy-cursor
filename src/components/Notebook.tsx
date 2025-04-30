import React, { useState, useRef, useCallback } from 'react';
import CodeCell from './cells/CodeCell';
import MarkdownCell from './cells/MarkdownCell';
import { useNotebook } from '../hooks/useNotebook';
import { NotebookCell } from '../types';
import './Notebook.css';

interface NotebookProps {
  initialName?: string;
}

const Notebook: React.FC<NotebookProps> = ({ initialName = 'Untitled Notebook' }) => {
  const {
    notebook,
    addCell,
    deleteCell,
    updateCellContent,
    executeCell,
    moveCellUp,
    moveCellDown,
    changeCellType,
    setNotebookName,
    clearAllOutputs,
    exportNotebook,
  } = useNotebook(initialName);

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file import
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // TODO: Implement import functionality
        console.log('File imported:', content);
      } catch (error) {
        console.error('Failed to import notebook:', error);
        alert('Invalid notebook file');
      }
    };
    reader.readAsText(file);
  }, []);

  // Trigger file input click
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Render each cell based on its type
  const renderCell = (cell: NotebookCell, index: number) => {
    if (cell.type === 'code') {
      return (
        <CodeCell
          key={cell.id}
          id={cell.id}
          content={cell.content}
          output={cell.output}
          isExecuting={cell.isExecuting}
          onContentChange={updateCellContent}
          onExecute={executeCell}
          onDelete={deleteCell}
          onAddCell={addCell}
          onMoveUp={moveCellUp}
          onMoveDown={moveCellDown}
          onChangeType={changeCellType}
          index={index}
        />
      );
    } else {
      return (
        <MarkdownCell
          key={cell.id}
          id={cell.id}
          content={cell.content}
          onContentChange={updateCellContent}
          onDelete={deleteCell}
          onAddCell={addCell}
          onMoveUp={moveCellUp}
          onMoveDown={moveCellDown}
          onChangeType={changeCellType}
          index={index}
        />
      );
    }
  };

  return (
    <div className="notebook-container">
      <div className="notebook-header">
        <div className="notebook-title">
          <input
            type="text"
            value={notebook.name}
            onChange={(e) => setNotebookName(e.target.value)}
            className="notebook-title-input"
          />
        </div>
        <div className="notebook-actions">
          <button 
            className="notebook-action-btn"
            onClick={() => addCell('code', notebook.cells.length - 1)}
            title="Add Code Cell"
          >
            + Code
          </button>
          <button 
            className="notebook-action-btn"
            onClick={() => addCell('markdown', notebook.cells.length - 1)}
            title="Add Markdown Cell"
          >
            + Markdown
          </button>
          <button 
            className="notebook-action-btn"
            onClick={clearAllOutputs}
            title="Clear All Outputs"
          >
            Clear Outputs
          </button>
          <button 
            className="notebook-action-btn"
            onClick={exportNotebook}
            title="Export Notebook"
          >
            Export
          </button>
          <button 
            className="notebook-action-btn"
            onClick={handleImportClick}
            title="Import Notebook"
          >
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      <div className="notebook-cells">
        {notebook.cells.map((cell, index) => renderCell(cell, index))}
      </div>

      <div className="notebook-footer">
        <button 
          className="add-cell-btn"
          onClick={() => addCell('code', notebook.cells.length - 1)}
        >
          + Add Cell
        </button>
      </div>
    </div>
  );
};

export default Notebook; 