import { useEffect, useRef, useState } from "react";

export type PresencePhase = "enter" | "present" | "leave";

export type PresenceItem<T> = T & { phase: PresencePhase };

const DEFAULT_EXIT_MS = 200;

/**
 * Minimal CSS-transition presence helper for lists that change over time.
 *
 * Renders the union of the current items plus any item that just disappeared,
 * tagging each with a phase so the caller can play enter/exit animations:
 *
 *   - "enter"   — present in `items`, not seen on the previous render
 *   - "present" — seen before (stable, no animation)
 *   - "leave"   - no longer in `items`; kept mounted until its exit animation
 *                 finishes, then dropped.
 *
 * The data shown for a leaving item is its last known object, so callers can
 * keep painting the token while it fades out.
 */
export function usePresence<T extends { key: string }>(
  items: readonly T[],
  exitMs: number = DEFAULT_EXIT_MS,
): PresenceItem<T>[] {
  const [display, setDisplay] = useState<PresenceItem<T>[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setDisplay((prevDisplay) => {
      const keySet = new Set(items.map((i) => i.key));
      const prevByKey = new Map(prevDisplay.map((i) => [i.key, i]));
      const next: PresenceItem<T>[] = [];
      for (const item of items) {
        const prev = prevByKey.get(item.key);
        next.push({ ...item, phase: prev && prev.phase !== "leave" ? "present" : "enter" });
      }
      for (const prevItem of prevDisplay) {
        if (!keySet.has(prevItem.key)) next.push({ ...prevItem, phase: "leave" });
      }
      return next;
    });
  }, [items]);

  useEffect(() => {
    const timers = timersRef.current;
    for (const [key, timer] of timers) {
      const current = display.find((i) => i.key === key);
      if (!current || current.phase !== "leave") {
        clearTimeout(timer);
        timers.delete(key);
      }
    }
    for (const item of display) {
      if (item.phase !== "leave" || timers.has(item.key)) continue;
      timers.set(
        item.key,
        setTimeout(() => {
          timers.delete(item.key);
          setDisplay((d) => d.filter((x) => x.key !== item.key));
        }, exitMs),
      );
    }
  }, [display, exitMs]);

  useEffect(
    () => () => {
      for (const timer of timersRef.current.values()) clearTimeout(timer);
      timersRef.current.clear();
    },
    [],
  );

  return display;
}
