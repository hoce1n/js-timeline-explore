import { parse } from "acorn";
import * as walk from "acorn-walk";

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

function functionName(node: any, ancestors: any[]): string {
  if (node.id?.name) return node.id.name;
  const parent = ancestors[ancestors.length - 2];
  if (parent) {
    if (parent.type === "VariableDeclarator" && parent.id?.name) return parent.id.name;
    if (parent.type === "Property" && parent.key) {
      return parent.key.name ?? parent.key.value ?? "anonymous";
    }
    if (parent.type === "MethodDefinition" && parent.key) {
      return parent.key.name ?? parent.key.value ?? "anonymous";
    }
    if (parent.type === "AssignmentExpression" && parent.left?.type === "Identifier") {
      return parent.left.name;
    }
  }
  return node.type === "ArrowFunctionExpression" ? "(arrow)" : "(anonymous)";
}

export type InstrumentResult =
  | { ok: true; code: string }
  | { ok: false; error: string; line?: number };

export function instrument(source: string): InstrumentResult {
  let ast: any;
  try {
    ast = parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
    });
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message ?? "SyntaxError",
      line: err?.loc?.line,
    };
  }

  const edits: Insertion[] = [];
  let order = 0;
  const push = (pos: number, text: string) => edits.push({ pos, text, order: order++ });

  const markBlock = (node: any) => {
    for (const stmt of node.body ?? []) {
      if (
        stmt.type === "FunctionDeclaration" ||
        stmt.type === "ImportDeclaration" ||
        stmt.type.startsWith("Export")
      ) {
        continue;
      }
      push(stmt.start, `__rt.line(${stmt.loc.start.line});`);
    }
  };

  walk.ancestor(ast, {
    Program: markBlock as any,
    BlockStatement: markBlock as any,
    AwaitExpression(node: any) {
      push(node.argument.start, "__rt.aw(");
      push(node.argument.end, `,${node.loc.start.line})`);
    },
    FunctionDeclaration: fnVisitor,
    FunctionExpression: fnVisitor,
    ArrowFunctionExpression: fnVisitor,
  } as any);

  function fnVisitor(node: any, _state: unknown, ancestors: any[]) {
    if (!FUNCTION_TYPES.has(node.type)) return;
    if (node.body?.type !== "BlockStatement") return;
    const name = functionName(node, ancestors);
    push(
      node.body.start + 1,
      `__rt.enter(${JSON.stringify(name)},${node.loc.start.line});try{`,
    );
    push(node.body.end - 1, `}finally{__rt.exit();}`);
  }

  edits.sort((a, b) => b.pos - a.pos || b.order - a.order);

  let out = source;
  for (const edit of edits) {
    out = out.slice(0, edit.pos) + edit.text + out.slice(edit.pos);
  }
  return { ok: true, code: out };
}
