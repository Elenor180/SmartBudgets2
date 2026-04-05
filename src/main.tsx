import React from 'react';
import ReactDOM from 'react-dom/client';
import { WorkspaceProvider } from '@/app/WorkspaceProvider';
import { App } from '@/app/App';
import '@/styles.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container was not found.');
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </React.StrictMode>,
);
