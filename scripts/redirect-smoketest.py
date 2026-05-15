#!/usr/bin/env python3
"""
Smoke-test every redirect rule ported from Cloudflare _redirects into
vercel.json. Prints a per-rule diff (expected vs actual Location, full hop
history) and writes machine + human reports for CI artifacts.

Usage:
    python redirect-smoketest.py                       # tests https://nexuradata.ca
    python redirect-smoketest.py https://staging.host
    BASE=https://nexuradata.ca python redirect-smoketest.py

Env / flags:
    BASE                 base URL (overridden by positional arg)
    REPORT_DIR           where to write report.json + report.html
                         (default: ./redirect-report)
    MAX_HOPS             redirect hop cap (default: 5)
    TIMEOUT              per-request timeout in seconds (default: 15)

Exit codes:
    0  all rules pass
    1  one or more rules failed
    2  network/setup error
"""

from __future__ import annotations
import json
import os
import sys
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler

# ───────────────────────── Rules ─────────────────────────
# (source_path, expected_destination_path_or_url)
RULES: list[tuple[str, str]] = [
    ("/index.html",  "/"),
    ("/index2",      "/"),
    ("/index2.html", "/"),

    ("/paiement-reussi.html", "/payment-success"),
    ("/paiement-annule.html", "/payment-cancelled"),
    ("/en/services.html",     "/en"),

    ("/intelligence-artificielle-laboratoire.html",     "/le-laboratoire.html"),
    ("/en/intelligence-artificielle-laboratoire.html",  "/en/le-laboratoire.html"),

    ("/whatsapp.html",                        "/#contact"),
    ("/en/whatsapp.html",                     "/en/#contact"),
    ("/reserver-creneau-laboratoire.html",    "/#contact"),
    ("/en/reserver-creneau-laboratoire.html", "/en/#contact"),

    ("/comment-choisir-recuperation-donnees-montreal.html",
     "/processus-recuperation-donnees-montreal.html"),
    ("/en/comment-choisir-recuperation-donnees-montreal.html",
     "/en/processus-recuperation-donnees-montreal.html"),
    ("/comment-nous-envoyer-vos-donnees.html",
     "/reception-securisee-donnees-montreal.html"),
    ("/en/comment-nous-envoyer-vos-donnees.html",
     "/en/reception-securisee-donnees-montreal.html"),

    ("/recuperation-donnees-brossard.html",      "/zones-desservies-montreal-quebec.html"),
    ("/en/recuperation-donnees-brossard.html",   "/en/zones-desservies-montreal-quebec.html"),
    ("/recuperation-donnees-laval.html",         "/zones-desservies-montreal-quebec.html"),
    ("/en/recuperation-donnees-laval.html",      "/en/zones-desservies-montreal-quebec.html"),
    ("/recuperation-donnees-longueuil.html",     "/zones-desservies-montreal-quebec.html"),
    ("/en/recuperation-donnees-longueuil.html",  "/en/zones-desservies-montreal-quebec.html"),
    ("/recuperation-donnees-repentigny.html",    "/zones-desservies-montreal-quebec.html"),
    ("/en/recuperation-donnees-repentigny.html", "/en/zones-desservies-montreal-quebec.html"),
    ("/recuperation-donnees-terrebonne.html",    "/zones-desservies-montreal-quebec.html"),
    ("/en/recuperation-donnees-terrebonne.html", "/en/zones-desservies-montreal-quebec.html"),

    ("/portal",          "/fr/contact"),
    ("/portal.html",     "/fr/contact"),
    ("/trust",           "/fr/services"),
    ("/security",        "/fr/services"),
    ("/web-protection",  "/fr/services"),
    ("/cipher",          "/fr/services"),
    ("/certificate",     "/fr/services"),
    ("/ai-certificate",  "/fr/services"),
]

# Host-canonicalization rules
HOST_RULES: list[tuple[str, str]] = [
    ("www.nexuradata.ca",        "nexuradata.ca"),
    ("nexuradata-ai.vercel.app", "nexuradata.ca"),
]

