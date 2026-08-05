import { useEffect, useRef } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { EditorState, StateEffect, StateField, type Extension } from "@codemirror/state";
import { Decoration, type DecorationSet } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap, autocompletion } from "@codemirror/autocomplete";

const setActiveLine = StateEffect.define<number | null>();

const activeLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    let next = deco.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setActiveLine)) {
        const line = effect.value;
        if (!line || line < 1 || line > tr.state.doc.lines) {
          next = Decoration.none;
        } else {
          const info = tr.state.doc.line(line);
          next = Decoration.set([
            Decoration.line({ class: "cm-exec-line" }).range(info.from),
          ]);
        }
      }
    }
    return next;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const baseTheme = EditorView.theme({
  "&": { backgroundColor: "transparent", fontSize: "13px", height: "100%" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65" },
  ".cm-gutters": { backgroundColor: "transparent", border: "none", opacity: "0.55" },
  ".cm-content": { padding: "12px 0" },
  ".cm-exec-line": {
    backgroundColor: "color-mix(in oklab, var(--color-primary) 16%, transparent)",
    boxShadow: "inset 2px 0 0 0 var(--color-primary)",
  },
  "&.cm-focused": { outline: "none" },
});

type Props = {
  value: string;
  onChange?: (value: string) => void;
  activeLine?: number | null;
  readOnly?: boolean;
  minHeight?: string;
};

export default function CodeEditor({ value, onChange, activeLine, readOnly, minHeight }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current) return;
    const extensions: Extension[] = [
      lineNumbers(),
      history(),
      bracketMatching(),
      closeBrackets(),
      indentOnInput(),
      autocompletion(),
      highlightActiveLine(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      javascript({ typescript: false }),
      oneDark,
      baseTheme,
      activeLineField,
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.lineWrapping,
      EditorState.readOnly.of(Boolean(readOnly)),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChangeRef.current?.(update.state.doc.toString());
      }),
    ];
    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (view.state.doc.toString() !== value) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setActiveLine.of(activeLine ?? null) });
  }, [activeLine]);

  return <div ref={hostRef} className="h-full overflow-auto" style={{ minHeight: minHeight ?? "220px" }} />;
}
