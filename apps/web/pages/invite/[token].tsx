import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';

type Status = 'idle' | 'success' | 'error';

export default function AcceptInvitePage() {
  const { token, isReady } = useAuth();
  const router = useRouter();
  const t = useTranslations('invite');
  const inviteToken = router.query.token as string;
  // Ref prevents double-firing in React Strict Mode without adding mutation to deps
  const accepted = useRef(false);

  const acceptMutation = useMutation<unknown, Error>({
    mutationFn: () => apiClient.post(`/auth/invites/${inviteToken}/accept`).then((r) => r.data),
    onSuccess: () => {
      setTimeout(() => router.push('/dashboard'), 2000);
    },
  });

  const status: Status = acceptMutation.isSuccess
    ? 'success'
    : acceptMutation.isError
      ? 'error'
      : 'idle';

  useEffect(() => {
    if (isReady && !token) {
      router.replace(`/login?redirect=/invite/${inviteToken}`);
    }
  }, [isReady, token, router, inviteToken]);

  useEffect(() => {
    if (isReady && token && inviteToken && !accepted.current) {
      accepted.current = true;
      acceptMutation.mutate();
    }
  }, [isReady, token, inviteToken, acceptMutation]);

  if (!isReady) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg text-center">
        {acceptMutation.isPending || status === 'idle' ? (
          <>
            <div className="mb-4 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
            <p className="text-sm text-gray-500">{t('accepting')}</p>
          </>
        ) : status === 'success' ? (
          <>
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>
            <h2 className="mb-1 text-lg font-semibold text-gray-900">{t('successTitle')}</h2>
            <p className="text-sm text-gray-500">{t('successDescription')}</p>
          </>
        ) : (
          <>
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="mb-1 text-lg font-semibold text-gray-900">{t('errorTitle')}</h2>
            <p className="mb-4 text-sm text-gray-500">{t('errorDescription')}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {t('goToDashboard')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
