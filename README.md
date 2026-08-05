# JavaScript Explorer

Project Brief for Lovable

Concept

Build an interactive showcase website about the world of JavaScript — not a personal portfolio, not about any individual developer. The site is a conceptual, DevTools/REPL-themed exploration of JavaScript as a language and ecosystem.

Core Structure — Single Spine, Nested Layers

The site is organized around ONE main navigation axis: an evolutionary timeline of JavaScript. Do not build three separate top-level sections (timeline / concepts / ecosystem) — nest them:

Timeline (main navigation, horizontal or vertical scroll)
 └─ Each era (e.g. ES5, ES6/2015, Async Era, Modern JS) expands to:
     └─ Concepts introduced in that era (Concept layer)
         └─ Each concept links to where it lives in today's ecosystem (Ecosystem layer)


Eras to include (keep to 5-6 max)

Pre-ES6 (ES5 era) — var, callbacks, prototypal inheritance basics

ES6/2015 — let/const, arrow functions, classes, Promises, template literals

Async Era (ES2017+) — async/await, event loop maturity

Module Era — ES Modules, import/export, npm ecosystem growth

Modern JS (ES2020+) — optional chaining, nullish coalescing, top-level await

Runtime Diversification — Node.js vs Deno vs Bun, edge runtimes

For each era, pick 2-3 concepts max. Do not try to cover everything — depth over breadth.

Ecosystem layer

From relevant concepts, link out to how V8, Node.js, Deno, and Bun each handle it today (e.g., event loop implementation differences, module resolution differences). Keep this comparative, not exhaustive — a short comparison table or small interactive diagram per concept is enough.

Functional Requirements (must be REAL, not decorative)

This is the most important constraint: most JS-themed portfolio sites fake their "nerdiness" with static styling. This site must have at least these working, non-fake features:

Live REPL / code sandbox: an embedded code editor (Monaco Editor or CodeMirror) where visitors can write and actually execute JavaScript in the browser. Execute in a sandboxed iframe or Web Worker — never eval in the main document context.

Real-time Event Loop Visualizer: when a visitor runs code with async operations (setTimeout, Promises, async/await), show an actual live diagram of the Call Stack, Microtask Queue, and Macrotask/Task Queue updating step-by-step as the code executes — not a looping decorative animation. This should be driven by real instrumentation of the executed code, not a scripted fake sequence.

If full real-time instrumentation of the event loop is too complex to build reliably, an acceptable fallback is a step-through visualizer: the visitor writes code, hits "step," and sees the call stack / queues update one execution step at a time, computed from actually parsing/running the code — still real, just not live-streaming.

Visual Design

Dark theme, VS Code Dark Modern / One Dark Pro inspired

Accent colors: JavaScript yellow #F7DF1E and TypeScript blue #3178C6

Monospace font throughout code areas (e.g. JetBrains Mono)

Real syntax highlighting (not fake colored spans) — use an actual highlighter (Shiki, Prism, or the editor's built-in highlighting)

Navigation styled like browser DevTools tabs ([Console], [Sources], [Network]-style tab aesthetics) — but used to navigate the timeline/eras, not literal browser panels

Error/notice UI styled like real JS runtime errors (Uncaught TypeError, UnhandledPromiseRejection) for empty states or fun easter eggs

Explicit Non-Goals

This is NOT a personal portfolio. No "about me," no resume, no personal branding. The subject is JavaScript itself.

Do not over-decorate with fake system-monitor widgets (fake htop-style CPU/memory graphs) unless they're wired to something real (e.g., actual heap size during REPL execution via performance.memory where available). Fake data undermines the entire premise.

Scope Note

Keep the site to a single-page or few-page experience — a showcase, not a full app. Prioritize a small number of genuinely interactive, correct features over broad but shallow coverage.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b076034c-0a7c-4017-b6eb-5b30e3906e9a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