REDIRECT_CODES = {301, 302, 303, 307, 308}
TIMEOUT = int(os.environ.get("TIMEOUT", "15"))
MAX_HOPS = int(os.environ.get("MAX_HOPS", "5"))
USER_AGENT = "nexuradata-redirect-smoketest/2.0"


# ───────────────────────── Data ─────────────────────────

@dataclass
class Hop:
    url: str
    status: int | None = None
    location: str | None = None
    error: str | None = None
    elapsed_ms: int | None = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class RuleResult:
    kind: str  # "path" | "host"
    source: str
    expected: str
    actual: str | None
    ok: bool
    reason: str
    hops: list[Hop] = field(default_factory=list)
    duration_ms: int = 0

    def to_dict(self) -> dict:
        d = asdict(self)
        d["hops"] = [h.to_dict() for h in self.hops]
        return d


# ───────────────────────── HTTP helpers ─────────────────────────

class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *_a, **_kw):
        return None


_OPENER = build_opener(_NoRedirect)


def _fetch(url: str, host_override: str | None = None) -> Hop:
    headers = {"User-Agent": USER_AGENT, "Accept": "*/*"}
    if host_override:
        headers["Host"] = host_override
    req = Request(url, method="GET", headers=headers)
    t0 = time.monotonic()
    try:
        resp = _OPENER.open(req, timeout=TIMEOUT)
        return Hop(url=url, status=resp.status,
                   location=resp.headers.get("Location"),
                   elapsed_ms=int((time.monotonic() - t0) * 1000))
    except HTTPError as e:
        return Hop(url=url, status=e.code,
                   location=(e.headers.get("Location") if e.headers else None),
                   elapsed_ms=int((time.monotonic() - t0) * 1000))
    except (URLError, TimeoutError, OSError) as e:
        return Hop(url=url, error=str(e),
                   elapsed_ms=int((time.monotonic() - t0) * 1000))


def normalize(url: str) -> str:
    s = urlsplit(url)
    netloc = s.netloc
    if s.scheme == "http" and netloc.endswith(":80"):
        netloc = netloc[:-3]
    if s.scheme == "https" and netloc.endswith(":443"):
        netloc = netloc[:-4]
    path = s.path or "/"
    return urlunsplit((s.scheme, netloc, path, s.query, s.fragment))


def _equal(a: str, b: str) -> bool:
    """Compare URLs ignoring trailing slash on path."""
    na, nb = normalize(a).rstrip("/"), normalize(b).rstrip("/")
    return na == nb


# ───────────────────────── Checks ─────────────────────────

def check_path(base: str, src: str, expected: str) -> RuleResult:
    url = base.rstrip("/") + src
    expected_url = expected if expected.startswith("http") else base.rstrip("/") + expected

    t0 = time.monotonic()
    hops: list[Hop] = []
    cur = url
    seen = {cur}
    final_url = cur

    for hop_idx in range(MAX_HOPS):
        h = _fetch(cur)
        hops.append(h)
        if h.error:
            return RuleResult("path", src, expected_url, None, False,
                              f"network error: {h.error}", hops,
                              int((time.monotonic() - t0) * 1000))
        if h.status not in REDIRECT_CODES:
            final_url = cur
            break
        if not h.location:
            return RuleResult("path", src, expected_url, cur, False,
                              f"{h.status} with no Location header", hops,
                              int((time.monotonic() - t0) * 1000))
        nxt = urljoin(cur, h.location)
        if nxt in seen:
            return RuleResult("path", src, expected_url, nxt, False,
                              "redirect loop detected", hops,
                              int((time.monotonic() - t0) * 1000))
        seen.add(nxt)
        cur = nxt
        if _equal(cur, expected_url):
            final_url = cur
            break
    else:
        return RuleResult("path", src, expected_url, cur, False,
                          f"too many hops (>{MAX_HOPS})", hops,
                          int((time.monotonic() - t0) * 1000))

    if hops[0].status not in REDIRECT_CODES:
        return RuleResult("path", src, expected_url, final_url, False,
                          f"expected redirect, got {hops[0].status}", hops,
                          int((time.monotonic() - t0) * 1000))

    ok = _equal(final_url, expected_url)
    reason = "match" if ok else "destination mismatch"
    return RuleResult("path", src, expected_url, final_url, ok, reason, hops,
                      int((time.monotonic() - t0) * 1000))


