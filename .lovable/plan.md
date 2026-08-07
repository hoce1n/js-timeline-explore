# Instrumentation coverage: combinators, mocked fetch, nested/throwing chains

Extend the existing sandbox tracing so more real async patterns show up correctly in the Event Loop visualizer. Same approach as today: patch built-ins for queue events, AST rewrite only for call stack and `await`. No synthetic or approximated events.

## 1. Promise combinators

Patch `Promise.all`, `Promise.race`, `Promise.allSettled`, `Promise.any` in the sandbox runtime so the visualizer shows meaningful labels instead of anonymous `.then reaction` entries.

- Each patched combinator registers its own microtask id and emits `microtask-enqueue` / `microtask-run` / `microtask-end` around the settlement of the aggregate promise, labelled e.g. `Promise.all settled (3)`.
- The per-input `.then` reactions the combinator uses internally are called through the raw, unpatched `then`, so we don't double-count one logical settlement as many anonymous reactions.
- Pending counter is incremented/decremented like the existing wrappers so completion detection stays correct.

## 2. Mocked fetch

The iframe has no network, so `window.fetch` is patched to a deterministic mock:

- Schedules a "network" macrotask through the already-patched `setTimeout` (labelled `fetch <url>`), then resolves with a real `Response` carrying a small JSON body — so the trace shows macrotask first, then the microtask that resolves the fetch promise, exactly as real fetch behaves.
- Response body/status/delay configurable per run via a `window.__mockFetch` map the runtime reads (default: `{ ok: true, url, data: [...] }`, ~120ms).
- A visible note in the Console panel header: "fetch is mocked in this sandbox — no network access."
- New REPL example demonstrating `await fetch(...)` + `.json()`.

## 3. Nested and throwing chains

Add three snippets and verify their traces in step mode:

- `.then().then().catch()` where the first `.then` throws
- a `.then()` created *inside* another `.then` callback and returned
- an `async` function awaiting a rejected promise inside `try/catch`

Where ordering or events are wrong, the fix goes in the generic `Promise.prototype.then` wrapper or `__rt.aw` (how reaction ids are allocated and when `pending` is decremented for chains created during a running reaction) — no per-case special casing. Two of these snippets ship as REPL examples.

## 4. Regression check

Re-run every existing `REPL_EXAMPLES` snippet through the sandbox in a headless browser and diff the event trace against the current behavior; the classic sync/micro/macro example must still yield `1: sync, 2: sync, 3: microtask, 4: macrotask` with the same event sequence.

## Technical notes

- `src/lib/sandbox.ts` — combinator patches, `fetch` mock, any fix to the `then` wrapper / `__rt.aw` tagging.
- `src/lib/event-loop.ts` — only if new labels need different rendering in `describeEvent`.
- `src/lib/js-eras.ts` — new REPL examples (fetch, throwing chain, nested chain).
- `src/components/devtools/Workbench.tsx` — mocked-fetch note in the console panel.
- LICENSE, README, and package.json naming are untouched.
