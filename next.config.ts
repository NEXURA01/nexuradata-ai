import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const isProduction = process.env.NODE_ENV === "production";

const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  !isProduction ? "'unsafe-eval'" : "",
  "https://js.stripe.com",
  "https://vercel.live",
  "https://www.googletagmanager.com",
].filter(Boolean).join(" ");

const connectSources = [
  "'self'",
  "https://api.stripe.com",
  "https://checkout.stripe.com",
  "https://js.stripe.com",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  "https://vitals.vercel-insights.com",
  "https://www.google-analytics.com",
  "https://analytics.google.com",
  "https://region1.google-analytics.com",
].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `script-src ${scriptSources}`,
  "style-src 'self' 'unsafe-inline'",
  `connect-src ${connectSources}`,
  "frame-src https://checkout.stripe.com https://js.stripe.com",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), xr-spatial-tracking=(), autoplay=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "Origin-Agent-Cluster", value: "?1" },
];

const noIndexHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "Cache-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: noIndexHeaders,
      },
      {
        source: "/:locale(fr|en)/(portal|payment-success)",
        headers: noIndexHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.nexuradata.ca" }],
        destination: "https://nexuradata.ca/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "nexuradata-ai.vercel.app" }],
        destination: "https://nexuradata.ca/:path*",
        permanent: true,
      },
      {
        source: "/portal",
        destination: "/fr/contact",
        permanent: false,
      },
      {
        source: "/portal.html",
        destination: "/fr/contact",
        permanent: false,
      },
      {
        source: "/trust",
        destination: "/fr/services",
        permanent: true,
      },
      {
        source: "/security",
        destination: "/fr/services",
        permanent: true,
      },
      {
        source: "/web-protection",
        destination: "/fr/services",
        permanent: true,
      },
      {
        source: "/cipher",
        destination: "/fr/services",
        permanent: true,
      },
      {
        source: "/certificate",
        destination: "/fr/services",
        permanent: true,
      },
      {
        source: "/ai-certificate",
        destination: "/fr/services",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
