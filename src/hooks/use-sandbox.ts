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
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || data.__jsSandbox !== true) return;
      if (data.ready) {
        setStatus("idle");
        return;
      }
      if (data.runId !== runIdRef.current) return;
      const event = data.event as SandboxEvent;
      setTrace((prev) => {
        if (prev.length < MAX_EVENTS) return [...prev, event];
        // past the cap: still let terminal events (errors / completion) through,
        // otherwise heavy code (deep recursion, tight loops) silently hangs the UI.
        if (event.type !== "error" && event.type !== "complete") return prev;
        const notice: SandboxEvent = {
          seq: prev.length,
          t: event.t,
          type: "error",
          text: `Trace truncated at ${MAX_EVENTS} instrumented events.`,
        };
        const truncated = prev.some((e) => e.type === "error" && e.text?.startsWith("Trace truncated"));
        return truncated ? [...prev, event] : [...prev, notice, event];
      });
      if (event.type === "complete") {
        if (timerRef.current) clearTimeout(timerRef.current);
        setStatus("done");
      }
    };
    window.addEventListener("message", onMessage);
    mount();
    return () => {
      window.removeEventListener("message", onMessage);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mount]);

  const run = useCallback((source: string) => {
    const result = instrument(source);
    runIdRef.current += 1;
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
