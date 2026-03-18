import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import {
  getEnvVars,
  pushEnvVars,
  deleteEnvVar,
  renameProject,
  getMembers,
  inviteMember,
  removeMember,
  getProject,
  deleteProject,
  Environment,
  ProjectMember,
  ProjectDetail,
} from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { track } from '@/lib/analytics';

const ENVIRONMENTS: Environment[] = ['development', 'staging', 'production'];

const ENV_BADGE: Record<Environment, 'blue' | 'yellow' | 'green'> = {
  development: 'blue',
  staging: 'yellow',
  production: 'green',
};

type Tab = 'variables' | 'members' | 'settings';

export default function ProjectPage() {
  const { token, isReady } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const t = useTranslations('project');
  const tMembers = useTranslations('members');
  const tSettings = useTranslations('project.projectSettings');

  const projectId = router.query.id as string;
  const [displayName, setDisplayName] = useState((router.query.name as string) ?? '');
  const projectName = (displayName || (router.query.name as string)) ?? projectId;

  const [tab, setTab] = useState<Tab>('variables');
  const [env, setEnv] = useState<Environment>('development');
  const [editMode, setEditMode] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  // Rename state
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Members state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [pendingInviteLink, setPendingInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Settings state
  const [settingsRenameValue, setSettingsRenameValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const { data: vars, isLoading } = useQuery<Record<string, string>>({
    queryKey: ['envVars', projectId, env],
    queryFn: () => getEnvVars(projectId, env),
    enabled: !!token && !!projectId && tab === 'variables',
  });

  const { data: members, isLoading: membersLoading } = useQuery<ProjectMember[]>({
    queryKey: ['members', projectId],
    queryFn: () => getMembers(projectId),
    enabled: !!token && !!projectId && tab === 'members',
  });

  const { data: projectDetail } = useQuery<ProjectDetail>({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: !!token && !!projectId,
  });

  const canEditSettings =
    projectDetail?.userRole === 'owner' || projectDetail?.userRole === 'EDITOR';

  const enterEditMode = useCallback(() => {
    setDraftText(
      Object.entries(vars ?? {})
        .map(([k, v]) => `${k}=${v}`)
        .join('\n'),
    );
    setEditMode(true);
  }, [vars]);

  const pushMutation = useMutation({
    mutationFn: (variables: Record<string, string>) => pushEnvVars(projectId, env, variables),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['envVars', projectId, env] });
      toast.success(t('toast.saved', { env }));
      track('env_pushed', { env, count: Object.keys(parseDraft(draftText)).length });
      setEditMode(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteMember(projectId, inviteEmail, inviteRole),
    onSuccess: (data) => {
      const link = `${window.location.origin}/invite/${data.inviteToken}`;
      setPendingInviteLink(link);
      toast.success(tMembers('toast.invited', { email: inviteEmail }));
      setInviteEmail('');
      qc.invalidateQueries({ queryKey: ['members', projectId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(projectId, memberId),
    onSuccess: () => {
      toast.success(tMembers('toast.removed'));
      qc.invalidateQueries({ queryKey: ['members', projectId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteVarMutation = useMutation({
    mutationFn: (key: string) => deleteEnvVar(projectId, env, key),
    onSuccess: (_data, key) => {
      qc.invalidateQueries({ queryKey: ['envVars', projectId, env] });
      toast.success(t('toast.deleted', { key }));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => renameProject(projectId, name),
    onSuccess: (data) => {
      setDisplayName(data.name);
      setRenaming(false);
      toast.success(t('toast.renamed', { name: data.name }));
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      toast.success(tSettings('toast.deleted'));
      qc.invalidateQueries({ queryKey: ['projects'] });
      router.push('/dashboard');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function parseDraft(text: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key) result[key] = value;
    }
    return result;
  }

  function handleSave() {
    const variables = parseDraft(draftText);
    if (Object.keys(variables).length === 0) {
      toast.error(t('editMode.noVariablesError'));
      return;
    }
    pushMutation.mutate(variables);
  }

  function toggleReveal(key: string) {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function copyVar(key: string, value: string) {
    await navigator.clipboard.writeText(`${key}=${value}`);
    toast.success(t('viewMode.table.copied'));
  }

  function exportEnv() {
    const content = Object.entries(vars ?? {})
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.${env}.env`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyInviteLink() {
    if (!pendingInviteLink) return;
    await navigator.clipboard.writeText(pendingInviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  if (!isReady || !token) return null;

  const allEntries = Object.entries(vars ?? {});
  const entries = search
    ? allEntries.filter(([key]) => key.toLowerCase().includes(search.toLowerCase()))
    : allEntries;

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/dashboard" className="hover:text-gray-600">
            {t('breadcrumb')}
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-700">{projectName}</span>
        </nav>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            {renaming ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && renameValue.trim())
                      renameMutation.mutate(renameValue.trim());
                    if (e.key === 'Escape') setRenaming(false);
                  }}
                  className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <Button
                  size="sm"
                  onClick={() => renameMutation.mutate(renameValue.trim())}
                  loading={renameMutation.isPending}
                  disabled={!renameValue.trim()}
                >
                  {t('renameSave')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setRenaming(false)}>
                  {t('renameCancel')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl font-bold text-gray-900">{projectName}</h1>
                <button
                  onClick={() => {
                    setRenameValue(projectName);
                    setRenaming(true);
                  }}
                  className="rounded p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-600 transition-opacity"
                  title={t('renameButton')}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 20 20"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z"
                    />
                  </svg>
                </button>
              </div>
            )}
            <p className="mt-1 text-xs font-mono text-gray-400">{projectId}</p>
          </div>
          {tab === 'variables' && !editMode && !renaming && (
            <Button onClick={enterEditMode}>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
              {t('editButton')}
            </Button>
          )}
        </div>

        {/* Page tabs */}
        <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
          <button
            onClick={() => setTab('variables')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === 'variables'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('variablesTab')}
          </button>
          <button
            onClick={() => setTab('members')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === 'members'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tMembers('tabLabel')}
          </button>
          {canEditSettings && (
            <button
              onClick={() => setTab('settings')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === 'settings'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('settingsTab')}
            </button>
          )}
        </div>

        {/* ── Variables tab ── */}
        {tab === 'variables' && (
          <>
            {/* Environment tabs */}
            <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
              {ENVIRONMENTS.map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setEnv(key);
                    setEditMode(false);
                  }}
                  className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors
                    ${
                      env === key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {t(`environments.${key}`)}
                  {env === key && <Badge variant={ENV_BADGE[key]}>{key}</Badge>}
                </button>
              ))}
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            )}

            {/* Edit mode */}
            {!isLoading && editMode && (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {t('editMode.label', { env })} <Badge variant={ENV_BADGE[env]}>{env}</Badge>
                    </span>
                    <span className="text-xs text-gray-400">{t('editMode.hint')}</span>
                  </div>
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    className="w-full rounded-b-xl bg-gray-950 p-4 font-mono text-sm text-green-400 focus:outline-none"
                    rows={Math.max(10, draftText.split('\n').length + 2)}
                    placeholder={'DATABASE_URL=postgres://...\nSECRET_KEY=your-secret'}
                    spellCheck={false}
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">{t('editMode.encryptionNote')}</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setEditMode(false)}>
                      {t('editMode.cancelButton')}
                    </Button>
                    <Button onClick={handleSave} loading={pushMutation.isPending}>
                      {t('editMode.saveButton', { env })}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* View mode */}
            {!isLoading && !editMode && (
              <>
                {allEntries.length > 0 && (
                  <div className="mb-4 flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <svg
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                        />
                      </svg>
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('viewMode.searchPlaceholder')}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                      />
                    </div>
                    <Button variant="secondary" size="sm" onClick={exportEnv}>
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
                      {t('exportButton')}
                    </Button>
                  </div>
                )}
                {allEntries.length === 0 ? (
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
                        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                      />
                    </svg>
                    <p className="mb-1 font-medium text-gray-600">
                      {t('viewMode.empty.message', { env })}
                    </p>
                    <p className="mb-4 text-sm text-gray-400">{t('viewMode.empty.description')}</p>
                    <Button size="sm" onClick={enterEditMode}>
                      {t('viewMode.empty.button')}
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 w-1/3">
                            {t('viewMode.table.keyHeader')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {t('viewMode.table.valueHeader')}
                          </th>
                          <th className="px-4 py-3 w-24" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {entries.map(([key, value]) => (
                          <tr key={key} className="group hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono font-medium text-gray-900">{key}</td>
                            <td className="px-4 py-3 font-mono text-gray-600">
                              {revealed[key] ? value : '•'.repeat(Math.min(value.length, 24))}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => toggleReveal(key)}
                                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                  title={
                                    revealed[key]
                                      ? t('viewMode.table.hide')
                                      : t('viewMode.table.reveal')
                                  }
                                >
                                  {revealed[key] ? (
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
                                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                                      />
                                    </svg>
                                  ) : (
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
                                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={() => copyVar(key, value)}
                                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                  title={t('viewMode.table.copy')}
                                >
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
                                      d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => deleteVarMutation.mutate(key)}
                                  disabled={deleteVarMutation.isPending}
                                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                  title={t('viewMode.table.delete')}
                                >
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
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {t('viewMode.footer.variableCount', { count: entries.length })}
                      </span>
                      <span className="text-xs text-gray-400">
                        {t('viewMode.footer.encryption')}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Members tab ── */}
        {tab === 'members' && (
          <div className="space-y-6">
            {/* Invite form */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">
                {tMembers('inviteTitle')}
              </h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={tMembers('emailPlaceholder')}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'EDITOR' | 'VIEWER')}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                >
                  <option value="EDITOR">{tMembers('roleEditor')}</option>
                  <option value="VIEWER">{tMembers('roleViewer')}</option>
                </select>
                <Button
                  onClick={() => inviteMutation.mutate()}
                  loading={inviteMutation.isPending}
                  disabled={!inviteEmail.trim()}
                >
                  {tMembers('inviteButton')}
                </Button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {inviteRole === 'EDITOR' ? tMembers('roleEditorHint') : tMembers('roleViewerHint')}
              </p>

              {/* Invite link */}
              {pendingInviteLink && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                  <span className="flex-1 truncate font-mono text-xs text-indigo-700">
                    {pendingInviteLink}
                  </span>
                  <button
                    onClick={copyInviteLink}
                    className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    {linkCopied ? tMembers('linkCopied') : tMembers('copyLink')}
                  </button>
                </div>
              )}
            </div>

            {/* Members list */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {membersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : !members || members.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-gray-400">
                  {tMembers('empty')}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {members.map((member) => (
                      <tr key={member.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{member.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              member.role === 'EDITOR'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {member.role === 'EDITOR'
                              ? tMembers('roleEditor')
                              : tMembers('roleViewer')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              member.acceptedAt
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {member.acceptedAt ? tMembers('accepted') : tMembers('pending')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeMemberMutation.mutate(member.id)}
                            className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-700"
                          >
                            {tMembers('removeButton')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {/* ── Settings tab ── */}
        {tab === 'settings' && canEditSettings && (
          <div className="space-y-6">
            {/* Project info */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">{tSettings('infoTitle')}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{tSettings('idLabel')}</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs text-gray-700">{projectId}</code>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(projectId);
                        setIdCopied(true);
                        setTimeout(() => setIdCopied(false), 2000);
                      }}
                      className="rounded px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      {idCopied ? tSettings('copied') : tSettings('copyId')}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{tSettings('createdLabel')}</span>
                  <span className="text-gray-700">
                    {projectDetail?.createdAt
                      ? new Date(projectDetail.createdAt).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rename */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">
                {tSettings('renameTitle')}
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={settingsRenameValue}
                  onChange={(e) => setSettingsRenameValue(e.target.value)}
                  placeholder={projectName}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && settingsRenameValue.trim())
                      renameMutation.mutate(settingsRenameValue.trim());
                  }}
                />
                <Button
                  onClick={() => renameMutation.mutate(settingsRenameValue.trim())}
                  loading={renameMutation.isPending}
                  disabled={!settingsRenameValue.trim()}
                >
                  {tSettings('renameSave')}
                </Button>
              </div>
            </div>

            {/* Danger zone — owner only */}
            {projectDetail?.userRole === 'owner' && (
              <div className="rounded-xl border border-red-200 bg-red-50/40 p-6">
                <h3 className="mb-4 text-sm font-semibold text-red-700">
                  {tSettings('dangerTitle')}
                </h3>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tSettings('deleteTitle')}</p>
                    <p className="mt-1 text-xs text-gray-500">{tSettings('deleteDescription')}</p>
                  </div>
                  {!deleteConfirm ? (
                    <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
                      {tSettings('deleteButton')}
                    </Button>
                  ) : (
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xs font-medium text-red-600">
                        {tSettings('deleteConfirm')}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDeleteConfirm(false)}
                        >
                          {tSettings('deleteCancelButton')}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteProjectMutation.mutate()}
                          loading={deleteProjectMutation.isPending}
                        >
                          {tSettings('deleteConfirmButton')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
