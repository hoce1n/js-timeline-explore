import { useCallback, useEffect, useRef, useState } from "react";
import { SANDBOX_HTML, type SandboxEvent } from "@/lib/sandbox";
import { instrument } from "@/lib/instrument";

const MAX_EVENTS = 4000;
const RUN_TIMEOUT_MS = 6000;

export type SandboxStatus = "booting" | "idle" | "running" | "done" | "timeout";

export function useSandbox() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const runIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferRef = useRef<SandboxEvent[]>([]);
  const flushHandle = useRef<number | null>(null);
  const truncatedRef = useRef(false);
  const [status, setStatus] = useState<SandboxStatus>("booting");
  const [trace, setTrace] = useState<SandboxEvent[]>([]);

  const mount = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("title", "JavaScript sandbox");
    iframe.style.display = "none";
    iframe.srcdoc = SANDBOX_HTML;
    host.appendChild(iframe);
    frameRef.current = iframe;
  }, []);

  useEffect(() => {
    const flush = () => {
      flushHandle.current = null;
      const batch = bufferRef.current;
      if (batch.length === 0) return;
      bufferRef.current = [];
      setTrace((prev) => {
        const next = prev.slice();
        for (const event of batch) {
          if (next.length < MAX_EVENTS) {
            next.push(event);
            continue;
          }
          // past the cap: only terminal events still matter, otherwise heavy code
          // (deep recursion, tight loops) would silently hang the UI.
          if (event.type !== "error" && event.type !== "complete") continue;
          if (!truncatedRef.current) {
            truncatedRef.current = true;
            next.push({
              seq: event.seq,
              t: event.t,
              type: "error",
              text: `Trace truncated at ${MAX_EVENTS} instrumented events.`,
            });
          }
          next.push(event);
        }
        return next;
      });
    };

    const onMessage = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || data.__jsSandbox !== true) return;
      if (data.ready) {
        setStatus("idle");
        return;
      }
      if (data.runId !== runIdRef.current) return;
      const event = data.event as SandboxEvent;
      // Buffer events and flush once per frame — rendering every message
      // individually is what makes floods of events freeze the tab.
      bufferRef.current.push(event);
      if (flushHandle.current === null) {
        flushHandle.current = requestAnimationFrame(flush);
      }
      if (event.type === "complete") {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (flushHandle.current !== null) cancelAnimationFrame(flushHandle.current);
        flush();
        setStatus("done");
      }
    };
    window.addEventListener("message", onMessage);
    mount();
    return () => {
      window.removeEventListener("message", onMessage);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (flushHandle.current !== null) cancelAnimationFrame(flushHandle.current);
    };
  }, [mount]);


  const run = useCallback((source: string) => {
    const result = instrument(source);
    runIdRef.current += 1;
    bufferRef.current = [];
    truncatedRef.current = false;
    if (!result.ok) {
      setTrace([
        {
          seq: 0,
          t: 0,
          type: "error",
          text: `Uncaught SyntaxError: ${result.error}`,
        },
      ]);
      setStatus("done");
      return;
    }
    setTrace([]);
    setStatus("running");
    frameRef.current?.contentWindow?.postMessage(
      { __jsSandboxRun: true, runId: runIdRef.current, code: result.code },
      "*",
    );
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStatus("timeout");
      setTrace((prev) => [
        ...prev,
        {
          seq: prev.length,
          t: RUN_TIMEOUT_MS,
          type: "error",
          text: `Execution terminated after ${RUN_TIMEOUT_MS}ms — possible infinite loop. Sandbox restarted.`,
        },
      ]);
      runIdRef.current += 1;
      setStatus("booting");
      mount();
    }, RUN_TIMEOUT_MS);
  }, [mount]);

  const reset = useCallback(() => {
    setTrace([]);
    if (status !== "booting") setStatus("idle");
  }, [status]);

  return { hostRef, status, trace, run, reset };
}
