// packages/host/src/bootstrap.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { eventBus } from './utils/eventBus';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider';
import { seedRegistryFromStatic } from './utils/registrySeeder';

// Mark this as host container
window.name = 'host-container';

// Expose eventBus for cross-app communication
if (typeof window !== 'undefined') {
  (window as any).eventBus = eventBus;
  console.log('✅ EventBus exposed to window at:', new Date().toISOString());

  // Debug: log all events
  const originalEmit = eventBus.emit.bind(eventBus);
  eventBus.emit = function (event: any, data: any) {
    console.log(`📡 EventBus emit: ${event}`, data);
    return originalEmit(event, data);
  };
}

// Seed registry if configured, then mount
seedRegistryFromStatic().finally(() => {
  const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
});
