import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { config } from '@/config';
import { useLocale, LOCALES } from '@/context/LocaleContext';
import { verifyToken, regenerateToken } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Spinner } from '@/components/ui/Spinner';

type CopyField = 'email' | 'id' | null;

export default function SettingsPage() {
  const { token, isReady, logout, login } = useAuth();
  const router = useRouter();
  const t = useTranslations('settings');
  const { locale, setLocale } = useLocale();

  const [copied, setCopied] = useState<CopyField>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [newTokenCopied, setNewTokenCopied] = useState(false);

  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => verifyToken(token!),
    enabled: !!token,
  });

  const regenerateMutation = useMutation({
    mutationFn: regenerateToken,
    onSuccess: (data) => {
      setShowRegenerateConfirm(false);
      setNewToken(data.apiToken);
      // Keep the user signed in with the new token
      login(data.apiToken);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function copyField(value: string, field: CopyField) {
    await navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  async function copyNewToken() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setNewTokenCopied(true);
    setTimeout(() => setNewTokenCopied(false), 2000);
  }

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
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('account.sectionTitle')}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{t('account.emailLabel')}</p>
                    <p className="mt-0.5 font-medium text-gray-900">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => copyField(user?.email ?? '', 'email')}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50"
                    title={t('account.copyEmail')}
                  >
                    {copied === 'email' ? (
                      <>
                        <svg
                          className="h-3.5 w-3.5 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                        {t('account.copied')}
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                          />
                        </svg>
                        {t('account.copyEmail')}
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{t('account.userIdLabel')}</p>
                    <p className="mt-0.5 font-mono text-sm text-gray-600">{user?.id}</p>
                  </div>
                  <button
                    onClick={() => copyField(user?.id ?? '', 'id')}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50"
                    title={t('account.copyId')}
                  >
                    {copied === 'id' ? (
                      <>
                        <svg
                          className="h-3.5 w-3.5 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                        {t('account.copied')}
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                          />
                        </svg>
                        {t('account.copyId')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* API Token */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('apiToken.sectionTitle')}
              </h2>
              <p className="mb-3 text-sm text-gray-600">{t('apiToken.description')}</p>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="flex-1 font-mono text-xs text-gray-500 break-all">
                  {token.slice(0, 4)}
                  {'•'.repeat(56)}
                  {token.slice(-4)}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {t('apiToken.cliHint')}{' '}
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  envsync login --token &lt;token&gt;
                </code>
              </p>

              {/* Regenerate token */}
              {newToken ? (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="mb-1 text-sm font-medium text-green-800">
                    {t('apiToken.newTokenTitle')}
                  </p>
                  <p className="mb-3 text-xs text-green-600">{t('apiToken.newTokenDescription')}</p>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 rounded border border-green-200 bg-white px-3 py-1.5 font-mono text-xs text-gray-700 break-all">
                      {newToken}
                    </span>
                    <button
                      onClick={copyNewToken}
                      className="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                    >
                      {newTokenCopied ? t('apiToken.newTokenCopied') : t('apiToken.newTokenCopy')}
                    </button>
                  </div>
                  <button
                    onClick={() => setNewToken(null)}
                    className="mt-3 text-xs text-green-600 underline hover:text-green-700"
                  >
                    {t('apiToken.newTokenDone')}
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {t('apiToken.regenerateTitle')}
                    </p>
                    <p className="text-xs text-gray-400">{t('apiToken.regenerateDescription')}</p>
                  </div>
                  <button
                    onClick={() => setShowRegenerateConfirm(true)}
                    className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50"
                  >
                    {t('apiToken.regenerateButton')}
                  </button>
                </div>
              )}
            </section>

            {/* Language */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('language.sectionTitle')}
              </h2>
              <p className="mb-3 text-xs text-gray-400">{t('language.label')}</p>
              <div className="flex gap-2">
                {LOCALES.map(({ value, label, flag }) => (
                  <button
                    key={value}
                    onClick={() => setLocale(value)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors
                      ${
                        locale === value
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

            {/* Help & Support */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('help.sectionTitle')}
              </h2>
              <div className="space-y-4">
                {[
                  {
                    title: t('help.docsTitle'),
                    description: t('help.docsDescription'),
                    link: config.links.docs,
                    label: t('help.docsLink'),
                    icon: (
                      <svg
                        className="h-5 w-5 text-indigo-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                        />
                      </svg>
                    ),
                  },
                  {
                    title: t('help.issuesTitle'),
                    description: t('help.issuesDescription'),
                    link: config.links.issues,
                    label: t('help.issuesLink'),
                    icon: (
                      <svg
                        className="h-5 w-5 text-indigo-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                      </svg>
                    ),
                  },
                  {
                    title: t('help.emailTitle'),
                    description: t('help.emailDescription'),
                    link: `mailto:${config.links.contact}`,
                    label: t('help.emailLink'),
                    icon: (
                      <svg
                        className="h-5 w-5 text-indigo-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    ),
                  },
                ].map(({ title, description, link, label, icon }) => (
                  <div key={title} className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{icon}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{title}</p>
                        <p className="text-xs text-gray-400">{description}</p>
                      </div>
                    </div>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
                    >
                      {label}
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* Danger zone */}
            <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-red-500">
                {t('dangerZone.sectionTitle')}
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('dangerZone.signOutTitle')}
                  </p>
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

      {/* Regenerate confirm modal */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {t('apiToken.regenerateConfirmTitle')}
            </h3>
            <p className="mb-6 text-sm text-gray-500">{t('apiToken.regenerateConfirmMessage')}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {t('apiToken.regenerateCancelButton')}
              </button>
              <button
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {regenerateMutation.isPending ? '...' : t('apiToken.regenerateConfirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
