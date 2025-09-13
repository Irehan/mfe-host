import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { eventBus } from './utils/eventBus';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider';
import { seedRegistryFromStatic } from './utils/registrySeeder';

window.name = 'host-container';

if (typeof window !== 'undefined') {
  (window as any).eventBus = eventBus;
  console.log('✅ EventBus exposed to window at:', new Date().toISOString());

  const originalEmit = eventBus.emit.bind(eventBus);
  eventBus.emit = function (event: any, data: any) {
    console.log(`📡 EventBus emit: ${event}`, data);
    return originalEmit(event, data);
  };
}

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
