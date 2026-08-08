import type { ReactNode } from "react";

export type Tab = "timeline" | "loop" | "console";

export const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "timeline", label: "Sources", hint: "eras & concepts" },
  { id: "loop", label: "Performance", hint: "event loop" },
  { id: "console", label: "Console", hint: "live REPL" },
];

export function AppShell({
  tab,
  onTabChange,
  children,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-panel">
        <div className="mx-auto flex max-w-350 flex-wrap items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-6 place-items-center rounded-[3px] bg-primary text-[11px] font-bold text-primary-foreground">
              JS
            </span>
            <h1 className="text-sm font-bold tracking-tight">
              runtime<span className="text-muted-foreground">.js</span>
            </h1>
          </div>
          <p className="hidden text-[11.5px] text-muted-foreground sm:block">
            the language, its eras, and the loop that runs it
          </p>
          <p className="ml-auto text-[11px] text-muted-foreground">
            executes in a sandboxed iframe · never <code className="text-destructive">eval</code>{" "}
            on this page
          </p>
        </div>

        <nav
          className="mx-auto flex max-w-350 items-end gap-px overflow-x-auto px-4"
          aria-label="Panels"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                aria-current={active ? "page" : undefined}
                className={`group relative -mb-px shrink-0 whitespace-nowrap border border-b-0 px-3 py-2 text-xs transition-colors sm:px-3.5 ${
                  active
                    ? "border-border bg-background text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={active ? "text-primary" : ""}>{t.label}</span>
                <span className="ml-2 hidden text-[10.5px] text-muted-foreground sm:inline">
                  {t.hint}
                </span>
                {active && <span className="absolute inset-x-0 top-0 h-px bg-primary" />}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-350 px-4 py-6">{children}</main>

      <footer className="mt-8 border-t border-border bg-panel">
        <div className="mx-auto max-w-350 px-4 py-5 text-[11.5px] leading-relaxed text-muted-foreground">
          <p>
            <span className="text-destructive">Uncaught TypeError:</span> Cannot read properties
            of null (reading &apos;author&apos;)
          </p>
          <p className="mt-1 pl-4 text-muted-foreground/70">
            at Footer (runtime.js:1:1) — this site is about the language, not a person.
          </p>
        </div>
      </footer>
    </div>
  );
}
