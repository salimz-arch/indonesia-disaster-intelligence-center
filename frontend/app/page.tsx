import { BackendStatus } from "@/components/common/backend-status";
import { APP_NAME, APP_TAGLINE, APP_VERSION } from "@/lib/constants";

const MODULES = [
  { label: "Interactive Map", step: "Step 8" },
  { label: "Earthquake Module", step: "Step 9" },
  { label: "Weather Module", step: "Step 10" },
  { label: "Rainfall Module", step: "Step 11" },
  { label: "Realtime SSE", step: "Step 12" },
  { label: "AI Analysis", step: "Step 13" },
  { label: "Analytics", step: "Step 14" },
  { label: "Notifications", step: "Step 15" },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            🇮🇩
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">IDIC</h1>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
            v{APP_VERSION} · SKELETON
          </span>
        </div>
        <p className="text-sm text-slate-400">{APP_NAME}</p>
        <p className="text-sm text-slate-500">{APP_TAGLINE}</p>
      </header>

      <BackendStatus />

      <section className="rounded-2xl border border-[#203B56] bg-[#13263A]/60 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Module Roadmap
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {MODULES.map((m) => (
            <li
              key={m.label}
              className="flex items-center justify-between rounded-lg border border-[#203B56]/60 px-3 py-2 text-sm"
            >
              <span>{m.label}</span>
              <span className="text-xs text-slate-500">{m.step}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="text-xs text-slate-600">
        Development build — no realtime data yet. Data modules activate in Step
        5+.
      </footer>
    </main>
  );
}
