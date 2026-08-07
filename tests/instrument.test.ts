import { describe, expect, test } from "bun:test";
import { instrument } from "../src/lib/instrument";

describe("instrument", () => {
  test("marks statement lines with __rt.line", () => {
    const r = instrument("console.log('hi');");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.code).toContain("__rt.line(1);");
  });

  test("returns ok:false with a line number for syntax errors", () => {
    const r = instrument("function (");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(typeof r.error).toBe("string");
      expect(r.line).toBeDefined();
    }
  });

  test("instruments function declarations with enter/exit but skips their statement line", () => {
    const r = instrument("import x from 'y';\nfunction foo() {}\nfoo();");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.code).toContain('__rt.enter("foo",2);try{');
      expect(r.code).toContain("}finally{__rt.exit();}");
      expect(r.code).not.toContain("__rt.line(1)");
      expect(r.code).not.toContain("__rt.line(2)");
      expect(r.code).toContain("__rt.line(3)");
    }
  });

  test("wraps named function bodies with enter/exit", () => {
    const r = instrument("function greet() {\n  return 'hi';\n}\n");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.code).toContain('__rt.enter("greet",1);try{');
      expect(r.code).toContain("}finally{__rt.exit();}");
    }
  });

  test("names an arrow assigned to a variable from the declarator", () => {
    const r = instrument("const add = (a, b) => {\n  return a + b;\n};\n");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.code).toContain('__rt.enter("add",1);try{');
    }
  });

  test("names object shorthand methods from the property key", () => {
    const r = instrument("const o = { run() { return 1; } };\n");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.code).toContain('__rt.enter("run",1);try{');
    }
  });

  test("skips expression-bodied arrows (no block to wrap)", () => {
    const r = instrument("const add = (a, b) => a + b;\n");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.code).not.toContain("__rt.enter(");
      expect(r.code).not.toContain("__rt.exit()");
    }
  });

  test("instruments nested functions separately", () => {
    const r = instrument("function outer() {\n  function inner() { return 1; }\n  inner();\n}\n");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.code).toContain('__rt.enter("outer",1);try{');
      expect(r.code).toContain('__rt.enter("inner",2);try{');
    }
  });

  test("wraps await expressions with __rt.aw", () => {
    const r = instrument("const x = await fetch(url);\n");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.code).toContain("__rt.aw(fetch(url),1)");
    }
  });

  test("wraps every await inside a chain", () => {
    const r = instrument("await a();\nawait b();\n");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.code).toContain("__rt.aw(a(),1)");
      expect(r.code).toContain("__rt.aw(b(),2)");
    }
  });

  test("leaves multiple top-level statements instrumented in order", () => {
    const r = instrument("let x = 1;\nlet y = 2;\n");
    expect(r.ok).toBe(true);
    if (r.ok) {
      const i1 = r.code.indexOf("__rt.line(1)");
      const i2 = r.code.indexOf("__rt.line(2)");
      expect(i1).toBeGreaterThan(-1);
      expect(i2).toBeGreaterThan(i1);
    }
  });
});
