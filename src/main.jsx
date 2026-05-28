import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Route API requests to the deployed API Gateway unconditionally
axios.defaults.baseURL = import.meta.env.VITE_API_GATEWAY_URL;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
