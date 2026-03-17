import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useLocale, LOCALES } from '@/context/LocaleContext';
import { verifyToken } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Spinner } from '@/components/ui/Spinner';

export default function SettingsPage() {
  const { token, isReady, logout } = useAuth();
  const router = useRouter();
  const t = useTranslations('settings');
  const { locale, setLocale } = useLocale();

  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => verifyToken(token!),
    enabled: !!token,
  });

  if (!isReady || !token) return null;

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-8 py-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">{t('title')}</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">{t('account.sectionTitle')}</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">{t('account.emailLabel')}</p>
                  <p className="mt-0.5 font-medium text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('account.userIdLabel')}</p>
                  <p className="mt-0.5 font-mono text-sm text-gray-600">{user?.id}</p>
                </div>
              </div>
            </section>

            {/* API Token */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">{t('apiToken.sectionTitle')}</h2>
              <p className="mb-3 text-sm text-gray-600">{t('apiToken.description')}</p>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="flex-1 font-mono text-xs text-gray-500 break-all">
                  {token.slice(0, 8)}{'•'.repeat(48)}{token.slice(-8)}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {t('apiToken.cliHint')}{' '}
                <code className="rounded bg-gray-100 px-1 py-0.5">envsync login --token &lt;token&gt;</code>
              </p>
            </section>

            {/* Language */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">{t('language.sectionTitle')}</h2>
              <p className="mb-3 text-xs text-gray-400">{t('language.label')}</p>
              <div className="flex gap-2">
                {LOCALES.map(({ value, label, flag }) => (
                  <button
                    key={value}
                    onClick={() => setLocale(value)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors
                      ${locale === value
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <span>{flag}</span>
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Danger zone */}
            <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-red-500">{t('dangerZone.sectionTitle')}</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('dangerZone.signOutTitle')}</p>
                  <p className="text-xs text-gray-400">{t('dangerZone.signOutDescription')}</p>
                </div>
                <button
                  onClick={logout}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  {t('dangerZone.signOutButton')}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}
