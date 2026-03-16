import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { getProjects, createProject, deleteProject, Project } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { track } from '@/lib/analytics';

export default function DashboardPage() {
  const { token, isReady } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const t = useTranslations('dashboard');
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  // Guard: redirect to login if not authenticated
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createProject(name),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('toast.created', { name: project.name }));
      track('project_created', { name: project.name });
      setShowCreate(false);
      setProjectName('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('toast.deleted'));
      track('project_deleted');
      setConfirmDelete(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = projectName.trim();
    if (!name) return;
    createMutation.mutate(name);
  }

  if (!isReady || !token) return null;

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            {t('newProject')}
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && projects?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <p className="mb-1 font-medium text-gray-600">{t('empty.message')}</p>
            <p className="mb-4 text-sm text-gray-400">{t('empty.description')}</p>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              {t('empty.button')}
            </Button>
          </div>
        )}

        {/* Project grid */}
        {projects && projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="group relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <Link href={`/project/${project.id}?name=${encodeURIComponent(project.name)}`} className="block">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    </div>
                    <svg className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-900">{project.name}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </Link>
                {/* Delete button — appears on hover */}
                <button
                  onClick={() => setConfirmDelete(project)}
                  className="absolute right-3 top-3 hidden rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 group-hover:block"
                  title={t('deleteModal.title')}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={t('deleteModal.title')}
      >
        <p className="mb-6 text-sm text-gray-600">
          {t.rich('deleteModal.confirmMessage', {
            name: confirmDelete?.name ?? '',
            b: (chunks) => <span className="font-semibold text-gray-900">{chunks}</span>,
          })}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            {t('deleteModal.cancelButton')}
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
          >
            {t('deleteModal.deleteButton')}
          </Button>
        </div>
      </Modal>

      {/* Create project modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setProjectName(''); }}
        title={t('createModal.title')}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={t('createModal.nameLabel')}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={t('createModal.namePlaceholder')}
            hint={t('createModal.nameHint')}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setShowCreate(false); setProjectName(''); }}
            >
              {t('createModal.cancelButton')}
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              {t('createModal.createButton')}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
