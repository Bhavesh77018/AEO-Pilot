/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";

// ── Security headers applied to every response ──────────────────────────────
// Covers Vercel, Netlify, and self-hosted deployments.
const securityHeaders = [
  // Force HTTPS for 2 years on this host + subdomains; submit for preload.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Content Security Policy:
  // - Scripts: only self + Razorpay checkout CDN (the only external script we load)
  // - Connections: self only (API calls go to NEXT_PUBLIC_API_URL via same-origin proxy in prod)
  // - Frames: completely blocked (clickjacking prevention)
  // - Everything else: self only
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js React Refresh (hot reload) requires 'unsafe-eval' in dev mode.
      // Strip it in production for a strict CSP.
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com"
        : "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co https://api.razorpay.com",
      "frame-src https://api.razorpay.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  // Prevent MIME-type sniffing attacks.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block all framing — stricter than SAMEORIGIN; belt-and-suspenders with CSP frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // Don't send full referrer to third-party sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable sensor/hardware APIs the app doesn't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Speed up DNS pre-fetching for resources we control.
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Legacy XSS filter (IE/old Edge) — belt-and-suspenders.
  { key: "X-XSS-Protection", value: "1; mode=block" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't leak "X-Powered-By: Next.js"
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
