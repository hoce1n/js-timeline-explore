import { useEffect, useState } from "react";

let highlighterPromise: Promise<any> | null = null;

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

  const base =
    "overflow-x-auto rounded-sm border border-border bg-panel p-4 text-[12.5px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:m-0";

  if (!html) {
    return (
      <pre className={`${base} ${className ?? ""} text-panel-foreground`}>
        <code>{code.trim()}</code>
      </pre>
    );
  }

  return (
    <div
      className={`${base} ${className ?? ""}`}
      // Shiki output is generated locally from static, in-repo snippets.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
