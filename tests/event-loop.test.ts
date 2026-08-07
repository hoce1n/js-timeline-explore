import { beforeEach, describe, expect, test } from "bun:test";
import type { SandboxEvent } from "../src/lib/sandbox";
import { describeEvent, deriveState, EMPTY_STATE } from "../src/lib/event-loop";

let seq = 0;
function ev(
  type: SandboxEvent["type"],
  extra: Partial<SandboxEvent> = {},
): SandboxEvent {
  seq += 1;
  return { seq, t: seq * 10, type, ...extra };
}

beforeEach(() => {
  seq = 0;
});

describe("deriveState", () => {
  test("returns empty lanes for an empty trace", () => {
    const s = deriveState([], 0);
    expect(s).toEqual(EMPTY_STATE);
    expect(s.completed).toBe(false);
  });

  test("honors the cursor cutoff", () => {
    const trace = [
      ev("stack-push", { name: "a" }),
      ev("stack-push", { name: "b" }),
      ev("stack-pop"),
    ];
    expect(deriveState(trace, 2).stack.map((f) => f.name)).toEqual(["a", "b"]);
    expect(deriveState(trace, 3).stack).toHaveLength(1);
  });

  test("tracks the executing line", () => {
    const s = deriveState([ev("line", { line: 7 })], 1);
    expect(s.currentLine).toBe(7);
  });

  test("moves microtasks from enqueue to run", () => {
    const trace = [
      ev("microtask-enqueue", { id: 1, label: "then reaction" }),
      ev("microtask-enqueue", { id: 2, label: "then reaction" }),
      ev("microtask-run", { id: 1 }),
    ];
    const s = deriveState(trace, 3);
    expect(s.microtasks.map((m) => m.id)).toEqual([2]);
  });

  test("routes scheduled timers through the pending lane", () => {
    const trace = [
      ev("macrotask-scheduled", { id: 1, label: "setTimeout 100ms" }),
      ev("macrotask-ready", { id: 1 }),
    ];
    const scheduled = deriveState(trace, 1);
    expect(scheduled.pending.map((p) => p.id)).toEqual([1]);
    expect(scheduled.macrotasks).toHaveLength(0);

    const ready = deriveState(trace, 2);
    expect(ready.pending).toHaveLength(0);
    expect(ready.macrotasks.map((m) => m.id)).toEqual([1]);
  });

  test("removes cancelled timers from the pending lane", () => {
    const trace = [
      ev("macrotask-scheduled", { id: 1 }),
      ev("macrotask-cancel", { id: 1 }),
    ];
    const s = deriveState(trace, 2);
    expect(s.pending).toHaveLength(0);
  });

  test("removes a run task from the macrotask queue", () => {
    const trace = [
      ev("macrotask-enqueue", { id: 1, label: "task" }),
      ev("macrotask-run", { id: 1 }),
    ];
    const s = deriveState(trace, 2);
    expect(s.macrotasks).toHaveLength(0);
  });

  test("accumulates console and error logs in order", () => {
    const trace = [
      ev("console", { level: "log", text: "one" }),
      ev("error", { text: "boom" }),
      ev("console", { level: "warn", text: "two" }),
    ];
    const s = deriveState(trace, 3);
    expect(s.logs.map((l) => l.text)).toEqual(["one", "boom", "two"]);
    expect(s.logs[1]?.level).toBe("error");
  });

  test("records the latest heap sample", () => {
    const s = deriveState(
      [
        ev("heap", { used: 10, total: 100, limit: 200 }),
        ev("heap", { used: 20, total: 100, limit: 200 }),
      ],
      2,
    );
    expect(s.heap?.used).toBe(20);
  });

  test("sets completed on the complete event", () => {
    const s = deriveState([ev("complete")], 1);
    expect(s.completed).toBe(true);
  });

  test("derives elapsedMs from the first and last event time", () => {
    const s = deriveState([ev("line", { line: 1 }), ev("line", { line: 2 })], 2);
    expect(s.elapsedMs).toBe(10);
    expect(s.currentTime).toBe(20);
  });
});

describe("describeEvent", () => {
  test("labels each event type in plain English", () => {
    expect(describeEvent(ev("line", { line: 3 }))).toContain("line 3");
    expect(describeEvent(ev("stack-push", { name: "go" }))).toContain("push go()");
    expect(describeEvent(ev("stack-pop"))).toContain("pop frame");
    expect(describeEvent(ev("stack-pop", { suspended: true }))).toContain("await");
    expect(describeEvent(ev("microtask-enqueue", { label: "r" }))).toContain("r");
    expect(describeEvent(ev("macrotask-scheduled", { id: 4 }))).toContain("Web API");
    expect(describeEvent(ev("macrotask-ready", { id: 4 }))).toContain("timer fired");
    expect(describeEvent(ev("macrotask-cancel", { id: 4 }))).toContain("cancel task #4");
    expect(describeEvent(ev("complete"))).toContain("queues drained");
  });
});
