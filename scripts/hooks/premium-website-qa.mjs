#!/usr/bin/env node
// premium-website-qa.mjs
// Hooks for NEXURA website work: inject premium UX and QA expectations without
// blocking normal agent flow.

import { execFileSync } from "node:child_process";
import process from "node:process";

const eventArg = process.argv.find((arg) => arg.startsWith("--event="));
const eventName = eventArg ? eventArg.slice("--event=".length) : "";

const readStdin = async () => {
  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input;
};

const parseInput = async () => {
  const raw = await readStdin();
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
};

const emitMessage = (systemMessage) => {
  if (!systemMessage) return;
  process.stdout.write(`${JSON.stringify({ systemMessage })}\n`);
};

const websitePromptPattern = /\b(website|site|homepage|landing|button|cta|navigation|premium|cookie|privacy|french|english|bilingual|language|seo|lighthouse|playwright|browser|mobile|desktop|deploy|vercel|cloudflare)\b/i;

const websiteFilePattern = /(^|\/)(index|services|pricing|contact|privacy|operational-assessment|ai-trust-security|portal|payment-success|payment-cancelled)\.html$|\.html$|^assets\/(css|js)\/|^_headers$|^_redirects$|^vercel\.json$|^workers\/|^functions\/api\/|^scripts\/generate-sitemap\.mjs$|^sitemap\.xml$|^site\.webmanifest$/;

const promptMessage = [
  "NEXURA WEBSITE CONTEXT: keep every website change premium, sharp, and easy to navigate.",
  "For public website work, verify button destinations, English/French separation, cookie/privacy landing, mobile and desktop layout, sitemap/SEO impact, security headers when relevant, and build/check/test results before finalizing."
].join(" ");

const stopMessage = [
  "NEXURA WEBSITE STOP CHECK: website files are modified.",
  "Before final response, confirm the premium path is not confusing, key buttons land correctly, English and French routes are separated, the cookie/privacy landing is correct, build/check/tests have run, and browser/live validation was attempted or explain why it was unavailable."
].join(" ");

const getChangedFiles = () => {
  try {
    const output = execFileSync("git", ["status", "--short"], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });

    return output
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => (line.length > 3 ? line.slice(3) : line.trim()))
      .map((line) => line.replace(/^.* -> /, ""));
  } catch {
    return [];
  }
};

const input = await parseInput();

if (eventName === "UserPromptSubmit") {
  const searchableInput = JSON.stringify(input);
  if (websitePromptPattern.test(searchableInput)) {
    emitMessage(promptMessage);
  }
  process.exit(0);
}

if (eventName === "Stop") {
  const changedWebsiteFiles = getChangedFiles().filter((filePath) => websiteFilePattern.test(filePath.replace(/\\/g, "/")));
  if (changedWebsiteFiles.length > 0) {
    emitMessage(`${stopMessage} Changed website files: ${changedWebsiteFiles.slice(0, 12).join(", ")}${changedWebsiteFiles.length > 12 ? ", ..." : ""}`);
  }
  process.exit(0);
}

process.exit(0);
