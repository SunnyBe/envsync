import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { getAuditEvents, getProjects, AuditEvent, Project } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Spinner } from '@/components/ui/Spinner';

const ACTION_ICONS: Record<string, JSX.Element> = {
  'project.create': (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  'project.delete': (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  ),
  'env.push': (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  ),
  'env.pull': (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  ),
  'auth.regenerate_token': (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  ),
};

const ACTION_COLORS: Record<string, string> = {
  'project.delete': 'bg-red-100 text-red-600',
  'auth.regenerate_token': 'bg-orange-100 text-orange-600',
  'env.push': 'bg-blue-100 text-blue-600',
  'env.pull': 'bg-green-100 text-green-600',
};

function getActionColor(action: string): string {
  return ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-500';
}

function getActionIcon(action: string): JSX.Element {
  return (
    ACTION_ICONS[action] ?? (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  );
}

function formatRelativeTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffSec < 60) return rtf.format(-diffSec, 'second');
  if (diffSec < 3600) return rtf.format(-Math.floor(diffSec / 60), 'minute');
  if (diffSec < 86400) return rtf.format(-Math.floor(diffSec / 3600), 'hour');
  if (diffSec < 604800) return rtf.format(-Math.floor(diffSec / 86400), 'day');
  return date.toLocaleDateString(locale);
}

function groupEventsByDate(events: AuditEvent[], locale: string): Record<string, AuditEvent[]> {
  const groups: Record<string, AuditEvent[]> = {};
  for (const event of events) {
    const date = new Date(event.createdAt).toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
  }
  return groups;
}

export default function ActivityPage() {
  const { token, isReady } = useAuth();
  const router = useRouter();
  const t = useTranslations('activity');
  const tActions = useTranslations('activity.actions');
  const { locale } = useLocale();

  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const { data: events, isLoading } = useQuery({
    queryKey: ['auditEvents'],
    queryFn: getAuditEvents,
    enabled: !!token,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: !!token,
  });

  const projectNameMap = (projects ?? []).reduce<Record<string, string>>((acc, p: Project) => {
    acc[p.id] = p.name;
    return acc;
  }, {});

  if (!isReady || !token) return null;

  const grouped = groupEventsByDate(events ?? [], locale);
  const dateKeys = Object.keys(grouped);

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : dateKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
            <svg
              className="mb-4 h-10 w-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
              />
            </svg>
            <p className="mb-1 font-medium text-gray-600">{t('empty.message')}</p>
            <p className="text-sm text-gray-400">{t('empty.description')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {dateKeys.map((date) => (
              <div key={date}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {date}
                </h3>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-50">
                  {grouped[date].map((event) => {
                    const actionLabel = (() => {
                      try {
                        return tActions(event.action as Parameters<typeof tActions>[0]);
                      } catch {
                        return event.action;
                      }
                    })();
                    return (
                      <div key={event.id} className="flex items-start gap-4 px-5 py-4">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getActionColor(event.action)}`}
                        >
                          {getActionIcon(event.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{actionLabel}</p>
                            {event.source && (
                              <span
                                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500 bg-gray-100"
                                title={
                                  event.source === 'cli'
                                    ? 'Via CLI'
                                    : event.source === 'web'
                                      ? 'Via web dashboard'
                                      : 'Direct API call'
                                }
                              >
                                {t(`source.${event.source}`)}
                              </span>
                            )}
                          </div>
                          {event.resourceType && event.resourceId && (
                            <p className="mt-0.5 text-xs text-gray-400 truncate">
                              {event.resourceType === 'project'
                                ? (projectNameMap[event.resourceId] ??
                                  `project:${event.resourceId.slice(0, 8)}…`)
                                : `${event.resourceType}: ${event.resourceId.slice(0, 8)}…`}
                            </p>
                          )}
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {Object.entries(event.metadata).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500"
                                >
                                  {k}: {String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-gray-400 mt-0.5">
                          {formatRelativeTime(event.createdAt, locale)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
