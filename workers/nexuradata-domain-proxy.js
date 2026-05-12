const UPSTREAM_ORIGIN = "https://nexuradata-ai.vercel.app";
const API_UPSTREAM_ORIGIN = "https://nexuradata-ai.pages.dev";
const HTML_CACHE_CONTROL = "no-store, max-age=0, must-revalidate";
const HTML_UPSTREAM_CACHE_BYPASS = "20260512-visual";
const HTML_REPLACEMENTS = [
  [/site\.css\?v=(?:20260503i|20260511-ai)/g, `site.css?v=${HTML_UPSTREAM_CACHE_BYPASS}`],
  [/Queue Stable/g, "Synchronization Stable"],
  [/Execution Online/g, "Infrastructure Online"]
];

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

function buildUpstreamRequest(request) {
  const incomingUrl = new URL(request.url);
  const upstreamOrigin = getUpstreamOrigin(incomingUrl);
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, upstreamOrigin);
  const headers = new Headers(request.headers);
  const htmlNavigation = isHtmlNavigation(request);

  headers.delete("host");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");
  headers.set("x-nexura-original-host", incomingUrl.host);
  if (htmlNavigation) {
    upstreamUrl.searchParams.set("__nexura_html", HTML_UPSTREAM_CACHE_BYPASS);
    headers.set("cache-control", "no-cache");
    headers.set("pragma", "no-cache");
  }

  const init = {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual"
  };

  if (htmlNavigation) {
    init.cf = {
      cacheTtl: 0,
      cacheEverything: false,
      cacheKey: `${upstreamUrl.toString()}::${HTML_UPSTREAM_CACHE_BYPASS}`
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
  const shouldBypassCache = isHtmlNavigation(request) || contentType.includes("text/html");

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
  headers.set("x-nexura-proxy-version", HTML_UPSTREAM_CACHE_BYPASS);
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
  const upstreamRequest = buildUpstreamRequest(request);
  const response = await fetch(upstreamRequest.url, upstreamRequest.init);
  return buildResponse(response, request);
}
