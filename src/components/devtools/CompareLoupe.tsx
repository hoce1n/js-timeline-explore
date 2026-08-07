import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";

const LOUPE_URL = "https://latentflip.com/loupe/";

const ROWS: { label: string; loupe: string; ours: string }[] = [
  {
    label: "Execution",
    loupe: "A hand-drawn animation of how the code might run.",
    ours: "Your code actually executes, inside a sandboxed iframe. Every frame and queue entry is a real event.",
  },
  {
    label: "Code input",
    loupe: "Pick from a fixed list of demo programs.",
    ours: "Type anything. New code means a new trace — nothing is special-cased.",
  },
  {
    label: "Microtasks",
    loupe: "Async callbacks collapse into one callback queue.",
    ours: "Microtask and macrotask queues are separate lanes, and microtasks drain fully before the next task.",
  },
  {
    label: "Stepping",
    loupe: "Watch the animation, then it's over.",
    ours: "Pause, step forward and back, or scrub a slider — the editor highlights the line that is actually running.",
  },
  {
    label: "Data",
    loupe: "None — it's an illustration.",
    ours: "Real heap samples and per-event timings from the instrumented run.",
  },
  {
    label: "Sharing",
    loupe: "—",
    ours: "Share links embed your code in the URL, so a snippet opens preloaded.",
  },
];

/**
 * The honest pitch: Loupe (Philip Roberts) is the classic *illustration* of
 * the event loop. This project is a *measurement* of your code's real trace.
 */
export function CompareLoupe() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-8 max-w-3xl">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
        <h2 className="text-sm font-bold text-foreground">
          How is this different from <span className="text-primary">Loupe</span>?
        </h2>
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          <p className="text-[13px] leading-relaxed text-panel-foreground">
            <a
              href={LOUPE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-secondary underline decoration-secondary/40 underline-offset-2 hover:text-foreground"
            >
              Loupe <ExternalLink className="size-3" />
            </a>{" "}
            is the classic introduction from Philip Roberts&apos; &ldquo;What the heck is the event
            loop anyway?&rdquo; — and it is brilliant at that. But it animates a scripted model of
            how code <em>might</em> run. This project runs your actual code and renders the events
            it really produces. Loupe answers &ldquo;what is the event loop?&rdquo;; this answers
            &ldquo;what does <em>my</em> code do to the event loop?&rdquo;
          </p>

          <div className="overflow-hidden rounded-sm border border-border">
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-border bg-panel text-[10.5px] uppercase tracking-widest text-muted-foreground">
                  <th className="w-24 px-3 py-2 align-bottom font-medium md:w-32">Aspect</th>
                  <th className="w-[38%] border-l border-border px-3 py-2 align-bottom font-medium">
                    Loupe
                  </th>
                  <th className="border-l border-border px-3 py-2 align-bottom font-medium">
                    runtime.js (this site)
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <th
                      scope="row"
                      className="border-r border-border px-3 py-2 align-top font-medium text-foreground"
                    >
                      {row.label}
                    </th>
                    <td className="border-r border-border px-3 py-2 leading-relaxed text-muted-foreground">
                      {row.loupe}
                    </td>
                    <td className="px-3 py-2 leading-relaxed text-panel-foreground">{row.ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
