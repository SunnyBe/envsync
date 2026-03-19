import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { config as appConfig } from '@/config';

const FEATURES = [
  {
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    ),
    title: 'AES-256-GCM encryption',
    description:
      'Every variable is encrypted before leaving your machine. The server stores only ciphertext — your plaintext values are never exposed.',
  },
  {
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
    title: 'Team access control',
    description:
      'Invite teammates as Editors or Viewers. Owners control who can push changes — with role enforcement on every API call.',
  },
  {
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"
        />
      </svg>
    ),
    title: 'Environment isolation',
    description:
      'Keep development, staging, and production variables strictly separate. Pull exactly the environment you need — no accidental cross-contamination.',
  },
  {
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
        />
      </svg>
    ),
    title: 'Full audit trail',
    description:
      'Every push, pull, invite, and token rotation is logged with source (CLI, web, or API), IP address, and timestamp.',
  },
];

const STEPS = [
  {
    title: 'Register and get your token',
    description:
      'Create an account with your email. Your API token is generated once and hashed — we never store the plaintext.',
    code: '$ envsync login',
  },
  {
    title: 'Push your variables',
    description:
      'Point the CLI at your project and choose an environment. Variables are encrypted locally before upload.',
    code: '$ envsync push --project my-api --env production',
  },
  {
    title: 'Pull on any machine',
    description:
      'On any authorised machine or CI runner, pull the variables back into a .env file in one command.',
    code: '$ envsync pull --project my-api --env production',
  },
];

export default function IndexPage() {
  const { token, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && token) router.replace('/dashboard');
  }, [isReady, token, router]);

  if (!isReady || token) return null;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-gray-900">EnvSync</span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pb-20 pt-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            End-to-end encrypted · Open source · Self-hostable
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-6xl">
            Sync environment variables <span className="text-indigo-600">across your team</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-500">
            EnvSync encrypts your{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm">.env</code> files
            end-to-end and syncs them across projects, environments, and teammates — without ever
            storing a plaintext secret.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-indigo-700"
            >
              Get started free
            </Link>
            <a
              href={appConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-8 py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              View on GitHub
            </a>
          </div>

          {/* Terminal preview */}
          <div className="mt-16 overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 text-left shadow-2xl">
            <div className="flex items-center gap-2 border-b border-gray-800 px-5 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-gray-500">terminal</span>
            </div>
            <pre className="overflow-x-auto px-6 py-5 text-sm leading-relaxed">
              <code>
                <span className="text-gray-500"># Install once</span>
                {'\n'}
                <span className="text-green-400">$</span>
                <span className="text-white"> npm install -g {appConfig.app.npmPackage}</span>
                {'\n\n'}
                <span className="text-gray-500"># Authenticate with your API token</span>
                {'\n'}
                <span className="text-green-400">$</span>
                <span className="text-white"> envsync login</span>
                {'\n\n'}
                <span className="text-gray-500"># Push your .env to production</span>
                {'\n'}
                <span className="text-green-400">$</span>
                <span className="text-white"> envsync push --project my-api --env production</span>
                {'\n'}
                <span className="text-indigo-400">✔ 12 variables pushed to production</span>
                {'\n\n'}
                <span className="text-gray-500"># Pull on any authorised machine or CI runner</span>
                {'\n'}
                <span className="text-green-400">$</span>
                <span className="text-white"> envsync pull --project my-api --env production</span>
                {'\n'}
                <span className="text-indigo-400">✔ 12 variables written to .env</span>
              </code>
            </pre>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-100 bg-gray-50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-14 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Built for teams that care about security
              </h2>
              <p className="mt-3 text-base text-gray-500">
                No shared Slack messages. No committed{' '}
                <code className="rounded bg-gray-200 px-1 font-mono text-sm">.env</code> files. No
                plaintext in your database.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    {f.icon}
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-14 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">How it works</h2>
              <p className="mt-3 text-base text-gray-500">
                Three commands. Works in CI/CD, Docker, and local dev.
              </p>
            </div>
            <div className="space-y-10">
              {STEPS.map((s, i) => (
                <div key={s.title} className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-base font-semibold text-gray-900">{s.title}</h3>
                    <p className="mb-4 text-sm text-gray-500">{s.description}</p>
                    <code className="block rounded-xl border border-gray-800 bg-gray-950 px-5 py-3 font-mono text-sm text-green-400">
                      {s.code}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-gray-100 bg-indigo-600 py-20 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Ready to stop sharing secrets over Slack?
            </h2>
            <p className="mb-8 text-indigo-200">
              Free to use. No credit card required. Your variables stay encrypted end-to-end.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-600 shadow-md transition-colors hover:bg-indigo-50"
            >
              Get started free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs text-gray-400 sm:flex-row">
          <span className="font-semibold text-gray-700">EnvSync</span>
          <span>Encrypted · Open source · Self-hostable</span>
          <div className="flex gap-4">
            <Link href="/login" className="transition-colors hover:text-gray-600">
              Sign in
            </Link>
            <a
              href={appConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-gray-600"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
