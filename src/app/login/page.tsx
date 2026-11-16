import {
  signInWithPassword,
  signInAsDemoManager,
  signInAsDemoWorker,
  signInAsDemoCustomer,
} from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">JobTrack</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your workspace</p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Demo quick login</h2>
          <div className="grid grid-cols-1 gap-2">
            <form action={signInAsDemoManager}>
              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Log in as Manager
              </button>
            </form>
            <form action={signInAsDemoWorker}>
              <button
                type="submit"
                className="w-full rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Log in as Worker
              </button>
            </form>
            <form action={signInAsDemoCustomer}>
              <button
                type="submit"
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Log in as Customer
              </button>
            </form>
          </div>
        </div>

        <details className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Sign in with email & password instead
          </summary>
          <form action={signInWithPassword} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">Email</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Password</label>
              <input
                name="password"
                type="password"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Sign in
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}
