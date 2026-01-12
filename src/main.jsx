import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import "antd/dist/reset.css";


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>

    <App></App>
    
    </BrowserRouter>
  </React.StrictMode>

)
