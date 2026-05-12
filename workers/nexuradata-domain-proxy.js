const UPSTREAM_ORIGIN = "https://nexuradata-ai.vercel.app";

function buildUpstreamRequest(request) {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, UPSTREAM_ORIGIN);
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));

  return new Request(upstreamUrl.toString(), {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual"
  });
}

function rewriteRedirect(response, request) {
  const location = response.headers.get("location");
  if (!location || ![301, 302, 303, 307, 308].includes(response.status)) {
    return response;
  }

  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(UPSTREAM_ORIGIN);
  const rewritten = new URL(location, upstreamUrl);

  if (rewritten.host !== upstreamUrl.host) {
    return response;
  }

  rewritten.protocol = requestUrl.protocol;
  rewritten.host = requestUrl.host;

  const headers = new Headers(response.headers);
  headers.set("location", rewritten.toString());

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
  const response = await fetch(buildUpstreamRequest(request));
  return rewriteRedirect(response, request);
}
