import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//import React from 'react'
//import ReactDom from 'react-dom/client'
//above 2 didn't work
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
