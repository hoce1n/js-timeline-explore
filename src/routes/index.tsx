import { lazy, Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Timeline } from "@/components/devtools/Timeline";
import { REPL_EXAMPLES } from "@/lib/js-eras";

const Workbench = lazy(() => import("@/components/devtools/Workbench"));

const TITLE = "runtime.js — an interactive tour of JavaScript itself";
const DESCRIPTION =
  "A DevTools-styled walk through JavaScript's eras, with a real sandboxed REPL and an event loop visualizer driven by actual instrumentation of your code.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

type Tab = "timeline" | "loop" | "console";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "timeline", label: "Sources", hint: "eras & concepts" },
  { id: "loop", label: "Performance", hint: "event loop" },
  { id: "console", label: "Console", hint: "live REPL" },
];

function Index() {
  const [tab, setTab] = useState<Tab>("timeline");
  const [code, setCode] = useState(REPL_EXAMPLES[0]!.code);

  const runInConsole = (snippet: string) => {
    setCode(snippet);
    setTab("console");
  };

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
            executes in a sandboxed iframe · never <code className="text-destructive">eval</code> on
            this page
          </p>
        </div>

        <nav className="mx-auto flex max-w-350 items-end gap-px px-4" aria-label="Panels">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={`group relative -mb-px border border-b-0 px-3.5 py-2 text-xs transition-colors ${
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

      <main className="mx-auto max-w-350 px-4 py-6">
        {tab === "timeline" && (
          <>
            <section className="mb-6 max-w-3xl">
              <h2 className="text-lg font-bold">
                One spine: <span className="text-primary">the evolution of JavaScript</span>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-panel-foreground">
                Pick an era, expand a concept, and see where it lands in today&apos;s runtimes. Every
                snippet can be dropped straight into the sandboxed console — the event loop panel
                then shows real, instrumented execution, not a looping animation.
              </p>
            </section>
            <div className="overflow-hidden rounded-sm border border-border">
              <Timeline onRun={runInConsole} />
            </div>
          </>
        )}

        <div className={tab === "timeline" ? "hidden" : "block"}>
          <section className="mb-4 max-w-3xl">
            <h2 className="text-lg font-bold">
              {tab === "console" ? (
                <>
                  Sandboxed <span className="text-primary">REPL</span>
                </>
              ) : (
                <>
                  Event loop <span className="text-primary">visualizer</span>
                </>
              )}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-panel-foreground">
              {tab === "console"
                ? "Your code is parsed, instrumented, and executed inside a sandboxed iframe with no access to this document. console output is streamed back over postMessage."
                : "Switch to step mode, hit Record, then walk the trace one event at a time. Frames, microtasks, and tasks come from wrapped timers, patched promise reactions, and rewritten await points in your own code."}
            </p>
          </section>
          <ClientOnly
            fallback={
              <div className="rounded-sm border border-border bg-card p-6 text-sm text-muted-foreground">
                booting sandbox…
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="rounded-sm border border-border bg-card p-6 text-sm text-muted-foreground">
                  loading editor…
                </div>
              }
            >
              <Workbench
                code={code}
                onCodeChange={setCode}
                view={tab === "console" ? "console" : "loop"}
              />
            </Suspense>
          </ClientOnly>
        </div>
      </main>

      <footer className="mt-8 border-t border-border bg-panel">
        <div className="mx-auto max-w-350 px-4 py-5 text-[11.5px] leading-relaxed text-muted-foreground">
          <p>
            <span className="text-destructive">Uncaught TypeError:</span> Cannot read properties of
            null (reading &apos;author&apos;)
          </p>
          <p className="mt-1 pl-4 text-muted-foreground/70">
            at Footer (runtime.js:1:1) — this site is about the language, not a person.
          </p>
        </div>
      </footer>
    </div>
  );
}
