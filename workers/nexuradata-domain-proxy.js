const UPSTREAM_ORIGIN = "https://nexuradata-ai.vercel.app";
const API_UPSTREAM_ORIGIN = "https://nexuradata-ai.pages.dev";
const HTML_CACHE_CONTROL = "no-store, max-age=0, must-revalidate";
const HTML_RELEASE_VERSION = "20260512-protect";
const CONTENT_SECURITY_POLICY = "default-src 'none'; script-src 'self' https://www.googletagmanager.com https://connect.facebook.net https://challenges.cloudflare.com; script-src-elem 'self' https://www.googletagmanager.com https://connect.facebook.net https://challenges.cloudflare.com; script-src-attr 'none'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com https://*.g.doubleclick.net https://www.facebook.com; connect-src 'self' https://amddiekyhrvxnzszugxb.supabase.co https://checkout.stripe.com https://www.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://*.g.doubleclick.net https://connect.facebook.net https://www.facebook.com https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests";
const TRUST_REDIRECTS = new Map([
  ["/trust", "/ai-trust-security"],
  ["/security", "/ai-trust-security"],
  ["/web-protection", "/ai-trust-security"],
  ["/cipher", "/ai-trust-security"],
  ["/certificate", "/ai-trust-security"],
  ["/ai-certificate", "/ai-trust-security"]
]);
const HTML_REPLACEMENTS = [
  [/site\.css\?v=(?:20260503i|20260511-ai|20260512-visual|20260512-mobile|20260512-flow|20260512-command|20260512-logo|20260512-footer|20260512-footer2)(?=["'&<\s])/g, `site.css?v=${HTML_RELEASE_VERSION}`],
  [/Queue Stable/g, "Synchronization Stable"],
  [/Execution Online/g, "Infrastructure Online"]
];

function applyProtectionHeaders(headers) {
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-dns-prefetch-control", "off");
  headers.set("x-frame-options", "DENY");
  headers.set("x-permitted-cross-domain-policies", "none");
  headers.set("origin-agent-cluster", "?1");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()");
  headers.set("strict-transport-security", "max-age=31536000; includeSubDomains; preload");
  headers.set("content-security-policy", CONTENT_SECURITY_POLICY);
  headers.set("cross-origin-opener-policy", "same-origin");
  headers.set("cross-origin-resource-policy", "same-site");
}

function buildLocalRedirect(request) {
  const url = new URL(request.url);
  const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
  const targetPath = TRUST_REDIRECTS.get(normalizedPath.toLowerCase());

  if (!targetPath) {
    return null;
  }

  url.pathname = targetPath;
  url.search = "";

  const headers = new Headers({ location: url.toString() });
  applyProtectionHeaders(headers);
  headers.set("cache-control", HTML_CACHE_CONTROL);

  return new Response(null, {
    status: 301,
    headers
  });
}

function getUpstreamOrigin(url) {
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    return API_UPSTREAM_ORIGIN;
  }

  return UPSTREAM_ORIGIN;
}

function isHtmlNavigation(request) {
  const url = new URL(request.url);
  const accept = request.headers.get("accept") || "";
  const hasFileExtension = /\/[^/]+\.[a-z0-9]+$/i.test(url.pathname);

  return request.method === "GET" && (accept.includes("text/html") || !hasFileExtension);
}

function isReleaseAsset(request) {
  const url = new URL(request.url);
  return request.method === "GET" && (
    url.pathname === "/assets/css/site.css" ||
    url.pathname === "/assets/js/site.js" ||
    url.pathname === "/sitemap.xml" ||
    url.pathname === "/robots.txt" ||
    url.pathname === "/.well-known/security.txt"
  );
}

function buildUpstreamRequest(request) {
  const incomingUrl = new URL(request.url);
  const upstreamOrigin = getUpstreamOrigin(incomingUrl);
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, upstreamOrigin);
  const headers = new Headers(request.headers);
  const htmlNavigation = isHtmlNavigation(request);
  const releaseAsset = isReleaseAsset(request);

  headers.delete("host");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");
  headers.set("x-nexura-original-host", incomingUrl.host);
  if (htmlNavigation || releaseAsset) {
    upstreamUrl.searchParams.set(htmlNavigation ? "__nexura_html" : "__nexura_asset", HTML_RELEASE_VERSION);
    headers.set("cache-control", "no-cache");
    headers.set("pragma", "no-cache");
  }

  const init = {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual"
  };

  if (htmlNavigation || releaseAsset) {
    init.cf = {
      cacheTtl: 0,
      cacheEverything: false,
      cacheKey: `${upstreamUrl.toString()}::${HTML_RELEASE_VERSION}`
    };
  }

  return {
    url: upstreamUrl.toString(),
    init
  };
}

async function buildResponse(response, request) {
  const location = response.headers.get("location");
  const headers = new Headers(response.headers);
  const requestUrl = new URL(request.url);
  const contentType = headers.get("content-type") || "";
  const shouldBypassCache = isHtmlNavigation(request) || isReleaseAsset(request) || contentType.includes("text/html");

  if (location && [301, 302, 303, 307, 308].includes(response.status)) {
    const upstreamUrl = new URL(getUpstreamOrigin(requestUrl));
    const rewritten = new URL(location, upstreamUrl);

    if (rewritten.host === upstreamUrl.host) {
      rewritten.protocol = requestUrl.protocol;
      rewritten.host = requestUrl.host;
      headers.set("location", rewritten.toString());
    }
  }

  headers.set("x-nexura-domain-proxy", getUpstreamOrigin(requestUrl) === API_UPSTREAM_ORIGIN ? "pages-functions" : "vercel");
  headers.set("x-nexura-proxy-version", HTML_RELEASE_VERSION);
  applyProtectionHeaders(headers);

  if (shouldBypassCache) {
    headers.set("cache-control", HTML_CACHE_CONTROL);
    headers.set("cdn-cache-control", HTML_CACHE_CONTROL);
    headers.set("cloudflare-cdn-cache-control", HTML_CACHE_CONTROL);
  }

  let body = response.body;
  if (shouldBypassCache && contentType.includes("text/html") && body) {
    let html = await response.text();
    HTML_REPLACEMENTS.forEach(([pattern, replacement]) => {
      html = html.replace(pattern, replacement);
    });
    body = html;
    headers.delete("content-length");
  }

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const localRedirect = buildLocalRedirect(request);
  if (localRedirect) return localRedirect;

  const upstreamRequest = buildUpstreamRequest(request);
  const response = await fetch(upstreamRequest.url, upstreamRequest.init);
  return buildResponse(response, request);
}
