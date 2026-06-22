/**
 * Resolve the backend API base URL, with a mixed-content safeguard: if the page
 * is served over HTTPS but the configured API URL is http:// (and not a local
 * dev host), upgrade it to https://. Prevents the browser "Not Secure" /
 * blocked-request behavior when NEXT_PUBLIC_API_URL is misconfigured.
 */
export function apiBase(): string {
  let base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    base.startsWith("http://") &&
    !/localhost|127\.0\.0\.1/.test(base)
  ) {
    base = base.replace(/^http:\/\//, "https://");
  }
  return base;
}
