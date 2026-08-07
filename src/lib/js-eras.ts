export type EcosystemRow = {
  runtime: "V8" | "Node.js" | "Deno" | "Bun";
  note: string;
};

export type Concept = {
  id: string;
  name: string;
  blurb: string;
  code: string;
  ecosystem?: {
    title: string;
    rows: EcosystemRow[];
  };
};

export type Era = {
  id: string;
  label: string;
  years: string;
  spec: string;
  summary: string;
  concepts: Concept[];
};

export const ERAS: Era[] = [
  {
    id: "pre-es6",
    label: "Pre-ES6",
    years: "1995 – 2014",
    spec: "ES5",
    summary:
      "One function scope, one binding keyword, and callbacks all the way down. Everything that came later is a reaction to this era's sharp edges.",
    concepts: [
      {
        id: "var-hoisting",
        name: "var & hoisting",
        blurb:
          "`var` is function-scoped and hoisted: the binding exists before the line that declares it, initialised to undefined. Loops that capture `var` capture one shared binding.",
        code: `console.log(typeof greeting); // "undefined", not a ReferenceError
var greeting = "hi";

for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log("var i =", i); // 3, 3, 3 — one shared binding
  }, 0);
}`,
      },
      {
        id: "callbacks",
        name: "Callbacks & the pyramid",
        blurb:
          "Before Promises, asynchrony meant passing continuations. Errors travelled as a first argument by convention — nothing in the language enforced it.",
        code: `function readValue(key, cb) {
  setTimeout(function () {
    cb(null, key.toUpperCase());
  }, 0);
}

readValue("a", function (err, a) {
  readValue(a + "b", function (err, b) {
    readValue(b + "c", function (err, c) {
      console.log("nested result:", c);
    });
  });
});`,
      },
      {
        id: "prototypes",
        name: "Prototypal inheritance",
        blurb:
          "There are no classes underneath — only objects linked to other objects. `class` in later eras is syntax over this exact mechanism.",
        code: `function Signal(name) {
  this.name = name;
}
Signal.prototype.describe = function () {
  return "Signal<" + this.name + ">";
};

var s = new Signal("tick");
console.log(s.describe());
console.log(Object.getPrototypeOf(s) === Signal.prototype);`,
      },
    ],
  },
  {
    id: "es2015",
    label: "ES6 / 2015",
    years: "2015",
    spec: "ES2015",
    summary:
      "The largest single revision of the language. Block scoping, lexical `this`, class syntax, and a standardised Promise — the foundation of every later feature.",
    concepts: [
      {
        id: "let-const",
        name: "let / const and the TDZ",
        blurb:
          "Block-scoped bindings still hoist, but into a temporal dead zone: touching them before initialisation throws instead of yielding undefined.",
        code: `{
  try {
    console.log(count); // TDZ
  } catch (err) {
    console.log(err.name + ":", err.message);
  }
  let count = 1;
  console.log("after init:", count);
}

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log("let i =", i), 0); // 0, 1, 2
}`,
      },
      {
        id: "arrow-this",
        name: "Arrow functions & lexical this",
        blurb:
          "Arrows have no own `this`, `arguments`, or `prototype`. They close over the enclosing binding, which removed a whole genre of `var self = this` workarounds.",
        code: `const counter = {
  count: 0,
  startLexical() {
    [1, 2].forEach(() => { this.count++; });
    return this.count;
  },
  startClassic() {
    [1, 2].forEach(function () { this?.count++; });
    return this.count;
  },
};

console.log("arrow keeps this:", counter.startLexical());
console.log("classic loses it:", counter.startClassic());`,
      },
      {
        id: "promises",
        name: "Promises",
        blurb:
          "A standard object for a value that is not here yet — and, crucially, a standard scheduling rule: reactions run on the microtask queue, always after the current synchronous run to completion.",
        code: `console.log("1 sync");

setTimeout(() => console.log("4 macrotask"), 0);

Promise.resolve()
  .then(() => console.log("3 microtask"));

console.log("2 sync");`,
        ecosystem: {
          title: "Microtask draining across runtimes",
          rows: [
            {
              runtime: "V8",
              note: "Owns the microtask queue itself; the host decides when checkpoints run. `queueMicrotask` and promise reactions share one FIFO queue.",
            },
            {
              runtime: "Node.js",
              note: "libuv drives phases; microtasks drain after each macrotask AND between each `process.nextTick` batch — nextTick jumps ahead of promises.",
            },
            {
              runtime: "Deno",
              note: "Tokio event loop over V8, no nextTick queue in native code — promise ordering matches the browser far more closely.",
            },
            {
              runtime: "Bun",
              note: "JavaScriptCore instead of V8; microtask semantics are spec-identical, but timer resolution and task batching differ measurably.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "async-era",
    label: "Async Era",
    years: "2017 – 2019",
    spec: "ES2017+",
    summary:
      "`async`/`await` made the microtask queue an everyday concern. Asynchronous code finally reads top-to-bottom while still yielding to the loop at each await.",
    concepts: [
      {
        id: "async-await",
        name: "async / await",
        blurb:
          "An async function returns a promise and suspends at every `await`, popping its frame off the call stack and resuming later as a microtask. Run this in the visualizer to watch the frame leave and come back.",
        code: `async function fetchStep(label) {
  console.log("enter", label);
  await null;             // suspends here, resumes as a microtask
  console.log("resume", label);
  return label;
}

async function main() {
  const a = await fetchStep("A");
  const b = await fetchStep("B");
  console.log("done:", a, b);
}

main();
console.log("this line runs before any resume");`,
      },
      {
        id: "loop-maturity",
        name: "Event loop ordering",
        blurb:
          "Microtasks drain completely before the next macrotask. A promise chain scheduled inside a timer still finishes before the following timer fires.",
        code: `setTimeout(() => {
  console.log("timer 1");
  Promise.resolve().then(() => console.log("  micro inside timer 1"));
}, 0);

setTimeout(() => console.log("timer 2"), 0);

Promise.resolve().then(() => console.log("micro before any timer"));
console.log("sync");`,
        ecosystem: {
          title: "Where the loop actually lives",
          rows: [
            {
              runtime: "V8",
              note: "Ships no event loop at all. It exposes a microtask queue and expects the embedder to pump it.",
            },
            {
              runtime: "Node.js",
              note: "libuv phases: timers → pending → poll → check (`setImmediate`) → close. `setImmediate` fires after I/O, `setTimeout(fn, 0)` before it.",
            },
            {
              runtime: "Deno",
              note: "Rust + Tokio. No `setImmediate` in the native API surface (only via the Node compatibility layer); web timers are the primitive.",
            },
            {
              runtime: "Bun",
              note: "Custom loop on JavaScriptCore. Implements Node's `setImmediate` for compatibility; timer latency is generally lower under load.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "modules",
    label: "Module Era",
    years: "2015 – 2020",
    spec: "ESM + npm",
    summary:
      "Specified in 2015, shipped in runtimes years later. The language finally got a static module format — and the ecosystem got a decade-long CommonJS interop problem.",
    concepts: [
      {
        id: "esm",
        name: "ES Modules",
        blurb:
          "`import`/`export` are static: bindings are resolved before evaluation, which is what makes tree-shaking and cycle handling possible. Imports are live bindings, not copies.",
        code: `// counter.js
export let hits = 0;
export function hit() { hits++; }

// main.js
import { hits, hit } from "./counter.js";
hit();
console.log(hits); // 1 — a live binding, not a snapshot`,
      },
      {
        id: "resolution",
        name: "Module resolution",
        blurb:
          "The specifier `\"lodash\"` means nothing to the language. Every runtime layers its own resolution algorithm on top — the single biggest source of ecosystem divergence.",
        code: `// The same import, resolved four different ways:
import { readFile } from "node:fs/promises";
import chalk from "chalk";
import local from "./util.js";`,
        ecosystem: {
          title: "How each runtime resolves a specifier",
          rows: [
            {
              runtime: "V8",
              note: "Provides a resolution *hook* only. The embedder answers 'what does this specifier mean'.",
            },
            {
              runtime: "Node.js",
              note: "node_modules walk + `exports`/`imports` maps in package.json. File extensions are mandatory in ESM; `node:` prefix for builtins.",
            },
            {
              runtime: "Deno",
              note: "URL-first: remote https imports, import maps, and JSR. npm packages via the `npm:` specifier, cached rather than installed into a folder.",
            },
            {
              runtime: "Bun",
              note: "Node-compatible resolution with extension guessing, plus native TypeScript and JSX loading with no build step.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "modern",
    label: "Modern JS",
    years: "2020 – today",
    spec: "ES2020+",
    summary:
      "Yearly, incremental releases. Small operators that erase enormous amounts of defensive boilerplate, plus top-level await for module-scope asynchrony.",
    concepts: [
      {
        id: "optional-chaining",
        name: "Optional chaining & nullish coalescing",
        blurb:
          "`?.` short-circuits on null/undefined only, and `??` falls back on null/undefined only — unlike `||`, which also swallows 0 and \"\".",
        code: `const config = { retries: 0, server: { host: "localhost" } };

console.log(config.server?.port?.toFixed?.(0)); // undefined, no throw
console.log(config.retries || 3);               // 3  — wrong, 0 is valid
console.log(config.retries ?? 3);               // 0  — correct
console.log(config.missing?.deeply?.nested ?? "fallback");`,
      },
      {
        id: "tla",
        name: "Top-level await",
        blurb:
          "A module can await at its top level. Importers of that module wait for it — the module graph itself becomes asynchronous.",
        code: `const started = Date.now();
await new Promise((resolve) => setTimeout(resolve, 50));
console.log("module body resumed after", Date.now() - started, "ms");
console.log("importers of this module waited for it");`,
        ecosystem: {
          title: "Top-level await support",
          rows: [
            { runtime: "V8", note: "Implemented at the engine level since V8 8.9; requires the host to use the async module evaluation API." },
            { runtime: "Node.js", note: "Works in `.mjs` / `\"type\": \"module\"` files. Unavailable in CommonJS — a common migration blocker." },
            { runtime: "Deno", note: "Available everywhere, including the REPL, since all modules are ESM by default." },
            { runtime: "Bun", note: "Supported in both ESM and its CommonJS interop layer, which transparently wraps CJS files." },
          ],
        },
      },
    ],
  },
  {
    id: "runtimes",
    label: "Runtimes",
    years: "2009 – today",
    spec: "Node / Deno / Bun / edge",
    summary:
      "JavaScript is no longer one host. The language spec is shared; the I/O, permissions, and module story are not — and that is where the real differences live.",
    concepts: [
      {
        id: "runtime-shape",
        name: "Engine vs runtime",
        blurb:
          "An engine parses and executes JavaScript. A runtime adds everything the spec deliberately leaves out: timers, I/O, networking, module loading, a process model.",
        code: `// Nothing here is in the ECMAScript specification:
setTimeout(() => {}, 0);   // host-provided timer
console.log("hi");         // host-provided console
// fetch, fs, process, Deno.*, Bun.* — all host APIs, not language features.

// This is the language:
console.log(typeof Promise, typeof Symbol.asyncIterator, typeof globalThis);`,
        ecosystem: {
          title: "The four hosts side by side",
          rows: [
            { runtime: "V8", note: "Engine only: parser, Ignition interpreter, TurboFan/Maglev JITs, garbage collector. Embedded by Chrome, Node, Deno, Workers." },
            { runtime: "Node.js", note: "V8 + libuv. CommonJS-first history, unrestricted filesystem and network access, the npm registry as its centre of gravity." },
            { runtime: "Deno", note: "V8 + Tokio. Secure by default — filesystem, network, and env access each need an explicit permission flag. Web APIs first." },
            { runtime: "Bun", note: "JavaScriptCore + Zig. Runtime, bundler, test runner, and package manager in one binary; optimised for startup and install speed." },
          ],
        },
      },
      {
        id: "edge",
        name: "Edge runtimes",
        blurb:
          "Workers-style runtimes run V8 isolates, not processes. No filesystem, no long-lived globals across requests, and a strictly Web-standard API surface.",
        code: `// The edge runtime contract, in one handler:
export default {
  async fetch(request) {
    const url = new URL(request.url);
    return new Response(JSON.stringify({ path: url.pathname }), {
      headers: { "content-type": "application/json" },
    });
  },
};
// No fs. No process. Request/Response/URL/fetch — Web APIs only.`,
      },
    ],
  },
];

export const REPL_EXAMPLES: { id: string; label: string; code: string }[] = [
  {
    id: "ordering",
    label: "sync vs micro vs macro",
    code: `console.log("1: sync");

setTimeout(() => console.log("4: macrotask"), 0);

Promise.resolve().then(() => console.log("3: microtask"));

console.log("2: sync");`,
  },
  {
    id: "await",
    label: "await suspension",
    code: `async function work(label) {
  console.log("enter", label);
  await null;
  console.log("resume", label);
}

async function main() {
  await work("A");
  await work("B");
  console.log("main done");
}

main();
console.log("sync tail");`,
  },
  {
    id: "starvation",
    label: "microtask starvation",
    code: `setTimeout(() => console.log("timer finally runs"), 0);

let n = 0;
function spin() {
  if (n++ < 8) {
    Promise.resolve().then(spin);
  }
  console.log("microtask", n);
}
spin();`,
  },
  {
    id: "chain",
    label: "promise chain",
    code: `function delay(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

delay(10, "first")
  .then((v) => { console.log(v); return delay(10, "second"); })
  .then((v) => { console.log(v); throw new Error("boom"); })
  .catch((err) => console.log("caught:", err.message));`,
  },
  {
    id: "combinators",
    label: "promise combinators",
    code: `const ok = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));
const bad = (v, ms) => new Promise((_, r) => setTimeout(() => r(new Error(v)), ms));

Promise.all([ok("a", 10), ok("b", 20)]).then((v) => console.log("all:", v));
Promise.race([ok("slow", 30), bad("fast", 5)]).catch((e) => console.log("race rejected:", e.message));
Promise.allSettled([ok("x", 5), bad("y", 5)]).then((v) => console.log("allSettled:", v.map((r) => r.status)));
Promise.any([bad("p", 5), ok("q", 15)]).then((v) => console.log("any:", v));
Promise.any([bad("only", 5)]).catch((e) => console.log("any rejected:", e.constructor.name, e.errors.length));`,
  },
  {
    id: "fetch",
    label: "fetch (mocked)",
    code: `// fetch is mocked in this sandbox — no network access.
// The "network" wait is a real macrotask; the resolution is a real microtask.
async function load() {
  console.log("before fetch");
  const res = await fetch("/api/items");
  console.log("status", res.status);
  const json = await res.json();
  console.log("body", json);
}

load();
console.log("sync tail");`,
  },
  {
    id: "throwing-chain",
    label: "throwing chain",
    code: `Promise.resolve("start")
  .then((v) => { console.log("first", v); throw new Error("boom"); })
  .then(() => console.log("skipped — rejected chains bypass onFulfilled"))
  .catch((err) => console.log("caught:", err.message));`,
  },
  {
    id: "nested-reactions",
    label: "nested reactions",
    code: `Promise.resolve(1).then((v) => {
  console.log("outer", v);
  // a *nested* promise created inside the reaction and returned:
  // adopting it costs extra microtask ticks before the next .then runs
  return Promise.resolve(v + 1).then((inner) => {
    console.log("inner", inner);
    return inner * 10;
  });
}).then((v) => console.log("after adoption", v));

Promise.resolve().then(() => console.log("tick A"));
Promise.resolve().then(() => console.log("tick B"));`,
  },
  {
    id: "await-reject",
    label: "await + try/catch",
    code: `async function main() {
  try {
    await Promise.reject(new Error("rejected inside await"));
    console.log("unreachable");
  } catch (err) {
    console.log("caught:", err.message);
  } finally {
    console.log("finally runs after resume");
  }
}

main();
console.log("sync tail");`,
  },
  {
    id: "errors",
    label: "error handling",
    code: `function risky(flag) {
  if (flag) throw new Error("boom at level 1");
  return "ok";
}

try {
  console.log(risky(true));
} catch (err) {
  console.log("caught:", err.message);
}

// Unhandled: surfaces as an error event in the console.
throw new Error("uncaught — reported by the sandbox");`,
  },
  {
    id: "recursion",
    label: "recursion & stack",
    code: `let depth = 0;
let peak = 0;

function fib(n) {
  depth++;
  peak = Math.max(peak, depth);
  const result = n < 2 ? n : fib(n - 1) + fib(n - 2);
  depth--;
  return result;
}

console.log("fib(10) =", fib(10));
console.log("peak recursion depth:", peak);
// Step through the trace to watch the call stack grow and unwind.`,
  },
  {
    id: "async-iter",
    label: "async iteration",
    code: `async function* ticks(count) {
  for (let i = 1; i <= count; i++) {
    await null; // suspends — resumes as a microtask
    yield i;
  }
}

for await (const tick of ticks(3)) {
  console.log("tick", tick);
}
console.log("done iterating");`,
  },
  {
    id: "intervals",
    label: "setInterval tasks",
    code: `let n = 0;
const handle = setInterval(() => {
  console.log("interval tick", ++n);
  if (n === 3) clearInterval(handle);
}, 50);
console.log("interval scheduled — watch the macrotask queue");`,
  },
];

