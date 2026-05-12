#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const accountId = "a05bdd93563fd82b29effb6ebfa19fa7";
const projectName = "nexuradata-ai";
const pagesTarget = `${projectName}.pages.dev`;
const domains = [
  "nexuradata.ca",
  "www.nexuradata.ca"
];
const zoneOverrides = [
  { name: "nexuradata.ca", id: process.env.CLOUDFLARE_ZONE_ID || "cd0e99a07eca01f763bea338bb537cfb" }
];

const readWranglerOAuthToken = async () => {
  const configPath = path.join(homedir(), ".wrangler", "config", "default.toml");
  const config = await readFile(configPath, "utf8").catch(() => "");
  const match = config.match(/oauth_token\s*=\s*"([^"]+)"/);
  return match?.[1] || "";
};

const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || await readWranglerOAuthToken();

if (!token) {
  throw new Error("Missing Cloudflare token. Set CLOUDFLARE_API_TOKEN or run wrangler login.");
}

const headers = {
  authorization: `Bearer ${token}`,
  "content-type": "application/json"
};

const requestCloudflare = async (resource, options = {}) => {
  const response = await fetch(`https://api.cloudflare.com/client/v4${resource}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success === false) {
    const message = data?.errors?.map((error) => error.message).join("; ") || response.statusText;
    throw new Error(`${options.method || "GET"} ${resource} failed: ${message}`);
  }

  return data;
};

const listZones = async () => {
  try {
    const data = await requestCloudflare(`/zones?per_page=100`);
    return data.result || [];
  } catch (error) {
    if (/Authentication error|permission|not authorized|forbidden|unauthorized|failed: auth/i.test(error.message)) {
      console.log("Cloudflare zone listing unavailable; using configured zone overrides.");
      return [];
    }
    throw error;
  }
};

const findZone = (zones, domain) => {
  const matches = zones
    .filter((zone) => domain === zone.name || domain.endsWith(`.${zone.name}`))
    .sort((left, right) => right.name.length - left.name.length);
  if (matches[0]) return matches[0];

  return zoneOverrides
    .filter((zone) => domain === zone.name || domain.endsWith(`.${zone.name}`))
    .sort((left, right) => right.name.length - left.name.length)[0] || null;
};

const attachPagesDomain = async (domain) => {
  try {
    await requestCloudflare(`/accounts/${accountId}/pages/projects/${projectName}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: domain })
    });
    console.log(`Pages domain attached: ${domain}`);
  } catch (error) {
    if (/already exists|already been taken|already added|custom domain|conflict/i.test(error.message)) {
      console.log(`Pages domain already attached: ${domain}`);
      return;
    }
    throw error;
  }
};

const upsertDnsRecord = async (zone, domain) => {
  const recordName = domain === zone.name ? "@" : domain.slice(0, -(zone.name.length + 1));
  const encodedName = encodeURIComponent(domain);
  const records = await requestCloudflare(`/zones/${zone.id}/dns_records?name=${encodedName}&per_page=100`);
  const candidates = records.result || [];

  for (const record of candidates) {
    if (!["A", "AAAA", "CNAME"].includes(record.type)) continue;

    if (record.type === "CNAME") {
      await requestCloudflare(`/zones/${zone.id}/dns_records/${record.id}`, {
        method: "PATCH",
        body: JSON.stringify({ type: "CNAME", name: recordName, content: pagesTarget, proxied: true })
      });
      console.log(`DNS CNAME updated: ${domain} -> ${pagesTarget}`);
      return;
    }

    await requestCloudflare(`/zones/${zone.id}/dns_records/${record.id}`, { method: "DELETE" });
    console.log(`DNS conflicting ${record.type} removed: ${domain}`);
  }

  await requestCloudflare(`/zones/${zone.id}/dns_records`, {
    method: "POST",
    body: JSON.stringify({ type: "CNAME", name: recordName, content: pagesTarget, proxied: true })
  });
  console.log(`DNS CNAME created: ${domain} -> ${pagesTarget}`);
};

const sync = async () => {
  console.log(`Syncing Cloudflare Pages domains for ${projectName}...`);
  const zones = await listZones();

  for (const domain of domains) {
    await attachPagesDomain(domain);
    const zone = findZone(zones, domain);

    if (!zone) {
      throw new Error(`No Cloudflare zone found for ${domain}.`);
    }

    await upsertDnsRecord(zone, domain);
  }

  const pagesDomains = await requestCloudflare(`/accounts/${accountId}/pages/projects/${projectName}/domains`);
  console.log("\nCurrent Pages domains:");
  for (const domain of pagesDomains.result || []) {
    console.log(`- ${domain.name}: ${domain.status}${domain.verification_data?.error_message ? ` (${domain.verification_data.error_message})` : ""}`);
  }
};

sync().catch((error) => {
  console.error(error.message);
  if (/Authentication error|permission|not authorized|forbidden|failed: auth/i.test(error.message)) {
    console.error("This token can attach Pages domains but cannot edit DNS. Set CLOUDFLARE_API_TOKEN with Zone:DNS:Edit for nexuradata.ca and nexuradata.ca, then rerun npm run cf:domains:sync.");
  }
  process.exit(1);
});
