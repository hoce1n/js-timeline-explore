import { ArrowDown } from "lucide-react";
import type { LoopState, QueueItem, StackFrame } from "@/lib/event-loop";

/**
 * Optional boxes-and-lanes event-loop diagram.
 *
 * The call stack is drawn as a literal vertical stack of blocks (top frame
 * executing) and each queue as a horizontal lane of tokens. This is a
 * secondary view over the exact same derived trace state as the text lanes —
 * an additional way to see the data at each step, never a replacement.
 */
export function LoopDiagram({ state, traceLength }: { state: LoopState; traceLength: number }) {
  const idle = traceLength === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-3">
      <PendingLane items={state.pending} idle={idle} />
      <FlowArrow label="timer fires → task queued" color="text-api" />
      <QueueLane
        title="Macrotask Queue"
        hint="one task per loop turn"
        color="text-macrotask"
        border="border-macrotask"
        chip="bg-macrotask/10 text-macrotask"
        items={state.macrotasks.map((m) => ({ key: `M${m.id}`, label: m.label }))}
        idle={idle}
      />
      <FlowArrow label="event loop picks up the task → call stack" color="text-macrotask" />
      <StackLane frames={[...state.stack].reverse()} idle={idle} />
      <FlowArrow label="microtasks drain back into the stack" color="text-microtask" />
      <QueueLane
        title="Microtask Queue"
        hint="drains fully before the next task"
        color="text-microtask"
        border="border-microtask"
        chip="bg-microtask/10 text-microtask"
        items={state.microtasks.map((m) => ({ key: `m${m.id}`, label: m.label }))}
        idle={idle}
      />
    </div>
  );
}

function LaneHeader({ title, hint, color }: { title: string; hint: string; color: string }) {
  return (
    <div className="mb-1.5 flex items-baseline gap-2">
      <h3 className={`text-[11px] font-bold uppercase tracking-widest ${color}`}>{title}</h3>
      <span className="text-[10.5px] text-muted-foreground">{hint}</span>
    </div>
  );
}

function FlowArrow({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5 pl-4">
      <ArrowDown className={`size-3 shrink-0 ${color}`} aria-hidden />
      <span className="text-[10px] text-muted-foreground/70">{label}</span>
    </div>
  );
}

function StackLane({ frames, idle }: { frames: StackFrame[]; idle: boolean }) {
  return (
    <section aria-label="Call stack (diagram)" className="rounded-sm border border-border bg-card/60 p-3">
      <LaneHeader title="Call Stack" hint="LIFO — top frame is executing" color="text-stack" />
      {frames.length === 0 ? (
        <p className="text-[11.5px] text-muted-foreground/70">
          {idle ? "idle" : "empty — run to completion"}
        </p>
      ) : (
        <ol className="space-y-1">
          {frames.map((frame, i) => {
            const top = i === 0;
            return (
              <li
                key={frame.key}
                className={`flex items-center gap-2 border px-2.5 py-1.5 text-[11.5px] ${
                  top
                    ? "border-stack bg-stack/15 text-foreground shadow-[inset_2px_0_0_0_var(--stack)]"
                    : "border-border/70 bg-accent/40 text-panel-foreground"
                }`}
              >
                <span className="min-w-0 truncate font-medium">{frame.name}</span>
                {frame.line ? (
                  <span className="text-[10.5px] text-muted-foreground">line {frame.line}</span>
                ) : null}
                {top && (
                  <span className="ml-auto shrink-0 text-[10px] uppercase tracking-widest text-stack">
                    executing
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function QueueLane({
  title,
  hint,
  color,
  border,
  chip,
  items,
  idle,
}: {
  title: string;
  hint: string;
  color: string;
  border: string;
  chip: string;
  items: { key: string; label: string }[];
  idle: boolean;
}) {
  return (
    <section aria-label={title} className="rounded-sm border border-border bg-card/60 p-3">
      <LaneHeader title={title} hint={hint} color={color} />
      {items.length === 0 ? (
        <p className="text-[11.5px] text-muted-foreground/70">{idle ? "idle" : "empty"}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => (
            <span
              key={item.key}
              className={`inline-flex max-w-full items-center gap-1 rounded-sm border px-2 py-1 text-[11px] ${border} ${chip}`}
            >
              <span className="min-w-0 truncate">{item.label}</span>
              {i < items.length - 1 && (
                <span className="text-muted-foreground/60" aria-hidden>
                  →
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function PendingLane({ items, idle }: { items: QueueItem[]; idle: boolean }) {
  return (
    <section aria-label="Web APIs (diagram)" className="rounded-sm border border-border bg-card/60 p-3">
      <LaneHeader title="Web APIs" hint="in-flight handles — timers, fetch" color="text-api" />
      {items.length === 0 ? (
        <p className="text-[11.5px] text-muted-foreground/70">
          {idle ? "idle" : "no pending handles"}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {items.map((item) => (
            <span
              key={`p${item.id}`}
              className="inline-flex max-w-full items-center rounded-sm border border-api bg-api/10 px-2 py-1 text-[11px] text-api"
            >
              <span className="min-w-0 truncate">{item.label}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
