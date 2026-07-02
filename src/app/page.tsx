export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 rounded-full bg-slate-200 px-4 py-2 text-sm font-medium">
          Soft-live Private Beta
        </p>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
          I&apos;m Realtor
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-600 md:text-xl">
          A simple real estate marketplace for verified agents, property owners,
          buyers, and approved property listings.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#"
            className="rounded-xl bg-slate-900 px-6 py-3 text-white font-medium"
          >
            Browse Properties
          </a>

          <a
            href="#"
            className="rounded-xl border border-slate-300 px-6 py-3 font-medium"
          >
            Agent Preview Access
          </a>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Public signup is currently controlled. Listings require admin approval
          before visibility.
        </p>
      </section>
    </main>
  );
}