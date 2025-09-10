// packages/host/src/bootstrap.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { eventBus } from './utils/eventBus';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider';

// Host container identification
window.name = 'host-container';

// Expose eventBus globally for cross-app communication
if (typeof window !== 'undefined') {
  (window as any).eventBus = eventBus;
  console.log('✅ EventBus exposed to window at:', new Date().toISOString());

  // Optional: Debug log all events
  const originalEmit = eventBus.emit.bind(eventBus);
  eventBus.emit = function (event: any, data: any) {
    console.log(`📡 EventBus emit: ${event}`, data);
    return originalEmit(event, data);
  };
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
