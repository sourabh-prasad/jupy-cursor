import React, { useRef, useEffect, useState, KeyboardEvent } from 'react';
import Editor from '@monaco-editor/react';
import { CodeLanguage } from '../../types';
import './CodeCell.css';

interface CodeCellProps {
  id: string;
  content: string;
  output: string;
  isExecuting: boolean;
  language: CodeLanguage;
  onContentChange: (id: string, content: string) => void;
  onExecute: (id: string) => void;
  onDelete: (id: string) => void;
  onAddCell: (type: 'code' | 'markdown', index: number) => void;
  onAddPythonCell?: (index: number) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onChangeType: (id: string) => void;
  onChangeLanguage: (id: string, language: CodeLanguage) => void;
  index: number;
}

const CodeCell: React.FC<CodeCellProps> = ({
  id,
  content,
  output,
  isExecuting,
  language,
  onContentChange,
  onExecute,
  onDelete,
  onAddCell,
  onAddPythonCell,
  onMoveUp,
  onMoveDown,
  onChangeType,
  onChangeLanguage,
  index,
}) => {
  const editorRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Handle editor mounting
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Add keyboard event listener for Shift+Enter to execute
    editor.onKeyDown((e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        onExecute(id);
      }
    });
  };

  // Toggle language between JavaScript and Python
  const toggleLanguage = () => {
    const newLanguage: CodeLanguage = language === 'javascript' ? 'python' : 'javascript';
    onChangeLanguage(id, newLanguage);
  };

  return (
    <div className={`code-cell ${isFocused ? 'focused' : ''}`}>
      <div className="cell-toolbar">
        <div className="cell-type">
          Code ({language === 'javascript' ? 'JS' : 'Python'})
          <button 
            className="lang-toggle-btn" 
            onClick={toggleLanguage}
            title={`Switch to ${language === 'javascript' ? 'Python' : 'JavaScript'}`}
          >
            Switch to {language === 'javascript' ? 'Python' : 'JS'}
          </button>
        </div>
        <div className="cell-actions">
          <button
            className="cell-action-btn"
            onClick={() => onChangeType(id)}
            title="Change to Markdown"
          >
            <span>M</span>
          </button>
          <button
            className="cell-action-btn"
            onClick={() => onMoveUp(id)}
            title="Move Up"
            disabled={index === 0}
          >
            <span>↑</span>
          </button>
          <button
            className="cell-action-btn"
            onClick={() => onMoveDown(id)}
            title="Move Down"
          >
            <span>↓</span>
          </button>
          <button
            className="cell-action-btn"
            onClick={() => onAddCell('code', index)}
            title="Add Code Cell Below"
          >
            <span>+JS</span>
          </button>
          {onAddPythonCell && (
            <button
              className="cell-action-btn"
              onClick={() => onAddPythonCell(index)}
              title="Add Python Cell Below"
            >
              <span>+Py</span>
            </button>
          )}
          <button
            className="cell-action-btn"
            onClick={() => onDelete(id)}
            title="Delete Cell"
          >
            <span>×</span>
          </button>
        </div>
      </div>

      <div className="editor-container">
        <Editor
          height="auto"
          defaultValue={content}
          value={content}
          language={language}
          theme="vs-dark"
          onChange={(value) => onContentChange(id, value || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            automaticLayout: true,
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>

      <div className="execution-actions">
        <button 
          className="execute-btn" 
          onClick={() => onExecute(id)}
          disabled={isExecuting}
        >
          {isExecuting ? 'Executing...' : 'Execute'}
        </button>
        {language === 'python' && (
          <div className="python-indicator">Python</div>
        )}
      </div>

      {output && (
        <div className="cell-output">
          <pre>{output}</pre>
        </div>
      )}
    </div>
  );
};

export default CodeCell; 