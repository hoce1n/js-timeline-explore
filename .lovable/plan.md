# JS: The Language, Explored

An interactive, DevTools-themed showcase about JavaScript itself — one timeline spine, with concepts and ecosystem comparisons nested inside it. Plus two genuinely working tools: a sandboxed REPL and a real event-loop visualizer.

## Structure

Single page at `/` with a DevTools-style tab bar as the primary chrome:

```text
[ Timeline ]  [ Runtime ]  [ Console ]
     |            |            |
  era spine    event loop    live REPL
```

Timeline is the main axis. Six eras, each expanding in place:

```text
Era (ES5 / ES6 / Async / Modules / Modern / Runtimes)
 └─ 2-3 concepts, each with a real syntax-highlighted snippet
     └─ "Where it lives today" panel: V8 / Node / Deno / Bun comparison
```

Eras and concepts:
- Pre-ES6: `var` hoisting, callbacks, prototypal inheritance
- ES6/2015: `let`/`const` + TDZ, arrow functions & `this`, Promises
- Async Era: `async`/`await`, event loop maturity (microtask ordering)
- Module Era: ESM `import`/`export`, module resolution, npm graph
- Modern JS: optional chaining, nullish coalescing, top-level await
- Runtime Diversification: Node vs Deno vs Bun (module resolution, timers, APIs)

Only concepts with a real runtime difference get an ecosystem panel (compact comparison table, not exhaustive). Every concept snippet has a "Run in Console" button that loads it into the REPL.

## The two real features

**1. Sandboxed REPL** — CodeMirror 6 editor with real JS syntax highlighting. Code executes inside a `sandbox="allow-scripts"` iframe (separate origin-less context), never `eval` in the page. Console output (`log`/`warn`/`error`/uncaught errors, formatted objects) is posted back via `postMessage` and rendered as a DevTools console panel. Execution has a timeout so infinite loops don't hang the sandbox.

**2. Event Loop Visualizer** — real instrumentation, not animation. The user's code is instrumented before execution in the sandbox: `setTimeout`/`setInterval`, `Promise.then`/`queueMicrotask`, `async` resumption points, and function entry/exit are wrapped to emit ordered events. Those events drive three live panels: Call Stack, Microtask Queue, Macrotask Queue, plus a console sink.

Two modes on the same event trace:
- **Run** — events stream live as the code executes.
- **Step** — execution is recorded first, then the visitor steps forward/back through the real trace one entry at a time, with the corresponding source line highlighted.

Step mode is the guaranteed-correct path; Run mode replays the same trace with real timing. Nothing is scripted.

Optional, only if the browser exposes it: a real heap readout from `performance.memory` during REPL runs, hidden entirely when unavailable. No fake gauges.

## Visual design

- VS Code Dark Modern / One Dark Pro palette, all as semantic tokens in `src/styles.css` (oklch).
- Accents: JS yellow `#F7DF1E` (primary), TS blue `#3178C6` (secondary).
- JetBrains Mono for all code and UI chrome, loaded via `<link>` in the root route.
- Real highlighting from CodeMirror's language mode for the editor; Shiki for static snippets.
- Tabs styled as DevTools panel tabs; era spine as a Sources-style navigable rail.
- Empty states and easter eggs rendered as authentic runtime errors (`Uncaught TypeError: ...`, `UnhandledPromiseRejection`) with stack-trace styling.

No "about me," no resume, no personal branding anywhere.

## Technical notes

- Frontend only — no backend, no database needed.
- New deps: `codemirror` + `@codemirror/lang-javascript` + `@codemirror/theme-one-dark`, `shiki`, `acorn` (for instrumenting user code into event-emitting form).
- The editor and sandbox are browser-only: loaded via `React.lazy` behind `<ClientOnly>` so SSR never touches `window` or the iframe.
- Sandbox contract: parent → iframe sends source; iframe → parent sends `{type: 'log' | 'stack-push' | 'stack-pop' | 'microtask-enqueue' | 'macrotask-enqueue' | 'task-run' | 'done' | 'error'}` with sequence numbers.
- Route SEO: `/` gets its own `head()` with a JavaScript-specific title, description, og/twitter tags.

## Build order

1. Design tokens, fonts, DevTools tab shell, root SEO.
2. Timeline spine with all six eras + nested concepts (static content, Shiki snippets).
3. Ecosystem comparison panels on the concepts that warrant them.
4. Sandbox iframe runtime + console protocol.
5. CodeMirror REPL wired to the sandbox.
6. Instrumentation layer + event loop visualizer (step mode first, then live run).
7. Error-styled empty states, easter eggs, optional real heap readout.
