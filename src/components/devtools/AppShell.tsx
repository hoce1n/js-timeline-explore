import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { Github, Instagram, Linkedin, Moon, Send, Sun } from "lucide-react";
import { SiteSearch } from "./SiteSearch";
import { useTheme } from "@/components/theme-provider";

export type Tab = "timeline" | "loop" | "console";

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/hoce1n", Icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/hocein/", Icon: Linkedin },
  { label: "Instagram", href: "https://www.instagram.com/hoce1n/", Icon: Instagram },
  { label: "Telegram", href: "https://t.me/hoce1n", Icon: Send },
];

export const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "timeline", label: "Sources", hint: "eras & concepts" },
  { id: "loop", label: "Performance", hint: "event loop" },
  { id: "console", label: "Console", hint: "live REPL" },
];

function useTablistKeyboard(tab: Tab, onTabChange: (tab: Tab) => void) {
  const navRef = useRef<HTMLElement | null>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") {
      return;
    }
    const buttons = Array.from(
      navRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
    const current = buttons.findIndex((b) => b.dataset["tab"] === tab);
    if (current === -1 || buttons.length === 0) return;
    e.preventDefault();
    let next: number;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = buttons.length - 1;
    else if (e.key === "ArrowRight") next = (current + 1) % buttons.length;
    else next = (current - 1 + buttons.length) % buttons.length;
    const target = buttons[next];
    target?.focus();
    const id = target?.dataset["tab"] as Tab | undefined;
    if (id) onTabChange(id);
  };

  return { navRef, onKeyDown };
}

export function AppShell({
  tab,
  onTabChange,
  children,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  children: ReactNode;
}) {
  const { navRef, onKeyDown } = useTablistKeyboard(tab, onTabChange);
  const { theme, toggleTheme } = useTheme();
  const activeId = `tab-${tab}`;
  const panelId = "panel-main";
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-panel">
        <div className="mx-auto flex max-w-350 flex-wrap items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-6 place-items-center rounded-[3px] bg-primary text-[11px] font-bold text-primary-foreground">
              JS
            </span>
            <h1 className="text-sm font-bold tracking-tight">
              runtime<span className="text-muted-foreground">.js</span>
            </h1>
          </div>
          <p className="hidden text-[11.5px] text-muted-foreground sm:block">
            the language, its eras, and the loop that runs it
          </p>
          <SiteSearch />
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${nextTheme} mode`}
            title={`Switch to ${nextTheme} mode`}
            className="grid size-7 shrink-0 place-items-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>
          <p className="ml-auto hidden text-[11px] text-muted-foreground sm:block">
            executes in a sandboxed iframe · never <code className="text-destructive">eval</code>{" "}
            on this page
          </p>
        </div>

        <nav
          ref={navRef}
          onKeyDown={onKeyDown}
          className="mx-auto flex max-w-350 items-end gap-px overflow-x-auto px-4"
          role="tablist"
          aria-label="Panels"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                data-tab={t.id}
                onClick={() => onTabChange(t.id)}
                role="tab"
                aria-selected={active}
                aria-controls={panelId}
                tabIndex={active ? 0 : -1}
                className={`group relative -mb-px shrink-0 whitespace-nowrap border border-b-0 px-3 py-2 text-xs transition-colors sm:px-3.5 ${
                  active
                    ? "border-border bg-background text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={active ? "text-primary" : ""}>{t.label}</span>
                <span className="ml-2 hidden text-[10.5px] text-muted-foreground sm:inline">
                  {t.hint}
                </span>
                {active && <span className="absolute inset-x-0 top-0 h-px bg-primary" />}
              </button>
            );
          })}
        </nav>
      </header>

      <main
        id={panelId}
        role="tabpanel"
        aria-labelledby={activeId}
        tabIndex={0}
        className="mx-auto max-w-350 px-4 py-6"
      >
        {children}
      </main>

      <footer className="mt-8 border-t border-border bg-panel">
        <div className="mx-auto flex max-w-350 flex-wrap items-center gap-x-2.5 gap-y-1.5 px-4 py-4 text-[11px] text-muted-foreground">
          <span>
            built by{" "}
            <a
              href="https://github.com/hoce1n"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              hocein
            </a>
          </span>
          <span aria-hidden className="text-muted-foreground/40">
            ·
          </span>
          <span className="flex items-center gap-2.5">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="text-muted-foreground/70 transition-colors hover:text-primary"
              >
                <Icon className="size-3.5" />
              </a>
            ))}
          </span>
          <span className="ml-auto hidden text-muted-foreground/50 sm:inline">
            runtime.js · an interactive tour of JavaScript
          </span>
        </div>
      </footer>
    </div>
  );
}
