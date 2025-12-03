// app/providers.tsx

'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { ThemeProvider } from '@/components/ThemeProvider';
import AuthGuard from '@/components/AuthGuard';

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
        <ThemeProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </Provider>
  );
}