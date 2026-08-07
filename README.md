# js-timeline-explore

Interactive JavaScript timeline with a sandboxed REPL and real event-loop visualizer.

## What it does

`js-timeline-explore` is a browser-based JavaScript playground that shows how code actually executes over time.

- The sandboxed REPL lets visitors write and run JavaScript inside a secure iframe, not by using `eval` in the main page.
- The event-loop visualizer shows real call stack, microtask, and task queue behavior produced by instrumented execution.
- This is a working developer tool demo, not a decorative or fake "devtools" skin.

## Features

- **Eras timeline** — an expandable walk through JavaScript's eras, from `var` hoisting to top-level await, each with a runnable snippet and a runtime comparison (V8 / Node / Deno / Bun).
- **Sandboxed REPL** — CodeMirror editor wired to an instrumented iframe. Run with the button or `Ctrl/Cmd+Enter`. Console output streams back over `postMessage`.
- **Event-loop visualizer** — step or scrub through a real trace: call stack, microtask queue, macrotask queue, per-step timing, and total elapsed time.
- **Shareable links** — every snippet lives in the URL hash, so a share link reopens the editor preloaded with that code.
- **Copy & clear** — one-click copy on every code snippet, plus a clear-console button in the REPL.

## Quick start

```sh
npm i
npm run dev
```

Then open the local URL shown by Vite. (The lockfile is generated with [Bun](https://bun.sh) — `bun install` works too.)

## How it's different from Loupe

[Loupe](https://latentflip.com/loupe/) (Philip Roberts) is the classic introduction to the event
loop, and it plays a hand-authored animation of a fixed set of demo programs. This project is a
different kind of tool:

| | Loupe | runtime.js |
| --- | --- | --- |
| Execution | A scripted animation of how code *might* run | Your code actually runs, instrumented inside a sandboxed iframe |
| Code input | Fixed demo programs | Type anything — a new trace is produced, nothing is special-cased |
| Microtasks | Async callbacks collapse into one queue | Separate microtask and macrotask lanes; microtasks drain fully first |
| Stepping | Watch, then it's over | Step / scrub the real trace; the editor highlights the running line |
| Data | None — it's an illustration | Real heap samples and per-event timing |
| Sharing | — | Snippets embed in the URL as share links |

Loupe answers *"what is the event loop?"*. runtime.js answers *"what does my code do to the event
loop?"* — with evidence, not an illustration.

## How it's built

The app is built with TanStack Start and Vite. User code runs in a sandboxed iframe, and the event-loop trace is generated from Acorn-based AST instrumentation plus controlled queue tracking.

## License

MIT — see LICENSE.

## About

A small interactive showcase of JavaScript execution and async behavior, with a low-key note that the project was developed using Lovable as the toolchain workflow.
