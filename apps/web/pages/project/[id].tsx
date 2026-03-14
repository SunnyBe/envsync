import { useRouter } from 'next/router';

export default function ProjectPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-bold">Project</h1>
      <p className="mt-1 text-sm text-gray-400">ID: {id}</p>
      <p className="mt-6 text-gray-500">Environment variables will appear here.</p>
    </main>
  );
}
