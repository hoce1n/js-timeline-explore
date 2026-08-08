import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/share";

/** Small copy-to-clipboard button with a transient "copied" state. */
export function CopyButton({
  text,
  label = "Copy code",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const copy = async () => {
    await copyText(text);
    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      title={copied ? "Copied to clipboard" : label}
      aria-label={copied ? "Copied to clipboard" : label}
      className={`inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary ${className ?? ""}`}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "copied" : "copy"}
    </button>
  );
}
