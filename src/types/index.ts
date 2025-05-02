export type CellType = 'code' | 'markdown';
export type CodeLanguage = 'javascript' | 'python';

export interface Cell {
  id: string;
  type: CellType;
  content: string;
}

export interface CodeCell extends Cell {
  type: 'code';
  output: string;
  isExecuting: boolean;
  language: CodeLanguage;
}

export interface MarkdownCell extends Cell {
  type: 'markdown';
}

export type NotebookCell = CodeCell | MarkdownCell;

export interface Notebook {
  id: string;
  name: string;
  cells: NotebookCell[];
} 