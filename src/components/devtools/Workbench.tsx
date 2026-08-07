import { useEffect, useMemo, useRef, useState } from "react";
import { Play, SkipBack, SkipForward, RotateCcw, Square, Zap, Terminal } from "lucide-react";
import CodeEditor from "./CodeEditor";
import { useSandbox } from "@/hooks/use-sandbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { deriveState, describeEvent } from "@/lib/event-loop";
import { REPL_EXAMPLES } from "@/lib/js-eras";

type Props = {
  code: string;
  onCodeChange: (code: string) => void;
  view: "console" | "loop";
};

export default function Workbench({ code, onCodeChange, view }: Props) {
  const { hostRef, status, trace, run, reset } = useSandbox();
  const [mode, setMode] = useState<"run" | "step">("run");
  const [cursor, setCursor] = useState(0);
  const logRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (mode === "run") setCursor(trace.length);
  }, [trace, mode]);

  useEffect(() => {
    if (mode === "step" && status === "running") setCursor(0);
  }, [status, mode]);

  const state = useMemo(() => deriveState(trace, cursor), [trace, cursor]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [state.logs.length]);

  const recording = mode === "step" && status === "running";
  const canStep = mode === "step" && trace.length > 0 && status !== "running";
  const lastEvent = cursor > 0 ? trace[cursor - 1] : undefined;

  const handleRun = () => {
    setCursor(0);
    run(code);
  };

  return (
    <div className="grid gap-px overflow-hidden rounded-sm border border-border bg-border lg:grid-cols-2">
      {/* editor column */}
      <div className="flex min-h-[300px] flex-col bg-card lg:min-h-[520px]">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-panel px-3 py-2">
          <button
            onClick={handleRun}
            disabled={status === "booting"}
            title="Run (Ctrl/Cmd+Enter)"
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            <Play className="size-3.5" />
            {mode === "step" ? "Record" : "Run"}
          </button>

          <div className="flex overflow-hidden rounded-sm border border-border">
            {(["run", "step"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setCursor(m === "run" ? trace.length : 0);
                }}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  mode === m
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "run" ? "live" : "step"}
              </button>
            ))}
          </div>

          <select
            aria-label="Load example"
            className="rounded-sm border border-border bg-card px-2 py-1 text-xs text-muted-foreground outline-none focus:border-secondary"
            value=""
            onChange={(e) => {
              const found = REPL_EXAMPLES.find((x) => x.id === e.target.value);
              if (found) {
                onCodeChange(found.code);
                reset();
                setCursor(0);
              }
            }}
          >
            <option value="">examples…</option>
            {REPL_EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              reset();
              setCursor(0);
            }}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3.5" /> clear
          </button>

          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className={`size-1.5 rounded-full ${
                status === "running"
                  ? "bg-warning"
                  : status === "timeout"
                    ? "bg-destructive"
                    : status === "booting"
                      ? "bg-muted-foreground"
                      : "bg-success"
              }`}
            />
            sandbox: {status}
            <span className="ml-1 hidden rounded-sm border border-border px-1 py-px text-[10px] sm:inline">
              ⌘/Ctrl⏎ run
            </span>
          </span>
        </div>

        <div className="min-h-0 flex-1">
          <CodeEditor
            value={code}
            onChange={onCodeChange}
            onRun={handleRun}
            activeLine={mode === "step" ? (state.currentLine ?? null) : null}
            minHeight={isMobile ? "220px" : "440px"}
          />
        </div>

        {canStep && (
          <div className="flex items-center gap-2 border-t border-border bg-panel px-3 py-2">
            <button
              onClick={() => setCursor((c) => Math.max(0, c - 1))}
              className="rounded-sm border border-border p-1 text-muted-foreground hover:text-foreground"
              aria-label="Step backward"
            >
              <SkipBack className="size-3.5" />
            </button>
            <button
              onClick={() => setCursor((c) => Math.min(trace.length, c + 1))}
              className="rounded-sm border border-border p-1 text-muted-foreground hover:text-foreground"
              aria-label="Step forward"
            >
              <SkipForward className="size-3.5" />
            </button>
            <input
              type="range"
              min={0}
              max={trace.length}
              value={cursor}
              onChange={(e) => setCursor(Number(e.target.value))}
              aria-label="Execution step"
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-accent accent-primary"
            />
            <span className="w-20 shrink-0 text-right text-[11px] text-muted-foreground">
              {cursor} / {trace.length}
            </span>
          </div>
        )}

        {canStep && (
          <div className="border-t border-border bg-card px-3 py-2 text-[11.5px] text-panel-foreground">
            <span className="text-secondary">step&gt;</span>{" "}
            {lastEvent ? describeEvent(lastEvent) : "before first instruction"}
          </div>
        )}
      </div>

      {/* output column */}
      <div className="flex min-h-[300px] flex-col bg-card lg:min-h-[520px]">
        <div className="flex items-center gap-2 border-b border-border bg-panel px-3 py-2 text-xs text-muted-foreground">
          {view === "console" ? <Terminal className="size-3.5" /> : <Zap className="size-3.5" />}
          {view === "console" ? "Console output" : "Event loop — live instrumentation"}
          {recording && <span className="ml-auto text-warning">recording…</span>}
          {state.heap && (
            <span className="ml-auto text-[11px]">
              heap {(state.heap.used / 1048576).toFixed(1)} MB
            </span>
          )}
        </div>

        {view === "console" ? (
          <ConsolePanel logs={state.logs} logRef={logRef} status={status} traceLength={trace.length} />
        ) : (
          <LoopPanel state={state} traceLength={trace.length} />
        )}
      </div>

      <div ref={hostRef} aria-hidden className="hidden" />
    </div>
  );
}

