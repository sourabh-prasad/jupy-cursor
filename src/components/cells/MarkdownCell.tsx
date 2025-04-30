import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { marked } from 'marked';
import './MarkdownCell.css';

interface MarkdownCellProps {
  id: string;
  content: string;
  onContentChange: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onAddCell: (type: 'code' | 'markdown', index: number) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onChangeType: (id: string) => void;
  index: number;
}

const MarkdownCell: React.FC<MarkdownCellProps> = ({
  id,
  content,
  onContentChange,
  onDelete,
  onAddCell,
  onMoveUp,
  onMoveDown,
  onChangeType,
  index,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [parsedMarkdown, setParsedMarkdown] = useState('');

  useEffect(() => {
    // Parse markdown on content change
    setParsedMarkdown(marked.parse(content));
  }, [content]);

  return (
    <div className={`markdown-cell ${isEditing ? 'editing' : ''}`}>
      <div className="cell-toolbar">
        <div className="cell-type">Markdown</div>
        <div className="cell-actions">
          <button
            className="cell-action-btn"
            onClick={() => onChangeType(id)}
            title="Change to Code"
          >
            <span>C</span>
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
            onClick={() => onAddCell('markdown', index)}
            title="Add Markdown Cell Below"
          >
            <span>+</span>
          </button>
          <button
            className="cell-action-btn"
            onClick={() => onDelete(id)}
            title="Delete Cell"
          >
            <span>×</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="editor-container">
          <Editor
            height="auto"
            defaultValue={content}
            language="markdown"
            theme="vs-dark"
            onChange={(value) => onContentChange(id, value || '')}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'off',
              renderLineHighlight: 'all',
              automaticLayout: true,
            }}
          />
          <div className="markdown-actions">
            <button
              className="preview-btn"
              onClick={() => setIsEditing(false)}
            >
              Preview
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="markdown-display" 
          onClick={() => setIsEditing(true)}
          dangerouslySetInnerHTML={{ __html: parsedMarkdown }}
        />
      )}
    </div>
  );
};

export default MarkdownCell; 