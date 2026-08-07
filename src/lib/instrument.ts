import { parse } from "acorn";
import * as walk from "acorn-walk";
import type { AnyNode, BlockStatement, Program } from "acorn";

/**
 * Rewrites user source so the sandbox runtime can report *real* execution
 * events: function entry/exit, awaited suspension points, and statement lines.
 *
 * This is a source transform, not a scripted animation — every event the
 * visualizer renders is emitted by the user's code as it actually runs.
 */

type Insertion = { pos: number; text: string; order: number };

const FUNCTION_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

type FunctionLikeNode = Extract<AnyNode, { type: "FunctionDeclaration" | "FunctionExpression" | "ArrowFunctionExpression" }>;

type AcornSyntaxError = Error & { loc?: { line?: number } };

/** Best-effort human name for a function's key expression (`foo` in `{ foo() {} }`). */
function propertyName(key: AnyNode): string | undefined {
  if (key.type === "Identifier" || key.type === "PrivateIdentifier") return key.name;
  if (key.type === "Literal") return key.value == null ? undefined : String(key.value);
  return undefined;
}

function functionName(node: FunctionLikeNode, ancestors: AnyNode[]): string {
  if (node.type !== "ArrowFunctionExpression" && node.id?.name) return node.id.name;
  const parent = ancestors[ancestors.length - 2];
  if (parent) {
    if (parent.type === "VariableDeclarator" && parent.id.type === "Identifier") {
      return parent.id.name;
    }
    if (parent.type === "Property" || parent.type === "MethodDefinition") {
      return propertyName(parent.key) ?? "anonymous";
    }
    if (parent.type === "AssignmentExpression" && parent.left.type === "Identifier") {
      return parent.left.name;
    }
  }
  return node.type === "ArrowFunctionExpression" ? "(arrow)" : "(anonymous)";
}

export type InstrumentResult =
  | { ok: true; code: string }
  | { ok: false; error: string; line?: number };

export function instrument(source: string): InstrumentResult {
  let ast: Program;
  try {
    ast = parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
    });
  } catch (err: unknown) {
    const e = err as AcornSyntaxError;
    return e.loc?.line === undefined
      ? { ok: false, error: e.message }
      : { ok: false, error: e.message, line: e.loc.line };
  }

  const edits: Insertion[] = [];
  let order = 0;
  const push = (pos: number, text: string) => edits.push({ pos, text, order: order++ });

  const markBlock = (node: Program | BlockStatement) => {
    for (const stmt of node.body) {
      if (
        stmt.type === "FunctionDeclaration" ||
        stmt.type === "ImportDeclaration" ||
        stmt.type.startsWith("Export")
      ) {
        continue;
      }
      push(stmt.start, `__rt.line(${stmt.loc?.start.line});`);
    }
  };

  function fnVisitor(node: FunctionLikeNode, _state: unknown, ancestors: AnyNode[]) {
    if (!FUNCTION_TYPES.has(node.type)) return;
    if (node.body.type !== "BlockStatement") return;
    const name = functionName(node, ancestors);
    push(node.body.start + 1, `__rt.enter(${JSON.stringify(name)},${node.loc?.start.line});try{`);
    push(node.body.end - 1, `}finally{__rt.exit();}`);
  }

  const visitors: walk.AncestorVisitors<unknown> = {
    Program: markBlock,
    BlockStatement: markBlock,
    AwaitExpression(node) {
      push(node.argument.start, "__rt.aw(");
      push(node.argument.end, `,${node.loc?.start.line})`);
    },
    FunctionDeclaration: fnVisitor,
    FunctionExpression: fnVisitor,
    ArrowFunctionExpression: fnVisitor,
  };

  walk.ancestor(ast, visitors);

  edits.sort((a, b) => b.pos - a.pos || b.order - a.order);

  let out = source;
  for (const edit of edits) {
    out = out.slice(0, edit.pos) + edit.text + out.slice(edit.pos);
  }
  return { ok: true, code: out };
}
