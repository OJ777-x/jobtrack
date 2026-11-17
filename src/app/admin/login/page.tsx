import { adminLogin } from "../actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">JobTrack demo admin</h1>
          <p className="mt-1 text-sm text-slate-500">For switching the demo between industry templates</p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form action={adminLogin} className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <label className="block text-xs font-medium text-slate-600">Admin password</label>
            <input
              name="password"
              type="password"
              required
              autoFocus
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