def check_host(_base: str, src_host: str, target_host: str) -> RuleResult:
    src_url = f"https://{src_host}/"
    target_url = f"https://{target_host}/"
    t0 = time.monotonic()
    h = _fetch(src_url)
    hops = [h]
    if h.error:
        return RuleResult("host", src_host, target_host, None, False,
                          f"network error: {h.error}", hops,
                          int((time.monotonic() - t0) * 1000))
    if h.status not in REDIRECT_CODES:
        return RuleResult("host", src_host, target_host, src_url, False,
                          f"expected redirect, got {h.status}", hops,
                          int((time.monotonic() - t0) * 1000))
    if not h.location:
        return RuleResult("host", src_host, target_host, src_url, False,
                          f"{h.status} with no Location header", hops,
                          int((time.monotonic() - t0) * 1000))
    final_url = urljoin(src_url, h.location)
    ok = urlsplit(final_url).netloc == target_host
    return RuleResult("host", src_host, target_host, final_url, ok,
                      "match" if ok else "wrong target host", hops,
                      int((time.monotonic() - t0) * 1000))


# ───────────────────────── Pretty print ─────────────────────────

USE_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None
def _c(code: str, s: str) -> str:
    return f"\033[{code}m{s}\033[0m" if USE_COLOR else s
GREEN = lambda s: _c("32", s)
RED = lambda s: _c("31", s)
DIM = lambda s: _c("2",  s)
BOLD = lambda s: _c("1",  s)


def print_result(r: RuleResult) -> None:
    head = f"{GREEN('✓')} " if r.ok else f"{RED('✗')} "
    print(f"{head}{BOLD(r.source)}  →  {r.expected}  {DIM(f'[{r.duration_ms}ms]')}")
    if r.ok:
        return
    print(f"  {RED('reason:')}   {r.reason}")
    print(f"  {RED('expected:')} {r.expected}")
    print(f"  {RED('actual:')}   {r.actual or '(none)'}")
    if r.hops:
        print(f"  {DIM('hops:')}")
        for i, h in enumerate(r.hops, 1):
            if h.error:
                print(f"    {i}. {h.url}  →  {RED('ERROR')} {h.error}")
            else:
                loc = f"  →  {h.location}" if h.location else ""
                print(f"    {i}. {h.url}  [{h.status}]{loc}  {DIM(f'{h.elapsed_ms}ms')}")


# ───────────────────────── Reports ─────────────────────────

def write_json_report(path: Path, base: str, results: list[RuleResult]) -> None:
    summary = {
        "base": base,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total": len(results),
        "passed": sum(1 for r in results if r.ok),
        "failed": sum(1 for r in results if not r.ok),
        "rules": [r.to_dict() for r in results],
    }
    path.write_text(json.dumps(summary, indent=2))


def write_html_report(path: Path, base: str, results: list[RuleResult]) -> None:
    passed = sum(1 for r in results if r.ok)
    failed = len(results) - passed
    rows = []
    for r in results:
        cls = "ok" if r.ok else "fail"
        badge = "PASS" if r.ok else "FAIL"
        hop_html = ""
        if r.hops:
            items = []
            for i, h in enumerate(r.hops, 1):
                if h.error:
                    items.append(f"<li><code>{escape(h.url)}</code> → "
                                 f"<span class='err'>ERROR</span> {escape(h.error)}</li>")
                else:
                    loc = (f" → <code>{escape(h.location)}</code>"
                           if h.location else "")
                    items.append(f"<li><code>{escape(h.url)}</code> "
                                 f"<span class='status'>[{h.status}]</span>{loc} "
                                 f"<span class='dim'>{h.elapsed_ms}ms</span></li>")
            hop_html = "<ol>" + "".join(items) + "</ol>"
        rows.append(f"""
        <tr class="{cls}">
          <td><span class="badge {cls}">{badge}</span></td>
          <td><code>{escape(r.source)}</code></td>
          <td><code>{escape(r.expected)}</code></td>
          <td><code>{escape(r.actual or '—')}</code></td>
          <td>{escape(r.reason)}</td>
          <td>{r.duration_ms}ms</td>
        </tr>
        <tr class="hops {cls}"><td colspan="6">{hop_html}</td></tr>""")
    html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Redirect smoke-test — {escape(base)}</title>
