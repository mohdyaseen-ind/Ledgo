// app/providers.tsx

'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { ThemeProvider } from '@/components/ThemeProvider';
import AuthGuard from '@/components/AuthGuard';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthGuard>
          {children}
        </AuthGuard>
      </ThemeProvider>
    </Provider>
  );
}