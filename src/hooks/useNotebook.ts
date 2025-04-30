import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { NotebookCell, CodeCell, MarkdownCell, Notebook } from '../types';
import { createCodeCell, createMarkdownCell, executeJavaScript } from '../utils/cell-utils';

export const useNotebook = (initialName: string = 'Untitled Notebook') => {
  // Create initial notebook state
  const [notebook, setNotebook] = useState<Notebook>({
    id: uuidv4(),
    name: initialName,
    cells: [createCodeCell('// Welcome to JupyterReact!\n// Type your code here and press Shift+Enter to execute')],
  });

  // Store variable scope for code execution context
  const [executionContext, setExecutionContext] = useState<{ [key: string]: any }>({});

  // Add a new cell
  const addCell = useCallback((type: 'code' | 'markdown', index: number) => {
    setNotebook((prev) => {
      const newCells = [...prev.cells];
      if (type === 'code') {
        newCells.splice(index + 1, 0, createCodeCell());
      } else {
        newCells.splice(index + 1, 0, createMarkdownCell());
      }
      return {
        ...prev,
        cells: newCells,
      };
    });
  }, []);

  // Delete a cell
  const deleteCell = useCallback((id: string) => {
    setNotebook((prev) => ({
      ...prev,
      cells: prev.cells.filter((cell) => cell.id !== id),
    }));
  }, []);

  // Update cell content
  const updateCellContent = useCallback((id: string, content: string) => {
    setNotebook((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) =>
        cell.id === id ? { ...cell, content } : cell
      ),
    }));
  }, []);

  // Execute code cell
  const executeCell = useCallback(async (id: string) => {
    // Find the cell to execute
    const cellIndex = notebook.cells.findIndex((cell) => cell.id === id);
    if (cellIndex === -1 || notebook.cells[cellIndex].type !== 'code') {
      return;
    }

    const cell = notebook.cells[cellIndex] as CodeCell;

    // Update the cell as executing
    setNotebook((prev) => ({
      ...prev,
      cells: prev.cells.map((c) =>
        c.id === id ? { ...c, isExecuting: true, output: '' } : c
      ),
    }));

    try {
      // Execute the code
      const { result, variables } = await executeJavaScript(cell.content, executionContext);
      
      // Update execution context
      setExecutionContext(variables);
      
      // Update the cell with the result
      setNotebook((prev) => ({
        ...prev,
        cells: prev.cells.map((c) =>
          c.id === id
            ? { ...c, isExecuting: false, output: result }
            : c
        ),
      }));
    } catch (error) {
      // Handle errors
      setNotebook((prev) => ({
        ...prev,
        cells: prev.cells.map((c) =>
          c.id === id
            ? { ...c, isExecuting: false, output: `Error: ${error.message}` }
            : c
        ),
      }));
    }
  }, [notebook.cells, executionContext]);

  // Move cell up
  const moveCellUp = useCallback((id: string) => {
    setNotebook((prev) => {
      const index = prev.cells.findIndex((cell) => cell.id === id);
      if (index <= 0) return prev;

      const newCells = [...prev.cells];
      const temp = newCells[index];
      newCells[index] = newCells[index - 1];
      newCells[index - 1] = temp;

      return {
        ...prev,
        cells: newCells,
      };
    });
  }, []);

  // Move cell down
  const moveCellDown = useCallback((id: string) => {
    setNotebook((prev) => {
      const index = prev.cells.findIndex((cell) => cell.id === id);
      if (index === -1 || index >= prev.cells.length - 1) return prev;

      const newCells = [...prev.cells];
      const temp = newCells[index];
      newCells[index] = newCells[index + 1];
      newCells[index + 1] = temp;

      return {
        ...prev,
        cells: newCells,
      };
    });
  }, []);

  // Change cell type
  const changeCellType = useCallback((id: string) => {
    setNotebook((prev) => {
      const index = prev.cells.findIndex((cell) => cell.id === id);
      if (index === -1) return prev;

      const cell = prev.cells[index];
      const newCells = [...prev.cells];

      if (cell.type === 'code') {
        newCells[index] = createMarkdownCell(cell.content);
      } else {
        newCells[index] = createCodeCell(cell.content);
      }

      return {
        ...prev,
        cells: newCells,
      };
    });
  }, []);

  // Set notebook name
  const setNotebookName = useCallback((name: string) => {
    setNotebook((prev) => ({
      ...prev,
      name,
    }));
  }, []);

  // Clear outputs of all code cells
  const clearAllOutputs = useCallback(() => {
    setNotebook((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) =>
        cell.type === 'code' ? { ...cell, output: '' } : cell
      ),
    }));
    setExecutionContext({});
  }, []);

  // Export notebook to JSON
  const exportNotebook = useCallback(() => {
    const notebookJson = JSON.stringify(notebook, null, 2);
    const blob = new Blob([notebookJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notebook.name.replace(/\s+/g, '_')}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }, [notebook]);

  // Import notebook from JSON
  const importNotebook = useCallback((notebookJson: string) => {
    try {
      const imported = JSON.parse(notebookJson) as Notebook;
      setNotebook(imported);
      setExecutionContext({});
    } catch (error) {
      console.error('Failed to import notebook:', error);
    }
  }, []);

  return {
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
    importNotebook,
  };
}; 