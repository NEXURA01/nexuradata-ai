#!/usr/bin/env node
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://nexadura.com";
const LASTMOD = "2026-05-11";
const includedFilesByDir = new Map([
  [".", new Set([
    "index.html",
    "ai-operational-analysis.html",
    "conditions-intervention-paiement.html",
    "contact.html",
    "engagements-conformite-quebec.html",
    "faq.html",
    "insights.html",
    "mentions-legales.html",
    "operational-assessment.html",
    "operational-dashboard.html",
    "politique-confidentialite.html",
    "pricing.html",
    "privacy.html",
    "portal.html",
    "services.html",
    "status.html",
    "statut-services-montreal.html",
    "terms.html",
    "workflow-automation.html"
  ])],
  ["en", new Set([
    "index.html",
    "conditions-intervention-paiement.html",
    "engagements-conformite-quebec.html",
    "mentions-legales.html",
    "politique-confidentialite.html",
    "statut-services-montreal.html"
  ])]
]);
const cleanRouteFiles = new Set([
  "operational-assessment.html",
  "services.html",
  "workflow-automation.html",
  "operational-dashboard.html",
  "ai-operational-analysis.html",
  "pricing.html",
  "portal.html",
  "faq.html",
  "contact.html",
  "privacy.html",
  "terms.html",
  "status.html",
  "insights.html"
]);

const escapeXml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const routeFor = (dir, file) => {
  if (file === "index.html") {
    return dir === "." ? "/" : `/${dir}/`;
  }

  if (dir === "." && cleanRouteFiles.has(file)) {
    return `/${file.replace(/\.html$/, "")}`;
  }

  return dir === "." ? `/${file}` : `/${dir}/${file}`;
};

const collectRoutes = async () => {
  const routes = [];

  for (const [dir, indexedFiles] of includedFilesByDir) {
    const absoluteDir = path.join(ROOT, dir);
    const entries = await readdir(absoluteDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !indexedFiles.has(entry.name)) continue;
      routes.push(routeFor(dir, entry.name));
    }
  }

  return routes.sort((left, right) => {
    if (left === "/") return -1;
    if (right === "/") return 1;
    if (left === "/en/") return right === "/" ? 1 : -1;
    if (right === "/en/") return left === "/" ? -1 : 1;
    return left.localeCompare(right, "en");
  });
};

const routes = await collectRoutes();
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((route) => `  <url>
    <loc>${escapeXml(`${SITE_ORIGIN}${route}`)}</loc>
    <lastmod>${LASTMOD}</lastmod>
  </url>`).join("\n")}
</urlset>
`;

await writeFile(path.join(ROOT, "sitemap.xml"), xml, "utf8");
console.log(`Generated sitemap.xml with ${routes.length} URLs for ${SITE_ORIGIN}.`);
