const HASH_PREFIX = "#code=";

/** Encode code for embedding in a URL hash (UTF-8 safe base64). */
export function encodeCode(code: string): string {
  const bytes = new TextEncoder().encode(code);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Decode a URL-hash payload back into code. Returns null for malformed input. */
export function decodeCode(encoded: string): string | null {
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** Extract code from a location.hash value like `#code=<base64>`. */
export function readCodeFromHash(hash: string): string | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  return decodeCode(hash.slice(HASH_PREFIX.length));
}

/** Absolute URL that reopens the app with `code` preloaded. */
export function buildShareUrl(code: string): string {
  return `${window.location.origin}${window.location.pathname}${HASH_PREFIX}${encodeCode(code)}`;
}

/** Copy text to the clipboard with a legacy fallback for insecure contexts. */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // fall through to the legacy path
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } catch {
    // clipboard genuinely unavailable — leave a no-op.
  }
  textarea.remove();
}
