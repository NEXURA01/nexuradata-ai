#!/usr/bin/env node
/**
 * NEXURADATA — pre-push / CI quality gate
 *
 * Checks that cannot be caught by unit tests:
 *   1. CSP does not contain unsafe-inline or unsafe-eval
 *   2. No secrets hardcoded in functions/ (API keys, tokens, passwords)
 *   3. Functions handlers use correct onRequestOptions signature (env-aware CORS)
 *   4. release-cloudflare/ is in sync with source after build
 *
 * Run: node ./scripts/check.mjs
 * Exit 0 = all clear. Exit 1 = violations found (with details).
 */

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const errors = [];
const NEXT_CONFIG_FILES = [
    "next.config.ts",
    "next.config.js",
    "next.config.mjs",
    "next.config.cjs",
    "next.config.mts",
    "next.config.cts",
];

function fail(rule, detail) {
    errors.push({ rule, detail });
}

// ─── 1. CSP — no unsafe directives ───────────────────────────────────────────
const headersPath = join(ROOT, "_headers");
if (existsSync(headersPath)) {
    const headers = readFileSync(headersPath, "utf8");
    if (/unsafe-inline|unsafe-eval/.test(headers)) {
        fail(
            "CSP_UNSAFE_DIRECTIVE",
            "_headers contains 'unsafe-inline' or 'unsafe-eval' in Content-Security-Policy. Remove them."
        );
    }
} else {
    let cspFoundIn = null;

    for (const configFile of NEXT_CONFIG_FILES) {
        const configPath = join(ROOT, configFile);
        if (!existsSync(configPath)) {
            continue;
        }
        const nextConfig = readFileSync(configPath, "utf8");
        if (/Content-Security-Policy/i.test(nextConfig)) {
            cspFoundIn = configFile;
            break;
        }
    }

    if (!cspFoundIn) {
        const vercelConfigPath = join(ROOT, "vercel.json");
        if (existsSync(vercelConfigPath)) {
            const vercelConfigRaw = readFileSync(vercelConfigPath, "utf8");
            try {
                const vercelConfig = JSON.parse(vercelConfigRaw);
                const headerRules = Array.isArray(vercelConfig.headers) ? vercelConfig.headers : [];
                const hasCspHeader = headerRules.some((rule) => Array.isArray(rule?.headers)
                    && rule.headers.some((h) => String(h?.key || "").toLowerCase() === "content-security-policy"));
                if (hasCspHeader) {
                    cspFoundIn = "vercel.json";
                }
            } catch {
                if (/Content-Security-Policy/i.test(vercelConfigRaw)) {
                    cspFoundIn = "vercel.json";
                }
            }
        }
    }

    if (!cspFoundIn) {
        fail(
            "CSP_MISSING",
            "No Content-Security-Policy found in _headers, any next.config.* file, or vercel.json."
        );
    }
}

// ─── 2. No hardcoded secrets in functions/ ───────────────────────────────────
const SECRET_PATTERNS = [
    // Generic high-entropy patterns for known key formats
    { pattern: /sk_live_[A-Za-z0-9]{20,}/, label: "Stripe live secret key" },
    { pattern: /sk_test_[A-Za-z0-9]{20,}/, label: "Stripe test secret key" },
    { pattern: /re_[A-Za-z0-9]{20,}/, label: "Resend API key" },
    { pattern: /whsec_[A-Za-z0-9]{20,}/, label: "Stripe webhook secret" },
    // Generic: any assignment to common secret var names with a quoted value
    { pattern: /(?:api.?key|secret.?key|password|token)\s*[=:]\s*['"][A-Za-z0-9+/=_\-]{16,}['"]/i, label: "Hardcoded credential assignment" },
];

const funcFiles = [];
function walk(dir) {
    if (!existsSync(dir)) {
        return;
    }

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
            funcFiles.push(fullPath);
        }
    }
}
walk(join(ROOT, "functions"));

for (const file of funcFiles) {
    const content = readFileSync(file, "utf8");
    const rel = relative(ROOT, file).replaceAll("\\", "/");
    for (const { pattern, label } of SECRET_PATTERNS) {
        if (pattern.test(content)) {
            fail("SECRET_IN_CODE", `${rel}: possible ${label} detected. Use context.env.SECRET_NAME instead.`);
        }
    }
}

// ─── 3. onRequestOptions signature — must pass env ───────────────────────────
for (const file of funcFiles) {
    const content = readFileSync(file, "utf8");
    const rel = relative(ROOT, file).replaceAll("\\", "/");
    // Detect old signature: () => onOptions(  (no env argument)
    if (/onRequestOptions\s*=\s*\(\s*\)\s*=>\s*onOptions\s*\(/.test(content)) {
        fail(
            "CORS_STALE_SIGNATURE",
            `${rel}: onRequestOptions uses old signature () => onOptions(...). Update to (context) => onOptions(context.env, ...) for dynamic CORS origin.`
        );
    }
}

// ─── 4. release-cloudflare/ in sync with source ──────────────────────────────
try {
    execSync("npm run build:static --silent", { cwd: ROOT, stdio: "pipe" });
    const dirty = execSync("git status --porcelain release-cloudflare/", { cwd: ROOT, encoding: "utf8" }).trim();
    if (dirty) {
        fail(
            "BUILD_OUT_OF_SYNC",
            "release-cloudflare/ is out of sync with source. Run 'npm run build' and commit the result.\n" + dirty
        );
    }
} catch (e) {
    fail("BUILD_FAILED", "npm run build failed: " + (e.message || e));
}

// ─── Report ───────────────────────────────────────────────────────────────────
if (errors.length === 0) {
    console.log("✓ All checks passed.");
    process.exit(0);
} else {
    console.error(`\n✗ ${errors.length} check(s) failed:\n`);
    for (const { rule, detail } of errors) {
        console.error(`  [${rule}]\n  ${detail}\n`);
    }
    process.exit(1);
}
