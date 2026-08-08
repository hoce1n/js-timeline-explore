export type PatternCategory =
  | "event-loop"
  | "closures"
  | "this-binding"
  | "promises"
  | "coercion"
  | "builtins";

export type PatternDifficulty = "easy" | "medium" | "hard";

export type InterviewPattern = {
  id: string;
  category: PatternCategory;
  difficulty: PatternDifficulty;
  title: string;
  question: string;
  answer: string;
  code: string;
};

export const CATEGORY_ORDER: PatternCategory[] = [
  "event-loop",
  "closures",
  "this-binding",
  "promises",
  "coercion",
  "builtins",
];

export const CATEGORY_LABEL: Record<PatternCategory, string> = {
  "event-loop": "Event loop",
  closures: "Closures & scope",
  "this-binding": "this binding",
  promises: "Promises & async",
  coercion: "Coercion & equality",
  builtins: "Built-in traps",
};

export const INTERVIEW_PATTERNS: InterviewPattern[] = [
  {
    id: "var-vs-let-loop",
    category: "closures",
    difficulty: "medium",
    title: "Closures in loops: var vs let",
    question: "Why do all callbacks see the same `i` with `var`, but different ones with `let`?",
    answer:
      "`var` hoists ONE binding for the whole function scope, so every `setTimeout` callback closes over the same slot and reads the final value (3). `let` is block-scoped and creates a fresh binding per iteration, so each callback captures its own value (0, 1, 2).",
    code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var i =", i), 0);
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let j =", j), 0);
}`,
  },
  {
    id: "iife-fix",
    category: "closures",
    difficulty: "medium",
    title: "The classic IIFE capture fix",
    question: "How did pre-`let` code capture a loop value per iteration?",
    answer:
      "An IIFE creates a fresh function scope per iteration, so `n` is a new binding each time. `var` still points at one shared variable — the IIFE argument is what fixes the capture.",
    code: `const fns = [];
for (var i = 0; i < 3; i++) {
  (function (n) {
    fns.push(() => console.log("captured:", n));
  })(i);
}
fns.forEach((fn) => fn());`,
  },
  {
    id: "lost-this",
    category: "this-binding",
    difficulty: "easy",
    title: "Detaching a method loses `this`",
    question: "Why does `user.greet` called on its own lose the object?",
    answer:
      "`this` is bound at CALL time, not definition time. Calling `user.greet()` sets `this` to `user`; calling the detached `greet()` sets it to the global object (sloppy mode), so `this.name` is `undefined`.",
    code: `const user = {
  name: "Ada",
  greet() {
    return "hi " + this.name;
  },
};
const detached = user.greet;

console.log("as method:", user.greet());
console.log("detached:", detached());`,
  },
  {
    id: "this-timers",
    category: "this-binding",
    difficulty: "medium",
    title: "`this` inside a timer callback",
    question: "Why does a plain function lose `this` inside `setTimeout`, while an arrow keeps it?",
    answer:
      "`setTimeout` calls its callback as a plain function, so a classic `function` gets a rebound `this` (the global object in sloppy mode → `this.value` is `undefined`). An arrow function has no own `this` and closes over the enclosing method's.",
    code: `const obj = {
  value: 42,
  classic() {
    setTimeout(function () {
      console.log("classic this.value:", this.value);
    }, 0);
  },
  arrow() {
    setTimeout(() => console.log("arrow this.value:", this.value), 0);
  },
};

obj.classic();
obj.arrow();`,
  },
  {
    id: "event-loop-order",
    category: "event-loop",
    difficulty: "easy",
    title: "sync → microtask → macrotask",
    question: "What order does this log?",
    answer:
      "Synchronous code runs to completion first (1, 4), then the microtask queue drains (3), and only then a macrotask timer fires (2). A `setTimeout(…, 0)` is never zero — it runs after the whole current task and its microtasks.",
    code: `console.log("1 sync");
setTimeout(() => console.log("2 macrotask"), 0);
Promise.resolve().then(() => console.log("3 microtask"));
console.log("4 sync");`,
  },
  {
    id: "async-await-order",
    category: "event-loop",
    difficulty: "hard",
    title: "await resumes before a queued .then",
    question: "Why does `c` (after await) beat `d` (.then) even though `.then` was called first?",
    answer:
      "`await` queues its resumption as a microtask the moment it executes — BEFORE the later `Promise.resolve().then(...)` call queues `d`. The queue is FIFO, so the await resumption (c) runs first. Order: b, a, c, d.",
    code: `async function f() {
  console.log("b inside async fn");
  await null;
  console.log("c after await");
}
f();
Promise.resolve().then(() => console.log("d .then microtask"));
console.log("a sync tail");`,
  },
  {
    id: "executor-sync",
    category: "promises",
    difficulty: "easy",
    title: "The Promise executor runs synchronously",
    question: "When does the code inside `new Promise(...)` run?",
    answer:
      "The executor runs immediately, during the `new Promise` call — only `.then`/`.catch` callbacks are deferred to the microtask queue. So the order is: 1, 2 (executor), 3, then 4 (reaction).",
    code: `console.log("1 start");
const p = new Promise((resolve) => {
  console.log("2 executor — runs synchronously");
  resolve("done");
});
p.then((v) => console.log("4 then:", v));
console.log("3 end");`,
  },
  {
    id: "promise-all-fails-fast",
    category: "promises",
    difficulty: "medium",
    title: "Promise.all rejects on the first failure",
    question: "Why does Promise.all reject before the slow promise settles?",
    answer:
      "`Promise.all` settles as soon as its first input rejects — it does not wait for the rest. The other promises keep running, but their results are discarded. Handler here: \"all rejected on: fast fail\".",
    code: `const slow = new Promise((r) =>
  setTimeout(() => r("slow ok"), 80),
);
const fast = new Promise((_, rej) =>
  setTimeout(() => rej(new Error("fast fail")), 10),
);

Promise.all([slow, fast])
  .then((v) => console.log("all resolved:", v))
  .catch((e) => console.log("all rejected on:", e.message));`,
  },
  {
    id: "map-parseint",
    category: "builtins",
    difficulty: "hard",
    title: "map(parseInt) doesn't parse numbers",
    question: "What does `[\"1\", \"2\", \"3\"].map(parseInt)` return?",
    answer:
      "`map` passes (element, index, array), so `parseInt` receives the INDEX as its radix argument: `parseInt(\"1\", 0)` → 1, `parseInt(\"2\", 1)` → NaN, `parseInt(\"3\", 2)` → NaN. Result: `[1, NaN, NaN]`.",
    code: `const result = ["1", "2", "3"].map(parseInt);
console.log("result:", result);

// map passes (element, index) — parseInt reads the index as radix:
console.log("parseInt('1', 0):", parseInt("1", 0));
console.log("parseInt('2', 1):", parseInt("2", 1));
console.log("parseInt('3', 2):", parseInt("3", 2));`,
  },
  {
    id: "loose-equality",
    category: "coercion",
    difficulty: "hard",
    title: "The six falsy loose-equality traps",
    question: "Why is `[] == ![]` true?",
    answer:
      "Loose `==` coerces operands. `![]` is `false`, and `[] == false` coerces both to numbers: `[] → 0`, `false → 0`. Each line below follows the same coercion path. `null == undefined` is the only special-case exception to number coercion.",
    code: `console.log("[] == ![]:", [] == ![]);          // true
console.log("[] == 0:", [] == 0);            // true
console.log("'' == 0:", "" == 0);            // true
console.log("'1' == 1:", "1" == 1);          // true
console.log("null == undefined:", null == undefined);    // true
console.log("null === undefined:", null === undefined);  // false`,
  },
  {
    id: "nan-is-nan",
    category: "coercion",
    difficulty: "medium",
    title: "NaN is never equal to itself",
    question: "Why does `NaN === NaN` return false, and how do you test for it?",
    answer:
      "`NaN` compares unequal to everything, including itself. `Object.is` is the identity predicate that treats NaN as equal to NaN. And `isNaN` coerces strings first, while `Number.isNaN` checks the actual value.",
    code: `console.log("NaN === NaN:", NaN === NaN);                    // false
console.log("Object.is(NaN, NaN):", Object.is(NaN, NaN)); // true
console.log("isNaN('abc'):", isNaN("abc"));                // true  — coerces
console.log("Number.isNaN('abc'):", Number.isNaN("abc"));  // false — no coercion`,
  },
  {
    id: "sort-default",
    category: "builtins",
    difficulty: "easy",
    title: "Array#sort defaults to string sort",
    question: "Why does `[10, 9, 100].sort()` return `[10, 100, 9]`?",
    answer:
      "Without a comparator, `sort` converts every element to a string and sorts lexicographically — so `\"100\" < \"9\"`. Pass `(a, b) => a - b` for numeric order.",
    code: `const nums = [10, 9, 100, 2];
console.log("default sort:", nums.sort());
console.log("numeric sort:", [10, 9, 100, 2].sort((a, b) => a - b));`,
  },
  {
    id: "typeof-null",
    category: "builtins",
    difficulty: "easy",
    title: "typeof null is 'object'",
    question: "Why is `typeof null` 'object', and how do you really detect null?",
    answer:
      "A bug from the first JS implementation that was kept for compatibility. `typeof null === \"object\"` is simply wrong. Check null explicitly with `x === null`, and arrays with `Array.isArray`, not `typeof`.",
    code: `console.log("typeof null:", typeof null);              // "object" — historic bug
console.log("typeof []:", typeof []);                  // "object"
console.log("Array.isArray([]):", Array.isArray([]));  // true
console.log("[] instanceof Array:", [] instanceof Array); // true
console.log("null === null:", null === null);`,
  },
  {
    id: "hoisting-function",
    category: "closures",
    difficulty: "medium",
    title: "Function declarations vs var hoisting",
    question: "Why is `foo` callable before its line, but `bar` is undefined?",
    answer:
      "A function declaration is hoisted whole — name AND body. `var bar = …` hoists only the `var bar` binding (initialized to `undefined`); the function value is assigned later, so calling `bar()` before the assignment throws.",
    code: `console.log("typeof foo:", typeof foo); // "function"
foo();
function foo() {
  console.log("foo() ran");
}

console.log("typeof bar:", typeof bar); // "undefined"
var bar = function () {
  console.log("bar() ran");
};`,
  },
  {
    id: "shallow-spread",
    category: "builtins",
    difficulty: "medium",
    title: "Object spread is only shallow",
    question: "Why does changing `copy.nested.b` also change `original`?",
    answer:
      "`{ ...original }` copies top-level properties by reference. The nested object is shared, so mutating through either reference is visible in both. Only the top level is independent — use structuredClone for a deep copy.",
    code: `const original = { a: 1, nested: { b: 2 } };
const copy = { ...original };

copy.a = 100;             // top level: independent
copy.nested.b = 99;       // nested object: shared reference

console.log("original.a:", original.a);       // 1
console.log("original.nested.b:", original.nested.b); // 99 — shared!`,
  },
];
