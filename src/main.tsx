import { StrictMode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';

import { routeTree } from './routeTree.gen';
// Configure Hey API client base URLs before any queries run.
// Add one import per API — each configures its own generated default client.
import './api/petstore/client';
// import './api/nba/client'   // ← uncomment when NBA API is ready
import './index.css';

// TanStack Query client — tweak staleTime / gcTime to taste
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// TanStack Router — inject queryClient so loaders can use it
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
});

// Extend TanStack Router context type
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
