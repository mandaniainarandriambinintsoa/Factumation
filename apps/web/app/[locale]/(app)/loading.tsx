export default function AppLoading() {
  return (
    <main
      className="mx-auto max-w-7xl animate-pulse px-5 py-8 lg:px-10 lg:py-12"
      aria-label="Chargement"
    >
      <div className="h-4 w-24 rounded bg-blue-100" />
      <div className="mt-3 h-9 w-64 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />
      <div className="mt-8 h-72 rounded-xl border border-slate-200 bg-white" />
    </main>
  );
}
