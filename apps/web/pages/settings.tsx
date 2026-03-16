import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { verifyToken } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Spinner } from '@/components/ui/Spinner';

export default function SettingsPage() {
  const { token, isReady, logout } = useAuth();
  const router = useRouter();

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
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Settings</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Account</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="mt-0.5 font-medium text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">User ID</p>
                  <p className="mt-0.5 font-mono text-sm text-gray-600">{user?.id}</p>
                </div>
              </div>
            </section>

            {/* API Token */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">API Token</h2>
              <p className="mb-3 text-sm text-gray-600">
                Your token is stored locally in this browser. It was shown once at registration — if you've lost it, sign out and register a new account.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="flex-1 font-mono text-xs text-gray-500 break-all">
                  {token.slice(0, 8)}{'•'.repeat(48)}{token.slice(-8)}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Use this token with the CLI:{' '}
                <code className="rounded bg-gray-100 px-1 py-0.5">envsync login --token &lt;token&gt;</code>
              </p>
            </section>

            {/* Danger zone */}
            <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-red-500">Danger zone</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Sign out</p>
                  <p className="text-xs text-gray-400">Removes your token from this browser.</p>
                </div>
                <button
                  onClick={logout}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}