function ConsolePanel({

  logs,
  logRef,
  status,
  traceLength,
}: {
  logs: ReturnType<typeof deriveState>["logs"];
  logRef: React.RefObject<HTMLDivElement | null>;
  status: string;
  traceLength: number;
}) {
  const MAX_RENDERED_LOGS = 1000;
  const hidden = Math.max(0, logs.length - MAX_RENDERED_LOGS);
  const visible = hidden > 0 ? logs.slice(logs.length - MAX_RENDERED_LOGS) : logs;
  return (
    <>
      <p className="border-b border-border/60 bg-panel/60 px-3 py-1 text-[11px] text-muted-foreground">
        fetch is mocked in this sandbox — no network access.
      </p>
    <div ref={logRef} className="min-h-0 flex-1 overflow-auto px-3 py-2 text-[12.5px] leading-relaxed">

      {logs.length === 0 && traceLength === 0 && (
        <p className="text-muted-foreground">
          <span className="text-secondary">&gt;</span> nothing logged yet — hit Run.
        </p>
      )}
      {logs.length === 0 && traceLength > 0 && status !== "running" && (
        <p className="text-muted-foreground">
          <span className="text-secondary">&gt;</span> executed with no console output.
        </p>
      )}
      {hidden > 0 && (
        <p className="mb-1 border-b border-border/40 py-1 text-[11px] text-warning">
          output truncated — {hidden} earlier line{hidden === 1 ? "" : "s"} hidden (showing last{" "}
          {MAX_RENDERED_LOGS})
        </p>
      )}
      {visible.map((log) => (
        <div
          key={log.seq}
          className={`flex gap-2 border-b border-border/40 py-1 font-mono ${
            log.level === "error"
              ? "text-destructive"
              : log.level === "warn"
                ? "text-warning"
                : "text-foreground"
          }`}
        >
          <span className="select-none text-muted-foreground">
            {log.level === "error" ? "✕" : log.level === "warn" ? "▲" : "›"}
          </span>
          <pre className="whitespace-pre-wrap break-words">{log.text}</pre>
        </div>
      ))}
    </div>
    </>
  );

}

function LoopPanel({
  state,
  traceLength,
}: {
  state: ReturnType<typeof deriveState>;
  traceLength: number;
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-rows-[1fr_1fr_1fr_auto] divide-y divide-border">
      <Lane
        title="Call Stack"
        hint="LIFO — top frame is executing"
        color="text-stack"
        border="border-l-stack"
        items={[...state.stack].reverse().map((f) => ({
          key: f.key,
          label: f.name + (f.line ? `  · line ${f.line}` : ""),
        }))}
        empty={traceLength === 0 ? "idle" : "empty — run to completion"}
      />
      <Lane
        title="Microtask Queue"
        hint="drains fully before the next task"
        color="text-microtask"
        border="border-l-microtask"
        items={state.microtasks.map((m, i) => ({ key: `${m.id}-${i}`, label: m.label }))}
        empty="empty"
      />
      <Lane
        title="Macrotask Queue"
        hint="one task per loop turn"
        color="text-macrotask"
        border="border-l-macrotask"
        items={state.macrotasks.map((m, i) => ({ key: `${m.id}-${i}`, label: m.label }))}
        empty="empty"
      />
      <div className="bg-panel px-3 py-2 text-[11px] text-muted-foreground">
        {traceLength === 0
          ? "No trace recorded. Every frame and queue entry below comes from your code's real execution."
          : `${traceLength} instrumented events recorded${state.completed ? " · queues drained" : ""}`}
      </div>
    </div>
  );
}

function Lane({
  title,
  hint,
  color,
  border,
  items,
  empty,
}: {
  title: string;
  hint: string;
  color: string;
  border: string;
  items: { key: string; label: string }[];
  empty: string;
}) {
  return (
    <div className="min-h-0 overflow-auto p-3">
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className={`text-[11px] font-bold uppercase tracking-widest ${color}`}>{title}</h3>
        <span className="text-[10.5px] text-muted-foreground">{hint}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[11.5px] text-muted-foreground/70">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.key}
              className={`truncate border-l-2 bg-accent/50 px-2 py-1 text-[11.5px] ${border}`}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
