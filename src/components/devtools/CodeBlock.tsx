import { useEffect, useRef, useState } from "react";
import type { Highlighter } from "shiki";
import { Check, Copy } from "lucide-react";

let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then((shiki) =>
      shiki.createHighlighter({
        themes: ["one-dark-pro"],
        langs: ["javascript", "typescript", "json", "bash"],
      }),
    );
  }
  return highlighterPromise;
}

type Props = {
  code: string;
  lang?: "javascript" | "typescript" | "json" | "bash";
  className?: string;
};

/** Static snippet rendered with real Shiki tokenization (no fake colored spans). */
export function CodeBlock({ code, lang = "javascript", className }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then((hl) => {
        if (cancelled) return;
        setHtml(hl.codeToHtml(code.trim(), { lang, theme: "one-dark-pro" }));
      })
      .catch(() => setHtml(null));
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const copy = async () => {
    const text = code.trim();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        // clipboard genuinely unavailable — leave a no-op.
      }
      ta.remove();
    }
    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1500);
  };

  const base =
    "relative overflow-x-auto rounded-sm border border-border bg-panel p-4 text-[12.5px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:m-0";

  const button = (
    <button
      onClick={copy}
      title={copied ? "Copied to clipboard" : "Copy code"}
      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "copied" : "copy"}
    </button>
  );

  return (
    <div className={`${base} ${className ?? ""}`}>
      {html ? (
        // Shiki output is generated locally from static, in-repo snippets.
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="text-panel-foreground">
          <code>{code.trim()}</code>
        </pre>
      )}
      {button}
    </div>
  );
}
