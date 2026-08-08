import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CornerDownLeft, Search } from "lucide-react";
import { ERAS } from "@/lib/js-eras";
import { INTERVIEW_PATTERNS } from "@/lib/interview-patterns";

type Result =
  | {
      kind: "era";
      id: string;
      title: string;
      detail: string;
      to: "/era/$era";
      params: { era: string };
    }
  | {
      kind: "concept";
      id: string;
      title: string;
      detail: string;
      to: "/era/$era/$concept";
      params: { era: string; concept: string };
    }
  | {
      kind: "pattern";
      id: string;
      title: string;
      detail: string;
      to: "/";
      search: { tab: "timeline"; focusPattern: string };
    };

const KIND_BADGE: Record<Result["kind"], string> = {
  era: "era",
  concept: "concept",
  pattern: "pattern",
};

function buildIndex(): Result[] {
  const results: Result[] = [];
  for (const era of ERAS) {
    results.push({
      kind: "era",
      id: `era-${era.id}`,
      title: era.label,
      detail: era.summary,
      to: "/era/$era",
      params: { era: era.id },
    });
    for (const concept of era.concepts) {
      results.push({
        kind: "concept",
        id: `concept-${concept.id}`,
        title: `${concept.name}`,
        detail: concept.blurb,
        to: "/era/$era/$concept",
        params: { era: era.id, concept: concept.id },
      });
    }
  }
  for (const pattern of INTERVIEW_PATTERNS) {
    results.push({
      kind: "pattern",
      id: `pattern-${pattern.id}`,
      title: pattern.title,
      detail: pattern.question,
      to: "/",
      search: { tab: "timeline", focusPattern: pattern.id },
    });
  }
  return results;
}

function matches(query: string, ...fields: string[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return fields.some((field) => field.toLowerCase().includes(q));
}

export function SiteSearch() {
  const navigate = useNavigate();
  const index = useMemo(buildIndex, []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return index.filter((r) => matches(query, r.title, r.detail));
  }, [index, query]);

  useEffect(() => setActive(0), [query]);

  // ⌘/Ctrl+/ focuses the search input from anywhere in the app shell.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "/") return;
      e.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close the dropdown when clicking outside the widget.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const go = (result: Result) => {
    setOpen(false);
    setQuery("");
    if (result.kind === "pattern") {
      navigate({ to: result.to, search: result.search });
    } else {
      navigate({ to: result.to, params: result.params });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const result = results[active];
      if (result) go(result);
    }
  };

  const showResults = open && query.trim().length > 0;

  return (
    <div ref={wrapRef} className="relative ml-auto sm:ml-0">
      <div className="flex items-center gap-2 rounded-sm border border-border bg-background px-2 py-1 transition-colors focus-within:border-secondary">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="search eras, concepts, gotchas…"
          aria-label="Search eras, concepts and interview patterns"
          aria-expanded={showResults}
          className="w-44 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/70 focus:w-52 transition-[width] sm:w-52 sm:focus:w-64"
        />
        <kbd className="hidden shrink-0 rounded-sm border border-border px-1 text-[10px] leading-4 text-muted-foreground sm:inline">
          ⌘/
        </kbd>
      </div>

      {showResults && (
        <div className="absolute right-0 z-50 mt-1 w-72 overflow-hidden rounded-sm border border-border bg-panel shadow-lg sm:w-80">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">no matches for “{query}”</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1" role="listbox" aria-label="Search results">
              {results.map((result, i) => (
                <li key={result.id}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(result)}
                    role="option"
                    aria-selected={i === active}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${
                      i === active ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 rounded-sm border border-border px-1 py-px text-[9px] uppercase tracking-widest text-muted-foreground">
                      {KIND_BADGE[result.kind]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-foreground">
                        {result.title}
                      </span>
                      <span className="block truncate text-[10.5px] text-muted-foreground">
                        {result.detail}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="flex items-center gap-1 border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground/70">
            <CornerDownLeft className="size-3" /> to open · ↑↓ to move · esc to close
          </p>
        </div>
      )}
    </div>
  );
}