<style>
  body {{ font: 14px/1.5 system-ui, sans-serif; margin: 2rem; color: #111; }}
  h1 {{ margin: 0 0 .25rem; }}
  .meta {{ color: #666; margin-bottom: 1.5rem; }}
  .summary {{ display: flex; gap: 1rem; margin-bottom: 1.5rem; }}
  .summary .card {{ padding: .75rem 1rem; border-radius: 8px; border: 1px solid #ddd; }}
  .summary .pass {{ background: #ecfdf5; border-color: #10b981; }}
  .summary .fail {{ background: #fef2f2; border-color: #ef4444; }}
  table {{ border-collapse: collapse; width: 100%; }}
  th, td {{ text-align: left; padding: .5rem .75rem; border-bottom: 1px solid #eee; vertical-align: top; }}
  th {{ background: #f8f8f8; }}
  tr.fail > td {{ background: #fff7f7; }}
  tr.hops > td {{ padding-top: 0; padding-bottom: 1rem; color: #555; }}
  tr.hops ol {{ margin: 0; padding-left: 1.25rem; }}
  .badge {{ padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }}
  .badge.ok {{ background: #d1fae5; color: #065f46; }}
  .badge.fail {{ background: #fee2e2; color: #991b1b; }}
  code {{ background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-size: 12px; }}
  .status {{ color: #2563eb; font-weight: 600; }}
  .err {{ color: #b91c1c; font-weight: 600; }}
  .dim {{ color: #999; font-size: 11px; }}
</style></head><body>
<h1>Redirect smoke-test</h1>
<div class="meta">Base: <code>{escape(base)}</code> · Generated {escape(datetime.now(timezone.utc).isoformat())}</div>
<div class="summary">
  <div class="card pass"><strong>{passed}</strong> passed</div>
  <div class="card {'fail' if failed else ''}"><strong>{failed}</strong> failed</div>
  <div class="card"><strong>{len(results)}</strong> total</div>
</div>
<table>
  <thead><tr><th>Status</th><th>Source</th><th>Expected</th><th>Actual</th><th>Reason</th><th>Time</th></tr></thead>
  <tbody>{''.join(rows)}</tbody>
</table>
</body></html>"""
    path.write_text(html)


# ───────────────────────── Main ─────────────────────────

def main() -> int:
    base = (
        sys.argv[1] if len(sys.argv) > 1
        else os.environ.get("BASE", "https://nexuradata.ca")
    ).rstrip("/")

    report_dir = Path(os.environ.get("REPORT_DIR", "./redirect-report"))
    report_dir.mkdir(parents=True, exist_ok=True)

    print(BOLD(f"Smoke-testing redirects against: {base}\n"))

    results: list[RuleResult] = []

    print(BOLD("── Path redirects ──"))
    for src, dst in RULES:
        r = check_path(base, src, dst)
        results.append(r)
        print_result(r)

    print(BOLD("\n── Host redirects ──"))
    for src_host, target_host in HOST_RULES:
        r = check_host(base, src_host, target_host)
        results.append(r)
        print_result(r)

    passed = sum(1 for r in results if r.ok)
    failed = len(results) - passed

    json_path = report_dir / "report.json"
    html_path = report_dir / "report.html"
    write_json_report(json_path, base, results)
    write_html_report(html_path, base, results)

    print("\n" + "=" * 60)
    print(f"Result: {GREEN(str(passed)) if passed else passed}/{len(results)} passed, "
          f"{RED(str(failed)) if failed else failed} failed")
    print(f"Reports: {json_path}  {html_path}")
    if failed:
        print("\n" + RED("Failed rules:"))
        for r in results:
            if not r.ok:
                print(f"  {RED('✗')} {r.source} → {r.expected}  ({r.reason})")
        return 1
    print(GREEN("All redirect rules OK ✓"))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(130)
    except Exception as e:  # noqa: BLE001
        print(f"setup/network error: {e}", file=sys.stderr)
        sys.exit(2)
