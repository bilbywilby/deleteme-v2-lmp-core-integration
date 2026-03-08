import '@/lib/errorReporter';
import { enableMapSet } from "immer";
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { UIProvider } from '@/context/UIContext';
import '@/index.css';
import { OblivionApp } from '@/pages/OblivionApp';
enableMapSet();
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <OblivionApp />,
    errorElement: <RouteErrorBoundary />,
  }
]);
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <UIProvider>
        <RouterProvider router={router} />
      </UIProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);