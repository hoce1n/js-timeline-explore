# js-timeline-explore

Interactive JavaScript timeline with a sandboxed REPL and real event-loop visualizer.

## What it does

`js-timeline-explore` is a browser-based JavaScript playground that shows how code actually executes over time.

- The sandboxed REPL lets visitors write and run JavaScript inside a secure iframe, not by using `eval` in the main page.
- The event-loop visualizer shows real call stack, microtask, and task queue behavior produced by instrumented execution.
- This is a working developer tool demo, not a decorative or fake “devtools” skin.

<!-- TODO: add screenshot/gif of the event loop visualizer in step mode -->

## Quick start

```sh
npm i
npm run dev
```

Then open the local URL shown by Vite.

## How it's built

The app is built with TanStack Start and Vite. User code runs in a sandboxed iframe, and the event-loop trace is generated from Acorn-based AST instrumentation plus controlled queue tracking.

## License

MIT — see LICENSE.

## About

A small interactive showcase of JavaScript execution and async behavior, with a low-key note that the project was developed using Lovable as the toolchain workflow.
