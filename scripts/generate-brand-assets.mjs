#!/usr/bin/env node
/**
 * Generate NEXURADATA raster brand assets from the source SVG identity.
 * Run: node scripts/generate-brand-assets.mjs
 */
import sharp from 'sharp';
import QRCode from 'qrcode';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const NOIR = '#0A0A0B';
const OS = '#F5F1E8';
const COPPER = '#B87333';
const GRAPHITE = '#17191D';
const FONT = "'Inter Tight', 'IBM Plex Sans', Arial, sans-serif";
const CONTACT_URL = 'https://nexuradata.ca/#contact';

async function qrDataUri(size = 220) {
  const svg = await QRCode.toString(CONTACT_URL, {
    type: 'svg',
    margin: 1,
    width: size,
    errorCorrectionLevel: 'H',
    color: {
      dark: NOIR,
      light: OS,
    },
  });

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function ruleGrid(w, h, step = 80) {
  let lines = '';
  for (let x = step; x < w; x += step) {
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${OS}" stroke-width="0.5" opacity="0.035"/>`;
  }
  for (let y = step; y < h; y += step) {
    lines += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${OS}" stroke-width="0.5" opacity="0.035"/>`;
  }
  return lines;
}

function nxMark(size = 120, framed = true) {
  const scale = size / 64;
  return `<g transform="scale(${scale})">
    <rect width="64" height="64" rx="0" fill="${NOIR}"/>
    ${framed ? `<path d="M8 8H56M8 8V56M56 8V56M8 56H56" fill="none" stroke="${OS}" stroke-width="1.5" opacity="0.32"/>` : ''}
    <path d="M19 47V17H24L40 47H45V17" fill="none" stroke="${OS}" stroke-width="5.8" stroke-linecap="square" stroke-linejoin="miter"/>
    <path d="M40 17L52 32L40 47M52 17L40 32L52 47" fill="none" stroke="${COPPER}" stroke-width="4.8" stroke-linecap="square" stroke-linejoin="miter"/>
  </g>`;
}

function wordmark(x, y, size = 72, spacing = 7, anchor = 'start') {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="800" letter-spacing="${spacing}" fill="${OS}" text-anchor="${anchor}">NEXURADATA</text>`;
}

function systemPills(x, y, labels, gap = 14) {
  let cursor = x;
  return labels.map((label) => {
    const width = label.length * 11 + 34;
    const pill = `<g transform="translate(${cursor}, ${y})">
      <rect width="${width}" height="40" rx="0" fill="${GRAPHITE}" stroke="${OS}" stroke-width="0.6" opacity="0.94"/>
      <text x="17" y="26" font-family="${FONT}" font-size="13" font-weight="700" letter-spacing="2" fill="${OS}" opacity="0.68">${label}</text>
    </g>`;
    cursor += width + gap;
    return pill;
  }).join('');
}

async function generateIcons() {
  const faviconSvg = readFileSync(resolve(ROOT, 'assets/icons/favicon.svg'));

  await sharp(faviconSvg).resize(180, 180).png().toFile(resolve(ROOT, 'assets/icons/apple-touch-icon.png'));
  console.log('  - apple-touch-icon.png (180x180)');

  for (const size of [192, 512]) {
    await sharp(faviconSvg).resize(size, size).png().toFile(resolve(ROOT, `assets/icons/icon-${size}.png`));
    console.log(`  - icon-${size}.png`);
  }

  await sharp(faviconSvg).resize(512, 512).png().toFile(resolve(ROOT, 'assets/nexuradata-icon.png'));
  console.log('  - nexuradata-icon.png (512x512)');
}

async function generateMasterPng() {
  const masterSvg = readFileSync(resolve(ROOT, 'assets/nexuradata-master.svg'));
  await sharp(masterSvg).resize(1000, 180).png().toFile(resolve(ROOT, 'assets/nexuradata-master.png'));
  console.log('  - nexuradata-master.png (1000x180)');
}

async function generateOgDefault() {
  const w = 1200, h = 630;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${NOIR}"/>
  ${ruleGrid(w, h, 96)}
  <line x1="80" y1="72" x2="${w - 80}" y2="72" stroke="${OS}" stroke-width="0.8" opacity="0.16"/>
  <line x1="80" y1="558" x2="${w - 80}" y2="558" stroke="${OS}" stroke-width="0.8" opacity="0.16"/>
  <g transform="translate(96, 204)">${nxMark(150)}</g>
  ${wordmark(286, 284, 76, 7)}
  <text x="286" y="346" font-family="${FONT}" font-size="23" font-weight="700" letter-spacing="2.2" fill="${OS}" opacity="0.68">OPERATIONAL INTELLIGENCE INFRASTRUCTURE</text>
  <text x="286" y="400" font-family="${FONT}" font-size="20" font-weight="600" letter-spacing="0.5" fill="${OS}" opacity="0.5">Systems for control, execution and operational trust.</text>
  <rect x="80" y="500" width="220" height="6" fill="${COPPER}"/>
  <text x="80" y="590" font-family="${FONT}" font-size="14" font-weight="700" letter-spacing="3" fill="${OS}" opacity="0.34">nexuradata.ca</text>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(resolve(ROOT, 'assets/icons/og-default.png'));
  console.log('  - og-default.png (1200x630)');
}

async function generateOgEn() {
  const w = 1200, h = 630;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${NOIR}"/>
  ${ruleGrid(w, h, 96)}
  <line x1="80" y1="72" x2="${w - 80}" y2="72" stroke="${OS}" stroke-width="0.8" opacity="0.16"/>
  <line x1="80" y1="558" x2="${w - 80}" y2="558" stroke="${OS}" stroke-width="0.8" opacity="0.16"/>
  <g transform="translate(96, 204)">${nxMark(150)}</g>
  ${wordmark(286, 284, 76, 7)}
  <text x="286" y="346" font-family="${FONT}" font-size="23" font-weight="700" letter-spacing="2.2" fill="${OS}" opacity="0.68">OPERATIONAL INTELLIGENCE INFRASTRUCTURE</text>
  <text x="286" y="400" font-family="${FONT}" font-size="20" font-weight="600" letter-spacing="0.5" fill="${OS}" opacity="0.5">Systems for control, execution and operational trust.</text>
  <rect x="80" y="500" width="220" height="6" fill="${COPPER}"/>
  <text x="80" y="590" font-family="${FONT}" font-size="14" font-weight="700" letter-spacing="3" fill="${OS}" opacity="0.34">nexuradata.ca</text>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(resolve(ROOT, 'assets/icons/og-en.png'));
  console.log('  - og-en.png (1200x630)');
}

async function generateSignature() {
  const w = 500, h = 100;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${NOIR}"/>
  <g transform="translate(18, 20)">${nxMark(58)}</g>
  ${wordmark(96, 58, 30, 3.2)}
  <line x1="96" y1="70" x2="${w - 22}" y2="70" stroke="${OS}" stroke-width="0.8" opacity="0.14"/>
  <text x="96" y="88" font-family="${FONT}" font-size="10" font-weight="700" letter-spacing="2.2" fill="${OS}" opacity="0.38">nexuradata.ca</text>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(resolve(ROOT, 'assets/nexuradata-signature.png'));
  console.log('  - nexuradata-signature.png (500x100)');
}

async function generateSocialProfile() {
  const s = 800;
  const svg = `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${s}" height="${s}" rx="0" fill="${NOIR}"/>
  ${ruleGrid(s, s, 80)}
  <line x1="96" y1="96" x2="704" y2="96" stroke="${OS}" stroke-width="0.8" opacity="0.16"/>
  <line x1="96" y1="704" x2="704" y2="704" stroke="${OS}" stroke-width="0.8" opacity="0.16"/>
  <g transform="translate(${s / 2 - 130}, 176)">${nxMark(260)}</g>
  ${wordmark(s / 2, 526, 48, 5, 'middle')}
  <text x="${s / 2}" y="584" font-family="${FONT}" font-size="15" font-weight="700" letter-spacing="3.4" fill="${OS}" opacity="0.42" text-anchor="middle">OPERATIONAL COMMAND SYSTEMS</text>
  <rect x="300" y="634" width="200" height="6" fill="${COPPER}"/>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(resolve(ROOT, 'assets/icons/social-profile.png'));
  console.log('  - social-profile.png (800x800)');
}

async function generateSocialBanner() {
  const w = 1500, h = 500;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${NOIR}"/>
  ${ruleGrid(w, h, 90)}
  <line x1="72" y1="56" x2="${w - 72}" y2="56" stroke="${OS}" stroke-width="0.8" opacity="0.16"/>
  <line x1="72" y1="444" x2="${w - 72}" y2="444" stroke="${OS}" stroke-width="0.8" opacity="0.16"/>
  <g transform="translate(98, 144)">${nxMark(148)}</g>
  ${wordmark(292, 222, 78, 7)}
  <text x="292" y="286" font-family="${FONT}" font-size="22" font-weight="700" letter-spacing="2.5" fill="${OS}" opacity="0.58">OPERATIONAL INTELLIGENCE INFRASTRUCTURE</text>
  ${systemPills(292, 336, ['CONTROL', 'EXECUTION', 'SYSTEMS', 'TRUST'])}
  <rect x="72" y="390" width="220" height="6" fill="${COPPER}"/>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(resolve(ROOT, 'assets/icons/social-banner.png'));
  console.log('  - social-banner.png (1500x500)');
}

async function generateFacebookCover() {
  const w = 1640, h = 624;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${NOIR}"/>
  ${ruleGrid(w, h, 92)}
  <line x1="88" y1="64" x2="${w - 88}" y2="64" stroke="${OS}" stroke-width="0.8" opacity="0.16"/>
  <line x1="88" y1="560" x2="${w - 88}" y2="560" stroke="${OS}" stroke-width="0.8" opacity="0.16"/>
  <g transform="translate(124, 190)">${nxMark(172)}</g>
  ${wordmark(340, 274, 88, 8)}
  <text x="340" y="342" font-family="${FONT}" font-size="24" font-weight="700" letter-spacing="2.8" fill="${OS}" opacity="0.58">OPERATIONAL COMMAND SYSTEMS</text>
  ${systemPills(340, 408, ['INFRASTRUCTURE', 'ORCHESTRATION', 'CONTROL'])}
  <rect x="88" y="500" width="240" height="7" fill="${COPPER}"/>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(resolve(ROOT, 'assets/icons/facebook-cover.png'));
  console.log('  - facebook-cover.png (1640x624)');
}

async function generateGbpPhoto() {
  const s = 720;
  const svg = `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${s}" height="${s}" fill="${NOIR}"/>
  ${ruleGrid(s, s, 80)}
  <line x1="72" y1="72" x2="648" y2="72" stroke="${OS}" stroke-width="0.8" opacity="0.16"/>
  <line x1="72" y1="648" x2="648" y2="648" stroke="${OS}" stroke-width="0.8" opacity="0.16"/>
  <g transform="translate(${s / 2 - 108}, 140)">${nxMark(216)}</g>
  ${wordmark(s / 2, 438, 42, 4.5, 'middle')}
  <text x="${s / 2}" y="496" font-family="${FONT}" font-size="14" font-weight="700" letter-spacing="3" fill="${OS}" opacity="0.42" text-anchor="middle">INFRASTRUCTURE · CONTROL · EXECUTION</text>
  <rect x="260" y="548" width="200" height="6" fill="${COPPER}"/>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(resolve(ROOT, 'assets/icons/gbp-profile.png'));
  console.log('  - gbp-profile.png (720x720)');
}

async function generateContactQr() {
  const s = 1080;
  const qr = await qrDataUri(520);
  const svg = `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${s}" height="${s}" fill="${NOIR}"/>
  ${ruleGrid(s, s, 96)}
  <line x1="110" y1="110" x2="970" y2="110" stroke="${OS}" stroke-width="0.8" opacity="0.18"/>
  <line x1="110" y1="970" x2="970" y2="970" stroke="${OS}" stroke-width="0.8" opacity="0.18"/>
  <g transform="translate(110, 136)">${nxMark(92)}</g>
  ${wordmark(230, 198, 54, 6)}
  <text x="110" y="314" font-family="${FONT}" font-size="32" font-weight="700" letter-spacing="0.8" fill="${OS}" opacity="0.82">Plan an operational architecture audit</text>
  <text x="110" y="360" font-family="${FONT}" font-size="17" font-weight="700" letter-spacing="3" fill="${OS}" opacity="0.44">SYSTEMS · CONTROL · EXECUTION</text>
  <g transform="translate(280, 420)">
    <rect x="-26" y="-26" width="572" height="572" fill="${NOIR}" stroke="${OS}" stroke-width="0.8" opacity="0.96"/>
    <image href="${qr}" x="0" y="0" width="520" height="520"/>
  </g>
  <text x="540" y="1010" font-family="${FONT}" font-size="17" font-weight="700" letter-spacing="3" fill="${OS}" opacity="0.44" text-anchor="middle">nexuradata.ca/#contact</text>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(resolve(ROOT, 'assets/icons/contact-qr.png'));
  console.log('  - contact-qr.png (1080x1080)');
}

console.log('Generating NEXURADATA brand assets...\n');

try {
  await generateIcons();
  await generateMasterPng();
  await generateOgDefault();
  await generateOgEn();
  await generateSignature();
  await generateSocialProfile();
  await generateSocialBanner();
  await generateFacebookCover();
  await generateGbpPhoto();
  await generateContactQr();
  console.log('\nDone - all brand assets generated.');
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}