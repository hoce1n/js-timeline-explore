import { useEffect, useState } from "react";
import type { Highlighter } from "shiki";
import { CopyButton } from "./CopyButton";
import { useTheme } from "@/components/theme-provider";

let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then((shiki) =>
      shiki.createHighlighter({
        themes: ["one-dark-pro", "github-light"],
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
  const { theme } = useTheme();
  const shikiTheme = theme === "dark" ? "one-dark-pro" : "github-light";
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then((hl) => {
        if (cancelled) return;
        setHtml(hl.codeToHtml(code.trim(), { lang, theme: shikiTheme }));
      })
      .catch(() => setHtml(null));
    return () => {
      cancelled = true;
    };
  }, [code, lang, shikiTheme]);

  const base =
    "relative overflow-x-auto rounded-sm border border-border bg-panel p-4 text-[12.5px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:m-0";

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
      <CopyButton text={code.trim()} className="absolute right-2 top-2" />
    </div>
  );
}
