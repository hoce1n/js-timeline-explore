import { useState } from "react";
import { ChevronRight, Play } from "lucide-react";
import { ERAS, type Concept } from "@/lib/js-eras";
import { CodeBlock } from "./CodeBlock";

const RUNTIME_COLOR: Record<string, string> = {
  V8: "text-warning",
  "Node.js": "text-success",
  Deno: "text-foreground",
  Bun: "text-primary",
};

export function Timeline({ onRun }: { onRun: (code: string) => void }) {
  const [activeEra, setActiveEra] = useState<string>(ERAS[0]!.id);

  return (
    <div className="grid gap-px bg-border md:grid-cols-[220px_1fr]">
      {/* era rail */}
      <nav className="bg-panel p-2" aria-label="JavaScript eras">
        <p className="px-2 pb-2 pt-1 text-[10.5px] uppercase tracking-widest text-muted-foreground">
          Timeline
        </p>
        <ol className="space-y-px">
          {ERAS.map((era, i) => {
            const active = era.id === activeEra;
            return (
              <li key={era.id}>
                <button
                  onClick={() => setActiveEra(era.id)}
                  className={`flex w-full items-center gap-2 border-l-2 px-2.5 py-2 text-left text-xs transition-colors ${
                    active
                      ? "border-l-primary bg-accent text-foreground"
                      : "border-l-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <span className="w-4 shrink-0 text-[10px] text-muted-foreground">
                    {String(i).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{era.label}</span>
                    <span className="block truncate text-[10.5px] text-muted-foreground">
                      {era.years}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* era detail */}
      <div className="bg-card">
        {ERAS.filter((e) => e.id === activeEra).map((era) => (
          <article key={era.id} className="p-5 md:p-7">
            <header className="border-b border-border pb-5">
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-xl font-bold text-primary">{era.label}</h2>
                <span className="rounded-sm border border-secondary/50 px-1.5 py-0.5 text-[10.5px] text-secondary">
                  {era.spec}
                </span>
                <span className="text-xs text-muted-foreground">{era.years}</span>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-panel-foreground">
                {era.summary}
              </p>
            </header>

            <div className="divide-y divide-border">
              {era.concepts.map((concept) => (
                <ConceptRow key={concept.id} concept={concept} onRun={onRun} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ConceptRow({ concept, onRun }: { concept: Concept; onRun: (code: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <ChevronRight
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
        <h3 className="text-sm font-medium text-foreground">{concept.name}</h3>
        {concept.ecosystem && (
          <span className="ml-auto shrink-0 text-[10.5px] text-muted-foreground">
            + runtime comparison
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-4 pl-6">
          <p className="max-w-3xl text-[13px] leading-relaxed text-panel-foreground">
            {concept.blurb}
          </p>

          <div className="relative max-w-3xl">
            <CodeBlock code={concept.code} />
            <button
              onClick={() => onRun(concept.code)}
              className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Play className="size-3" /> run in console
            </button>
          </div>

          {concept.ecosystem && (
            <div className="max-w-3xl overflow-hidden rounded-sm border border-border">
              <div className="border-b border-border bg-panel px-3 py-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                {concept.ecosystem.title}
              </div>
              <table className="w-full border-collapse text-left text-[12px]">
                <tbody>
                  {concept.ecosystem.rows.map((row) => (
                    <tr key={row.runtime} className="border-b border-border last:border-0">
                      <th
                        scope="row"
                        className={`w-24 whitespace-nowrap border-r border-border px-3 py-2 align-top font-medium ${
                          RUNTIME_COLOR[row.runtime] ?? "text-foreground"
                        }`}
                      >
                        {row.runtime}
                      </th>
                      <td className="px-3 py-2 leading-relaxed text-panel-foreground">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
