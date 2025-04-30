import { v4 as uuidv4 } from 'uuid';
import { CodeCell, MarkdownCell, NotebookCell } from '../types';

export const createCodeCell = (content: string = ''): CodeCell => ({
  id: uuidv4(),
  type: 'code',
  content,
  output: '',
  isExecuting: false,
});

export const createMarkdownCell = (content: string = ''): MarkdownCell => ({
  id: uuidv4(),
  type: 'markdown',
  content,
});

export const executeJavaScript = async (
  code: string,
  prevResults: { [key: string]: any } = {}
): Promise<{ result: string; variables: { [key: string]: any } }> => {
  const variables: { [key: string]: any } = { ...prevResults };
  let result = '';

  try {
    // Create a function that has access to previous variables
    const executeFunction = new Function(
      'variables',
      `
      // Map variables to the local scope
      Object.entries(variables).forEach(([key, value]) => {
        if (key !== 'require' && key !== 'exports' && key !== 'module') {
          globalThis[key] = value;
        }
      });
      
      // Capture console.log output
      const logs = [];
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
        originalConsoleLog.apply(console, args);
      };
      
      // Execute the code
      try {
        const result = eval(\`${code}\`);
        
        // Restore original console.log
        console.log = originalConsoleLog;
        
        // Gather all variables defined in the global scope
        const newVars = {};
        Object.keys(globalThis).forEach(key => {
          if (key !== 'require' && key !== 'exports' && key !== 'module') {
            newVars[key] = globalThis[key];
          }
        });
        
        return { 
          result: result !== undefined ? result : undefined, 
          logs, 
          variables: newVars 
        };
      } catch (error) {
        // Restore original console.log
        console.log = originalConsoleLog;
        throw error;
      }
    `
    );

    const { result: evalResult, logs, variables: newVars } = executeFunction(variables);
    
    // Format the result
    if (evalResult !== undefined) {
      result += typeof evalResult === 'object' 
        ? JSON.stringify(evalResult, null, 2) 
        : String(evalResult);
    }
    
    // Add logs to the result
    if (logs && logs.length > 0) {
      result += (result ? '\n' : '') + logs.join('\n');
    }
    
    // Update variables with new ones
    Object.assign(variables, newVars);
    
    return { result, variables };
  } catch (error) {
    console.error('Execution error:', error);
    return { 
      result: `Error: ${error.message}`,
      variables
    };
  }
}; 