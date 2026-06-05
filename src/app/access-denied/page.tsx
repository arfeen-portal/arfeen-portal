export default function AccessDeniedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 text-xl font-bold">
          !
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Access Denied
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Aap ke current role ko is page ka access nahi hai.
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          Agar ye access milna chahiye tha to admin se role permissions check karwaen.
        </div>

        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}