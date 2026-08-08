export const SITE_ORIGIN = "https://js-timeline-explore.lovable.app";
export const SITE_TITLE = "runtime.js — an interactive tour of JavaScript itself";
export const SITE_DESCRIPTION =
  "A DevTools-styled walk through JavaScript's eras, with a real sandboxed REPL and an event loop visualizer driven by actual instrumentation of your code.";

export function siteTitle(extra?: string): string {
  return extra ? `${extra} — runtime.js` : SITE_TITLE;
}
