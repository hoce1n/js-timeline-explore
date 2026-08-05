import type { SandboxEvent } from "./sandbox";

export type StackFrame = { name: string; line?: number | undefined; key: string };
export type QueueItem = { id: number; label: string };
export type LogLine = { level: "log" | "info" | "warn" | "error" | "debug"; text: string; seq: number };

export type LoopState = {
  stack: StackFrame[];
  microtasks: QueueItem[];
  macrotasks: QueueItem[];
  logs: LogLine[];
  currentLine?: number | undefined;
  heap?: { used: number; total: number; limit: number } | undefined;
  completed: boolean;
};

export const EMPTY_STATE: LoopState = {
  stack: [],
  microtasks: [],
  macrotasks: [],
  logs: [],
  completed: false,
};

/** Pure fold of the recorded event trace up to `cursor` events. */
export function deriveState(trace: SandboxEvent[], cursor: number): LoopState {
  const stack: StackFrame[] = [];
  const microtasks: QueueItem[] = [];
  const macrotasks: QueueItem[] = [];
  const logs: LogLine[] = [];
  let currentLine: number | undefined;
  let heap: LoopState["heap"];
  let completed = false;

  const upto = Math.min(cursor, trace.length);
  for (let i = 0; i < upto; i++) {
    const e = trace[i];
    if (!e) continue;
    switch (e.type) {
      case "line":
        currentLine = e.line;
        break;
      case "stack-push":
        stack.push({ name: e.name ?? "(anonymous)", line: e.line, key: `${e.seq}` });
        if (e.line) currentLine = e.line;
        break;
      case "stack-pop":
        stack.pop();
        break;
      case "microtask-enqueue":
        microtasks.push({ id: e.id ?? i, label: e.label ?? "microtask" });
        break;
      case "microtask-run":
        remove(microtasks, e.id);
        break;
      case "macrotask-enqueue":
        macrotasks.push({ id: e.id ?? i, label: e.label ?? "task" });
        break;
      case "macrotask-run":
        remove(macrotasks, e.id);
        break;
      case "console":
        logs.push({ level: e.level ?? "log", text: e.text ?? "", seq: e.seq });
        break;
      case "error":
        logs.push({ level: "error", text: e.text ?? "Error", seq: e.seq });
        break;
      case "heap":
        if (e.used) heap = { used: e.used, total: e.total ?? 0, limit: e.limit ?? 0 };
        break;
      case "complete":
        completed = true;
        break;
    }
  }

  return { stack, microtasks, macrotasks, logs, currentLine, heap, completed };
}

function remove(list: QueueItem[], id?: number) {
  if (id === undefined) {
    list.shift();
    return;
  }
  const idx = list.findIndex((item) => item.id === id);
  if (idx >= 0) list.splice(idx, 1);
  else list.shift();
}

/** Human label for a single trace entry, used by the step-through readout. */
export function describeEvent(e: SandboxEvent): string {
  switch (e.type) {
    case "line":
      return `execute line ${e.line}`;
    case "stack-push":
      return `push ${e.name}() onto the call stack`;
    case "stack-pop":
      return e.suspended ? "suspend frame at await (pops off the stack)" : "pop frame off the call stack";
    case "microtask-enqueue":
      return `enqueue microtask — ${e.label}`;
    case "microtask-run":
      return `dequeue microtask — ${e.label ?? "run reaction"}`;
    case "microtask-end":
      return "microtask finished";
    case "macrotask-enqueue":
      return `schedule task — ${e.label}`;
    case "macrotask-run":
      return `event loop picks up task #${e.id}`;
    case "macrotask-end":
      return "task callback finished";
    case "console":
      return `console.${e.level}(...)`;
    case "error":
      return e.text ?? "error";
    case "heap":
      return "heap sample";
    case "complete":
      return "queues drained — execution complete";
    default:
      return e.type;
  }
}
