/** @type {import('next').NextConfig} */

// Security headers applied to every response (portable across Netlify/Vercel/self-host).
const securityHeaders = [
  // Force HTTPS for a year on this host + subdomains.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Auto-upgrade any http:// subresource (e.g. the API) to https — kills the
  // "Not Secure" / mixed-content warning without a brittle full CSP.
  { key: "Content-Security-Policy", value: "upgrade-insecure-requests" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't leak "X-Powered-By: Next.js"
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
