import React, { useState, useRef, useCallback, useEffect } from 'react';
import CodeCell from './cells/CodeCell';
import MarkdownCell from './cells/MarkdownCell';
import { useNotebook } from '../hooks/useNotebook';
import { NotebookCell, CodeCell as CodeCellType } from '../types';
import './Notebook.css';

interface NotebookProps {
  initialName?: string;
}

const Notebook: React.FC<NotebookProps> = ({ initialName = 'Untitled Notebook' }) => {
  const {
    notebook,
    addCell,
    addPythonCell,
    deleteCell,
    updateCellContent,
    executeCell,
    moveCellUp,
    moveCellDown,
    changeCellType,
    changeCellLanguage,
    setNotebookName,
    clearAllOutputs,
    exportNotebook,
    importNotebook,
    pyodideLoaded,
    initializePyodideIfNeeded,
  } = useNotebook(initialName);

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pyodideInitMessage, setPyodideInitMessage] = useState<string | null>(null);

  // Initialize Pyodide when needed
  useEffect(() => {
    const loadPyodide = async () => {
      try {
        setPyodideInitMessage('Preloading Python environment...');
        await initializePyodideIfNeeded();
        setPyodideInitMessage(null);
      } catch (error) {
        setPyodideInitMessage('Failed to load Python environment. Some features may not work.');
        console.error('Failed to preload Pyodide:', error);
      }
    };

    loadPyodide();
  }, [initializePyodideIfNeeded]);

  // Handle file import
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        importNotebook(content);
      } catch (error) {
        console.error('Failed to import notebook:', error);
        alert('Invalid notebook file');
      }
    };
    reader.readAsText(file);
  }, [importNotebook]);

  // Trigger file input click
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Render each cell based on its type
  const renderCell = (cell: NotebookCell, index: number) => {
    if (cell.type === 'code') {
      const codeCell = cell as CodeCellType;
      return (
        <CodeCell
          key={cell.id}
          id={cell.id}
          content={cell.content}
          output={codeCell.output}
          isExecuting={codeCell.isExecuting}
          language={codeCell.language || 'javascript'}
          onContentChange={updateCellContent}
          onExecute={executeCell}
          onDelete={deleteCell}
          onAddCell={addCell}
          onAddPythonCell={addPythonCell}
          onMoveUp={moveCellUp}
          onMoveDown={moveCellDown}
          onChangeType={changeCellType}
          onChangeLanguage={changeCellLanguage}
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
            title="Add JavaScript Cell"
          >
            + JavaScript
          </button>
          <button 
            className="notebook-action-btn"
            onClick={() => addPythonCell(notebook.cells.length - 1)}
            title="Add Python Cell"
          >
            + Python
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

      {pyodideInitMessage && (
        <div className="pyodide-status-message">
          {pyodideInitMessage}
        </div>
      )}

      <div className="notebook-cells">
        {notebook.cells.map((cell, index) => renderCell(cell, index))}
      </div>

      <div className="notebook-footer">
        <div className="notebook-footer-buttons">
          <button 
            className="add-cell-btn"
            onClick={() => addCell('code', notebook.cells.length - 1)}
          >
            + Add JavaScript Cell
          </button>
          <button 
            className="add-cell-btn"
            onClick={() => addPythonCell(notebook.cells.length - 1)}
          >
            + Add Python Cell
          </button>
        </div>
        {!pyodideLoaded && (
          <div className="pyodide-status">
            Python environment not loaded yet. Click "Add Python Cell" to initialize.
          </div>
        )}
      </div>
    </div>
  );
};

export default Notebook; 