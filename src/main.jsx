import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Route API requests to the API Gateway when deployed.
// Locally, it falls back to relative paths and uses the vite proxy.
if (import.meta.env.VITE_API_GATEWAY_URL && import.meta.env.VITE_API_GATEWAY_URL !== 'http://localhost:8080') {
  axios.defaults.baseURL = import.meta.env.VITE_API_GATEWAY_URL;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
