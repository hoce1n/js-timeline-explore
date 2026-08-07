import { describe, expect, test } from "bun:test";
import { decodeCode, encodeCode, readCodeFromHash } from "../src/lib/share";

describe("share encoding", () => {
  test("round-trips plain ASCII", () => {
    const code = "console.log('hi');";
    expect(decodeCode(encodeCode(code))).toBe(code);
  });

  test("round-trips UTF-8 (non-ASCII) source", () => {
    const code = "const s = \"héllo 世界 → done\";\n";
    expect(decodeCode(encodeCode(code))).toBe(code);
  });

  test("round-trips source containing code-like punctuation", () => {
    const code = "const a = b => b ?? 0; // x@#$%^&*()";
    expect(decodeCode(encodeCode(code))).toBe(code);
  });

  test("encodeCode is deterministic", () => {
    expect(encodeCode("a")).toBe(encodeCode("a"));
  });

  test("decodeCode returns null for malformed payloads", () => {
    expect(decodeCode("!!!not-base64!!!")).toBeNull();
  });

  test("decodeCode of an empty payload yields an empty string", () => {
    expect(decodeCode("")).toBe("");
  });
});

describe("readCodeFromHash", () => {
  test("parses a code hash", () => {
    const code = "await fetch(url);";
    expect(readCodeFromHash(`#code=${encodeCode(code)}`)).toBe(code);
  });

  test("returns null for unrelated hashes", () => {
    expect(readCodeFromHash("#section=loop")).toBeNull();
    expect(readCodeFromHash("")).toBeNull();
  });
});
