import { v4 as uuidv4 } from 'uuid';
import { CodeCell, MarkdownCell, NotebookCell } from '../types';
import { loadPyodide } from 'pyodide';

let pyodideInstance: any = null;
let isPyodideLoading = false;
let pyodideLoadPromise: Promise<any> | null = null;

export const createCodeCell = (content: string = ''): CodeCell => ({
  id: uuidv4(),
  type: 'code',
  content,
  output: '',
  isExecuting: false,
  language: 'javascript', // Default language
});

export const createMarkdownCell = (content: string = ''): MarkdownCell => ({
  id: uuidv4(),
  type: 'markdown',
  content,
});

// Initialize Pyodide
export const initPyodide = async (): Promise<any> => {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (isPyodideLoading) {
    return pyodideLoadPromise;
  }

  isPyodideLoading = true;
  
  try {
    pyodideLoadPromise = loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
    });
    
    pyodideInstance = await pyodideLoadPromise;
    
    // Configure Python stdout redirection right after loading
    await pyodideInstance.runPythonAsync(`
      import sys
      from js import console
      
      class BrowserConsole:
          def __init__(self):
              self.buffer = ""
              
          def write(self, text):
              self.buffer += text
              return len(text)
              
          def flush(self):
              pass
              
          def getvalue(self):
              return self.buffer
      
      sys.stdout = BrowserConsole()
      sys.stderr = BrowserConsole()
    `);
    
    console.log('Pyodide loaded successfully');
    return pyodideInstance;
  } catch (error) {
    console.error('Failed to load Pyodide:', error);
    throw error;
  } finally {
    isPyodideLoading = false;
  }
};

// Execute Python code using Pyodide
export const executePython = async (
  code: string,
  prevResults: { [key: string]: any } = {}
): Promise<{ result: string; variables: { [key: string]: any } }> => {
  let result = '';
  const variables = { ...prevResults };

  try {
    // Make sure Pyodide is initialized
    if (!pyodideInstance) {
      try {
        result = 'Initializing Python environment...\n';
        pyodideInstance = await initPyodide();
      } catch (error: any) {
        return {
          result: `Failed to initialize Python: ${error.message}`,
          variables
        };
      }
    }
    
    // Wrap the user code with output capture
    const wrappedCode = `
import io
import sys
from js import document

# Create string buffer for capturing output
_jupy_stdout_capture = io.StringIO()
_jupy_stderr_capture = io.StringIO()

# Save original stdout/stderr
_jupy_original_stdout = sys.stdout
_jupy_original_stderr = sys.stderr

# Redirect stdout/stderr to our capture buffer
sys.stdout = _jupy_stdout_capture
sys.stderr = _jupy_stderr_capture

# Execute the user code
try:
    _jupy_result = None
    ${code}
    _jupy_result
finally:
    # Restore original stdout/stderr
    sys.stdout = _jupy_original_stdout
    sys.stderr = _jupy_original_stderr

# Return the captured output
_jupy_stdout_output = _jupy_stdout_capture.getvalue()
_jupy_stderr_output = _jupy_stderr_capture.getvalue()

# For debugging
if _jupy_stdout_output:
    print("Captured stdout:", repr(_jupy_stdout_output))

{
    "stdout": _jupy_stdout_output,
    "stderr": _jupy_stderr_output,
    "result": _jupy_result
}
`;

    // Run the wrapped code
    const pyResultObj = pyodideInstance.runPython(wrappedCode);
    
    // Extract results
    const capturedOutput = pyResultObj.toJs();
    const stdout = capturedOutput.get("stdout");
    const stderr = capturedOutput.get("stderr");
    const pyResult = capturedOutput.get("result");
    
    // Add stdout to result
    if (stdout) {
      result = stdout;
    }
    
    // Add stderr to result if any
    if (stderr) {
      result += (result ? '\n' : '') + stderr;
    }
    
    // Format the return value if any
    if (pyResult !== undefined && pyResult !== null) {
      try {
        const jsResult = pyResult.toJs ? pyResult.toJs() : pyResult;
        const resultStr = typeof jsResult === 'object' 
          ? JSON.stringify(jsResult, null, 2) 
          : String(jsResult);
        
        if (resultStr !== 'undefined' && resultStr !== 'None') {
          result += (result ? '\n' : '') + resultStr;
        }
      } catch (e) {
        // If conversion fails, use string representation
        if (String(pyResult) !== 'None') {
          result += (result ? '\n' : '') + String(pyResult);
        }
      }
    }
    
    return { result, variables };
  } catch (error: any) {
    console.error('Python execution error:', error);
    return { 
      result: `Error: ${error.message || String(error)}`,
      variables
    };
  }
};

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