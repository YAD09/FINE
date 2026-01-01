
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { getErrorMessage } from './services/api';

// Global error handler for unhandled promise rejections (like 'Failed to fetch' in background)
window.addEventListener('unhandledrejection', (event) => {
  const errorMsg = getErrorMessage(event.reason);
  if (errorMsg.includes("Network Error")) {
    console.warn("Caught unhandled network rejection. Failover to Demo Mode initiated.");
    // The getErrorMessage call already triggers setDemoMode(true)
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
