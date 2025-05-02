import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { NotebookCell, CodeCell, MarkdownCell, Notebook, CodeLanguage } from '../types';
import { 
  createCodeCell, 
  createMarkdownCell, 
  executeJavaScript, 
  executePython, 
  initPyodide
} from '../utils/cell-utils';

export const useNotebook = (initialName: string = 'Untitled Notebook') => {
  // Create initial notebook state
  const [notebook, setNotebook] = useState<Notebook>({
    id: uuidv4(),
    name: initialName,
    cells: [createCodeCell('// Welcome to JupyterReact!\n// Type your code here and press Shift+Enter to execute')],
  });

  // Store variable scope for code execution context
  const [executionContext, setExecutionContext] = useState<{ [key: string]: any }>({});
  
  // Track Pyodide initialization state
  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  
  // Initialize Pyodide if needed
  const initializePyodideIfNeeded = useCallback(async () => {
    if (!pyodideLoaded) {
      try {
        await initPyodide();
        setPyodideLoaded(true);
        return true;
      } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        return false;
      }
    }
    return true;
  }, [pyodideLoaded]);

  // Add a new cell
  const addCell = useCallback((type: 'code' | 'markdown', index: number, language: CodeLanguage = 'javascript') => {
    setNotebook((prev) => {
      const newCells = [...prev.cells];
      if (type === 'code') {
        const newCell = createCodeCell();
        if (language === 'python') {
          newCell.language = 'python';
          newCell.content = '# Type your Python code here';
        }
        newCells.splice(index + 1, 0, newCell);
      } else {
        newCells.splice(index + 1, 0, createMarkdownCell());
      }
      return {
        ...prev,
        cells: newCells,
      };
    });
  }, []);

  // Add a Python cell specifically
  const addPythonCell = useCallback((index: number) => {
    addCell('code', index, 'python');
  }, [addCell]);

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

  // Change cell language
  const changeCellLanguage = useCallback((id: string, language: CodeLanguage) => {
    setNotebook((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) =>
        cell.id === id && cell.type === 'code' 
          ? { ...cell as CodeCell, language } 
          : cell
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
      // Execute code based on language
      let result: string;
      let variables: { [key: string]: any };
      
      if (cell.language === 'python') {
        // Make sure Pyodide is initialized for Python cells
        const isPyodideReady = await initializePyodideIfNeeded();
        if (!isPyodideReady) {
          throw new Error('Failed to initialize Python environment');
        }
        
        // Execute Python code
        const pyResult = await executePython(cell.content, executionContext);
        result = pyResult.result;
        variables = pyResult.variables;
      } else {
        // Execute JavaScript code
        const jsResult = await executeJavaScript(cell.content, executionContext);
        result = jsResult.result;
        variables = jsResult.variables;
      }
      
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
  }, [notebook.cells, executionContext, initializePyodideIfNeeded]);

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
  };
}; 