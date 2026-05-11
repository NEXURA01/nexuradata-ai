import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const releaseDir = path.join(projectRoot, "release-cloudflare");
const excludedHtmlFiles = new Set(["index2.html"]);

const rootFiles = new Set([
  "_headers",
  "_redirects",
  ".nojekyll",
  "robots.txt",
  "site.webmanifest",
  "merchant-feed.xml",
  "sitemap.xml"
]);

const shouldCopyRootEntry = (entry) => {
  if (entry === "assets") {
    return true;
  }

  if (entry === "en") {
    return true;
  }

  if (entry === "operations") {
    return true;
  }

  if (entry === ".well-known") {
    return true;
  }

  if (rootFiles.has(entry)) {
    return true;
  }

  if (path.extname(entry).toLowerCase() === ".html") {
    return !excludedHtmlFiles.has(entry);
  }

  return false;
};

const GA4_INIT_PATH = "/assets/js/ga4-init.js";
const LEGACY_GA_SNIPPET = /\s*<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-TC31YSS01P"><\/script>\s*<script>window\.dataLayer=window\.dataLayer\|\|\[\];function gtag\(\)\{dataLayer\.push\(arguments\);\}gtag\('js',new Date\(\)\);gtag\('config','G-TC31YSS01P'\);<\/script>/g;
const GA4_SNIPPET = `  <!-- Consent-gated analytics -->
  <script src="${GA4_INIT_PATH}" defer></script>
</head>`;

const injectGa4 = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip internal tooling and asset templates; they are not public page flows.
      if (entry.name === "operations" || entry.name === "assets") continue;
      await injectGa4(fullPath);
      continue;
    }

    if (path.extname(entry.name).toLowerCase() !== ".html") continue;

    const content = await readFile(fullPath, "utf8");
    let updated = content.replace(LEGACY_GA_SNIPPET, "");

    if (updated.includes(GA4_INIT_PATH)) {
      if (updated !== content) {
        await writeFile(fullPath, updated, "utf8");
      }
      continue;
    }

    updated = updated.replace("</head>", GA4_SNIPPET);
    if (updated !== content) {
      await writeFile(fullPath, updated, "utf8");
    }
  }
};

const normalizeXmlOutput = async () => {
  const sitemapPath = path.join(releaseDir, "sitemap.xml");
  const sitemap = await readFile(sitemapPath, "utf8");
  await writeFile(sitemapPath, sitemap.replace(/^\uFEFF/, ""), "utf8");
};

await rm(releaseDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });

const entries = await readdir(projectRoot, { withFileTypes: true });

for (const entry of entries) {
  if (!shouldCopyRootEntry(entry.name)) {
    continue;
  }

  const source = path.join(projectRoot, entry.name);
  const destination = path.join(releaseDir, entry.name);

  await cp(source, destination, { recursive: true });
}

await injectGa4(releaseDir);
await normalizeXmlOutput();

console.log("Generated release-cloudflare/ from the tracked site source.");
