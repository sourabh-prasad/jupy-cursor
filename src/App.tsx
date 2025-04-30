import React from 'react'
import './App.css'
import Notebook from './components/Notebook'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>JupyterReact</h1>
        <p>A React-based Jupyter notebook alternative</p>
      </header>
      <main className="app-content">
        <Notebook initialName="My First Notebook" />
      </main>
      <footer className="app-footer">
        <p>React-based Jupyter notebook running in the browser</p>
      </footer>
    </div>
  )
}

export default App
