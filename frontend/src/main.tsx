import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

// Intercept global fetch to prefix with VITE_API_URL if configured in production, or simulate via mock database
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const isDemo = localStorage.getItem('grc_demo_mode') === 'true';
  const urlPath = typeof input === 'string' ? input : '';

  if (isDemo && urlPath.startsWith('/api')) {
    const { handleMockRequest } = await import('./utils/mockApi');
    return handleMockRequest(urlPath, init);
  }

  let url = input;
  if (typeof input === 'string' && input.startsWith('/api')) {
    const apiBase = import.meta.env.VITE_API_URL || '';
    url = `${apiBase}${input}`;
  }

  try {
    const response = await originalFetch(url, init);
    
    // Fallback if backend server returns an error or 404 on configuration status check
    if (urlPath.endsWith('/api/setup/check') && !response.ok) {
      console.warn('API Worker connection check failed. Falling back to Browser Demo Storage.');
      localStorage.setItem('grc_demo_mode', 'true');
      const { handleMockRequest } = await import('./utils/mockApi');
      return handleMockRequest(urlPath, init);
    }
    
    return response;
  } catch (error) {
    if (urlPath.startsWith('/api')) {
      console.warn('Network unreachable. Activating GRC local simulator:', error);
      localStorage.setItem('grc_demo_mode', 'true');
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
