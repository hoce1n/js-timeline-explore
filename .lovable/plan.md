# Instrumentation coverage: combinators, mocked fetch, nested/throwing chains

Extend the existing sandbox tracing so more real async patterns show up correctly in the Event Loop visualizer. Same approach as today: patch built-ins for queue events, AST rewrite only for call stack and `await`. No synthetic or approximated events.

## 1. Promise combinators

Patch `Promise.all`, `Promise.race`, `Promise.allSettled`, `Promise.any` in the sandbox runtime so the visualizer shows meaningful labels instead of anonymous `.then reaction` entries.

- Each patched combinator registers its own microtask id and emits `microtask-enqueue` / `microtask-run` / `microtask-end` around the settlement of the aggregate promise, labelled e.g. `Promise.all settled (3)`.
- The per-input `.then` reactions the combinator uses internally go through the raw, unpatched `then`, so one logical settlement isn't double-counted as many anonymous reactions.
- Pending counter is incremented/decremented like the existing wrappers so completion detection stays correct.

Spec accuracy, not visual approximation. The patches delegate to the native combinators wherever possible so semantics come from the engine:

- `race` settles on the first input to settle, resolve or reject, without waiting for the rest.
- `any` resolves on the first fulfillment; rejects with an `AggregateError` carrying all reasons only when every input rejects.
- `allSettled` never rejects and waits for all inputs.
- `all` rejects immediately on the first rejection.

Each is checked by hand against native behavior — comparing actual console output for fulfilled/rejected/mixed input sets, not merely that the snippet runs.

## 2. Mocked fetch

The iframe has no network, so `window.fetch` is patched to a deterministic mock:

- Schedules a "network" macrotask through the already-patched `setTimeout` (labelled `fetch <url>`), then resolves with a real `Response` carrying a small JSON body — so the trace shows the macrotask first, then the microtask resolving the fetch promise, exactly as real fetch behaves.
- Body/status/delay configurable per run via a `window.__mockFetch` map the runtime reads (default: `{ ok: true, url, data: [...] }`, ~120ms).
- Console panel header gains the note: "fetch is mocked in this sandbox — no network access."
- New REPL example demonstrating `await fetch(...)` + `.json()`.

## 3. Nested and throwing chains

Three snippets, each verified in step mode:

- `.then().then().catch()` where the first `.then` throws
- a `.then()` created *inside* another `.then` callback and returned
- an `async` function awaiting a rejected promise inside `try/catch`

Where ordering or events are wrong, the fix goes in the generic `Promise.prototype.then` wrapper or `__rt.aw` — specifically how reaction ids are allocated and when `pending` is decremented for chains created while a reaction is running. No per-case special casing. Two of these ship as REPL examples.

## 4. Manual verification (no new test infrastructure)

No test runner is added; that infra work stays deferred.

- Every existing `REPL_EXAMPLES` snippet plus the new ones is run through the app in step mode and the event order confirmed by eye.
- The classic sync/micro/macro example must still yield `1: sync, 2: sync, 3: microtask, 4: macrotask` with the same event sequence as before; any change is called out explicitly.

## Technical notes

- `src/lib/sandbox.ts` — combinator patches, fetch mock, any fix to the `then` wrapper / `__rt.aw` tagging.
- `src/lib/event-loop.ts` — only if new labels need different rendering in `describeEvent`.
- `src/lib/js-eras.ts` — new REPL examples (fetch, throwing chain, nested chain).
- `src/components/devtools/Workbench.tsx` — mocked-fetch note in the console panel.
- LICENSE, README, and package.json naming are untouched — deliberately out of scope.
