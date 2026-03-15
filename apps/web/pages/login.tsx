import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { register } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { track } from '@/lib/analytics';

type Tab = 'register' | 'token';

export default function LoginPage() {
  const { token, isReady, login } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('register');
  const [email, setEmail] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Already authenticated — skip login
  useEffect(() => {
    if (isReady && token) router.replace('/dashboard');
  }, [isReady, token, router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const data = await register(email.trim());
      setNewToken(data.apiToken);
      track('user_registered');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  function handleTokenLogin(e: React.FormEvent) {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    login(t);
    track('user_logged_in');
    router.push('/dashboard');
  }

  function handleContinueWithToken() {
    if (!newToken) return;
    login(newToken);
    track('user_logged_in_after_register');
    router.push('/dashboard');
  }

  async function copyToken() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isReady) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">EnvSync</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sync environment variables across your team
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
            {(['register', 'token'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setNewToken(null);
                }}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors
                  ${tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {t === 'register' ? 'Create account' : 'Sign in with token'}
              </button>
            ))}
          </div>

          {/* Register form */}
          {tab === 'register' && !newToken && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
              />
              <Button type="submit" loading={loading} className="w-full">
                Create account
              </Button>
            </form>
          )}

          {/* Token reveal after registration */}
          {tab === 'register' && newToken && (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="mb-1 text-sm font-semibold text-green-800">Account created!</p>
                <p className="mb-3 text-xs text-green-700">
                  Copy your API token now — it will not be shown again.
                </p>
                <div className="flex items-start gap-2 rounded-md border border-green-200 bg-white p-2">
                  <span className="flex-1 select-all break-all font-mono text-xs text-gray-800">
                    {newToken}
                  </span>
                  <button
                    onClick={copyToken}
                    className="shrink-0 rounded px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <Button onClick={handleContinueWithToken} className="w-full">
                Continue to dashboard
              </Button>
            </div>
          )}

          {/* Token sign-in */}
          {tab === 'token' && (
            <form onSubmit={handleTokenLogin} className="space-y-4">
              <Input
                label="API token"
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste your token here"
                required
                autoFocus
                hint="You received this when you first registered."
              />
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Using the CLI?{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">
            envsync login --token &lt;token&gt;
          </code>
        </p>
      </div>
    </main>
  );
}
