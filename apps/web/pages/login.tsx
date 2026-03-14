export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 rounded border p-8">
        <h1 className="text-2xl font-bold">EnvSync</h1>
        <p className="text-gray-500">Enter your API token to continue.</p>
        <input
          type="text"
          placeholder="API Token"
          className="w-full rounded border px-3 py-2 text-sm"
        />
        <button className="w-full rounded bg-black px-4 py-2 text-sm text-white">
          Login
        </button>
      </div>
    </main>
  );
}
