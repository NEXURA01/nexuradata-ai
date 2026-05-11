#!/usr/bin/env node
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://nexadura.com";
const LASTMOD = "2026-05-11";
const includedDirs = [".", "en"];
const excludedFiles = new Set(["404.html"]);

const escapeXml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const routeFor = (dir, file) => {
  if (file === "index.html") {
    return dir === "." ? "/" : `/${dir}/`;
  }

  return dir === "." ? `/${file}` : `/${dir}/${file}`;
};

const collectRoutes = async () => {
  const routes = [];

  for (const dir of includedDirs) {
    const absoluteDir = path.join(ROOT, dir);
    const entries = await readdir(absoluteDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".html") || excludedFiles.has(entry.name)) continue;
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
