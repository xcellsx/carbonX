import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom' // <-- 1. Import this

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/carbonX"> {/* <-- 2. Wrap <App /> here */}
      <App />
    </BrowserRouter>
  </StrictMode>,
)