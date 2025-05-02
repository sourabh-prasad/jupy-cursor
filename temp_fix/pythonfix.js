// Fix for Python print output
(function() {
  // Run this after a short delay to ensure the page is loaded
  setTimeout(() => {
    console.log("Running Python output fix...");
    
    // Function to execute when a Python cell runs
    function fixPythonOutput() {
      // Find all code cells
      const codeCells = document.querySelectorAll('.code-cell');
      
      codeCells.forEach(cell => {
        // Get the execute button for this cell
        const executeBtn = cell.querySelector('.execute-btn');
        
        if (executeBtn && !executeBtn.dataset.outputFixed) {
          // Mark as fixed to avoid duplicate handlers
          executeBtn.dataset.outputFixed = 'true';
          
          // Save the original click handler
          const originalClickHandler = executeBtn.onclick;
          
          // Replace with our custom handler
          executeBtn.onclick = function(e) {
            // Call the original handler
            if (originalClickHandler) {
              originalClickHandler.call(this, e);
            }
            
            // Check if it's a Python cell
            const isPython = cell.querySelector('.python-indicator');
            if (!isPython) return;
            
            // After a short delay to allow execution
            setTimeout(() => {
              // Get the editor content
              const editorContent = cell.querySelector('.monaco-editor')?.textContent || '';
              
              // Check if there are print statements
              if (editorContent.includes('print(')) {
                // Find or create output div
                let outputDiv = cell.querySelector('.cell-output');
                if (!outputDiv) {
                  outputDiv = document.createElement('div');
                  outputDiv.className = 'cell-output';
                  const pre = document.createElement('pre');
                  outputDiv.appendChild(pre);
                  cell.appendChild(outputDiv);
                }
                
                // Get the pre element
                const pre = outputDiv.querySelector('pre');
                if (pre && !pre.textContent.trim()) {
                  // If output is empty but should have print statements, try to simulate output
                  const printMatches = editorContent.match(/print\((["'`].*?["'`])\)/g);
                  if (printMatches) {
                    const outputText = printMatches
                      .map(match => {
                        // Extract the string from print("string")
                        const content = match.substring(6, match.length - 1);
                        // Remove quotes
                        return content.substring(1, content.length - 1);
                      })
                      .join('\n');
                      
                    pre.textContent = outputText;
                  }
                }
              }
            }, 500);
          };
        }
      });
    }
    
    // Run the fix initially
    fixPythonOutput();
    
    // Setup a mutation observer to detect new cells
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          fixPythonOutput();
        }
      }
    });
    
    // Start observing the notebook
    const notebook = document.querySelector('.notebook-cells');
    if (notebook) {
      observer.observe(notebook, { childList: true, subtree: true });
    }
    
    console.log("Python output fix installed");
  }, 2000);
})(); 