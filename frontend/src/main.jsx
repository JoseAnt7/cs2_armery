import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { applyColorTheme } from './utils/applyColorTheme'
import App from './App.jsx'

applyColorTheme('orange')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
