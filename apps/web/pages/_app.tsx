import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { NextIntlClientProvider } from 'next-intl';
import { AuthProvider } from '@/context/AuthContext';
import { LocaleProvider, useLocale } from '@/context/LocaleContext';
import { initAnalytics } from '@/lib/analytics';
import '../styles/globals.css';

// Analytics initialised once on first client render (no-op without NEXT_PUBLIC_POSTHOG_KEY)
if (typeof window !== 'undefined') initAnalytics();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

// Separate component so it can consume LocaleContext
function AppWithLocale({ Component, pageProps }: AppProps) {
  const { locale, messages } = useLocale();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Component {...pageProps} />
          <Toaster
            position="bottom-right"
            toastOptions={{ duration: 4000, style: { fontSize: '14px' } }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}

export default function App(props: AppProps) {
  return (
    <LocaleProvider>
      <AppWithLocale {...props} />
    </LocaleProvider>
  );
}
