import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { router } from './router';
import i18n from '@/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Hydrate BEFORE first render (synchronous)
useAuthStore.getState().hydrate();

// Set language direction from i18n (single source of truth)
const lang = i18n.language;
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = lang;

// Set theme
const theme = localStorage.getItem('theme') || 'dark';
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
