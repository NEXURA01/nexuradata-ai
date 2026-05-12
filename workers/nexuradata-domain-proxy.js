const UPSTREAM_ORIGIN = "https://nexuradata-ai.vercel.app";
const HTML_CACHE_CONTROL = "no-store, max-age=0, must-revalidate";

function isHtmlNavigation(request) {
  const url = new URL(request.url);
  const accept = request.headers.get("accept") || "";
  const hasFileExtension = /\/[^/]+\.[a-z0-9]+$/i.test(url.pathname);

  return request.method === "GET" && (accept.includes("text/html") || !hasFileExtension);
}

function buildUpstreamRequest(request) {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, UPSTREAM_ORIGIN);
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");
  headers.set("x-nexura-original-host", incomingUrl.host);
  if (isHtmlNavigation(request)) {
    headers.set("cache-control", "no-cache");
    headers.set("pragma", "no-cache");
  }

  const init = {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual"
  };

  if (isHtmlNavigation(request)) {
    init.cf = { cacheTtl: 0, cacheEverything: false };
  }

  return {
    url: upstreamUrl.toString(),
    init
  };
}

function buildResponse(response, request) {
  const location = response.headers.get("location");
  const headers = new Headers(response.headers);
  const contentType = headers.get("content-type") || "";
  const shouldBypassCache = isHtmlNavigation(request) || contentType.includes("text/html");

  if (location && [301, 302, 303, 307, 308].includes(response.status)) {
    const requestUrl = new URL(request.url);
    const upstreamUrl = new URL(UPSTREAM_ORIGIN);
    const rewritten = new URL(location, upstreamUrl);

    if (rewritten.host === upstreamUrl.host) {
      rewritten.protocol = requestUrl.protocol;
      rewritten.host = requestUrl.host;
      headers.set("location", rewritten.toString());
    }
  }

  headers.set("x-nexura-domain-proxy", "vercel");
  if (shouldBypassCache) {
    headers.set("cache-control", HTML_CACHE_CONTROL);
    headers.set("cdn-cache-control", HTML_CACHE_CONTROL);
    headers.set("cloudflare-cdn-cache-control", HTML_CACHE_CONTROL);
  }

  return new Response(response.body, {
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
