/**
 * Privacy-friendly, cookie-less analytics (Plausible or Umami).
 *
 * Completely inert unless a provider is configured via public env vars, so
 * the app ships with analytics disabled by default:
 *
 *   VITE_PLAUSIBLE_DOMAIN=your-site.example.com
 *
 * or, for a self-hosted Umami:
 *
 *   VITE_UMAMI_HOST=https://analytics.example.com
 *   VITE_UMAMI_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *
 * Both providers are GDPR-friendly: no cookies, no personal data, no accounts
 * for visitors. This module only injects the provider script and forwards
 * custom events; page views are tracked automatically by the provider script.
 */

type Provider = "plausible" | "umami";

function provider(): Provider | null {
  if (typeof import.meta.env === "undefined") return null;
  if (import.meta.env["VITE_PLAUSIBLE_DOMAIN"]) return "plausible";
  if (import.meta.env["VITE_UMAMI_HOST"] && import.meta.env["VITE_UMAMI_WEBSITE_ID"]) return "umami";
  return null;
}

let injected = false;

/** True when a provider is configured and events should be reported. */
export function isAnalyticsEnabled(): boolean {
  return provider() !== null;
}

/** Inject the provider script once. Safe to call from any client effect. */
export function initAnalytics(): void {
  if (injected || typeof window === "undefined" || document.getElementById("runtime-analytics")) return;
  const cfg = provider();
  if (!cfg) return;
  injected = true;
  const script = document.createElement("script");
  script.id = "runtime-analytics";
  script.async = true;
  script.defer = true;
  if (cfg === "plausible") {
    script.dataset["domain"] = import.meta.env["VITE_PLAUSIBLE_DOMAIN"];
    script.src = "https://plausible.io/js/script.js";
  } else {
    script.dataset["websiteId"] = import.meta.env["VITE_UMAMI_WEBSITE_ID"];
    script.src = `${import.meta.env["VITE_UMAMI_HOST"]}/script.js`;
  }
  document.head.appendChild(script);
}

type TrackProps = Record<string, string | number | boolean>;

/** Forward a custom event to the configured provider (no-op when disabled). */
export function track(event: string, props?: TrackProps): void {
  if (!isAnalyticsEnabled() || typeof window === "undefined") return;
  const cfg = provider();
  if (cfg === "plausible") {
    const w = window as unknown as {
      plausible?: (event: string, opts?: { props?: TrackProps }) => void;
    };
    if (typeof w.plausible === "function") w.plausible(event, props ? { props } : undefined);
  } else if (cfg === "umami") {
    const w = window as unknown as {
      umami?: { track: (event: string, opts?: { props?: TrackProps }) => void };
    };
    if (w.umami && typeof w.umami.track === "function") {
      w.umami.track(event, props ? { props } : undefined);
    }
  }
}
