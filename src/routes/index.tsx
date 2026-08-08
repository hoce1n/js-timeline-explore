import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { AppShell, type Tab } from "@/components/devtools/AppShell";
import { SourcesView } from "@/components/devtools/SourcesView";
import { ERAS, REPL_EXAMPLES } from "@/lib/js-eras";
import { encodeCode, readCodeFromHash } from "@/lib/share";
import { SITE_ORIGIN, SITE_TITLE, SITE_DESCRIPTION } from "@/lib/seo";

const Workbench = lazy(() => import("@/components/devtools/Workbench"));

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => ({
    tab: search.tab === "loop" || search.tab === "console" ? search.tab : "timeline",
  }),
  head: () => ({
    meta: [
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:image", content: `${SITE_ORIGIN}/og-image.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:url", content: `${SITE_ORIGIN}/` },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { name: "twitter:image", content: `${SITE_ORIGIN}/og-image.png` },
    ],
  }),
  component: Index,
});

function Index() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [activeEra, setActiveEra] = useState(() => ERAS[0]!.id);
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);
  const [code, setCode] = useState(() =>
    typeof window === "undefined"
      ? REPL_EXAMPLES[0]!.code
      : (readCodeFromHash(window.location.hash) ?? REPL_EXAMPLES[0]!.code),
  );

  // Keep the shareable hash in sync with the editor (debounced, no history spam).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      const hash = `#code=${encodeCode(code)}`;
      if (window.location.hash !== hash) history.replaceState(null, "", hash);
    }, 350);
    return () => clearTimeout(timer);
  }, [code]);

  // Opening a shared link updates the editor without a reload.
  useEffect(() => {
    const onHash = () => {
      const fromHash = readCodeFromHash(window.location.hash);
      if (fromHash !== null) setCode(fromHash);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const runInConsole = (snippet: string) => {
    setCode(snippet);
    navigate({ to: "/", search: { tab: "console" } });
  };

  return (
    <AppShell tab={tab} onTabChange={(next) => navigate({ to: "/", search: { tab: next } })}>
      {tab === "timeline" && (
        <SourcesView
          activeEra={activeEra}
          expandedConcept={expandedConcept}
          onSelectEra={setActiveEra}
          onToggleConcept={setExpandedConcept}
          onRun={runInConsole}
        />
      )}

      {tab !== "timeline" && (
        <div>
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
              <Workbench code={code} onCodeChange={setCode} view={tab === "console" ? "console" : "loop"} />
            </Suspense>
          </ClientOnly>
        </div>
      )}
    </AppShell>
  );
}
