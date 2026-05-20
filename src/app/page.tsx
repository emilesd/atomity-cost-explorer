import { CostExplorer } from "@/components/CostExplorer";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Hero — gives scroll distance so the section triggers on scroll */}
      <header className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center sm:py-32">
        <span className="rounded-full bg-mint-light px-3 py-1 text-xs font-semibold text-mint-dark">
          Cloud Optimization Platform
        </span>
        <h1
          className="max-w-2xl font-bold tracking-tight text-foreground"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          Understand Your
          <br />
          Infrastructure Costs
        </h1>
        <p
          className="max-w-lg text-muted"
          style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)" }}
        >
          Drill down from clusters to pods. See exactly where every dollar goes
          across CPU, RAM, storage, network, and GPU.
        </p>
      </header>

      {/* Main feature section — scroll-triggered */}
      <main>
        <CostExplorer />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--color-border-light)] px-4 py-8 text-center text-sm text-subtle">
        Atomity Cloud Cost Explorer — Frontend Challenge
      </footer>
    </div>
  );
}
