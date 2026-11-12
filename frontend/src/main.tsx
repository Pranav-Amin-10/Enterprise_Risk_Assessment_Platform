import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

// Default live Cloudflare Worker API URL
const CLOUDFLARE_WORKER_API = 'https://enterprise-risk-assessment-api.aminpranav.workers.dev';

// Intercept global fetch to prefix with live API worker URL or simulate via mock database
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const isAdminMode = localStorage.getItem('grc_admin_mode') === 'true';
  const urlPath = typeof input === 'string' ? input : '';

  if (isAdminMode && urlPath.startsWith('/api')) {
    const { handleMockRequest } = await import('./utils/mockApi');
    return handleMockRequest(urlPath, init);
  }

  let url = input;
  if (typeof input === 'string' && input.startsWith('/api')) {
    const apiBase = import.meta.env.VITE_API_URL || CLOUDFLARE_WORKER_API;
    url = `${apiBase}${input}`;
  }

  try {
    const response = await originalFetch(url, init);
    
    // Check if a request to /api returned an unexpected HTML SPA page
    const contentType = response.headers.get('content-type') || '';
    if (urlPath.startsWith('/api') && contentType.includes('text/html') && !response.ok) {
      console.warn('API Worker connection check failed. Falling back to Browser Admin Storage.');
      localStorage.setItem('grc_admin_mode', 'true');
      const { handleMockRequest } = await import('./utils/mockApi');
      return handleMockRequest(urlPath, init);
    }
    
    return response;
  } catch (error) {
    if (urlPath.startsWith('/api')) {
      console.warn('Network unreachable. Activating GRC local simulator:', error);
      localStorage.setItem('grc_admin_mode', 'true');
      const { handleMockRequest } = await import('./utils/mockApi');
      return handleMockRequest(urlPath, init);
    }
    throw error;
  }
};

// Create TanStack Query Client for caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);