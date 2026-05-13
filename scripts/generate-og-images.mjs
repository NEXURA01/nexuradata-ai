import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "assets", "icons");

const COLORS = {
  bone: "#e8e4dc",
  black: "#0b0d10",
  inkMuted: "#a7b0bc",
  boneMuted: "#a7b0bc",
  oxide: "#c17c45",
  green: "#00c766",
};

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const DISPLAY_FONT = "Inter Tight, Satoshi, Inter, Arial, sans-serif";
const SANS_FONT = "Inter, Satoshi, Arial, sans-serif";
const MONO_FONT = "IBM Plex Mono, SFMono-Regular, Consolas, monospace";

function textLines(lines, { x, y, size, lineHeight, fill, weight = 700, family = DISPLAY_FONT, opacity = 1 }) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" fill="${fill}" fill-opacity="${opacity}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="0">${escapeXml(line)}</text>`,
    )
    .join("\n");
}

function logoMark(x, y, size, color = COLORS.black) {
  const stroke = Math.max(2, Math.round(size * 0.045));
  const inner = Math.round(size * 0.25);
  const inset = Math.round(size * 0.08);
  const innerX = x + Math.round((size - inner) / 2);
  const innerY = y + Math.round((size - inner) / 2);

  return `
    <rect x="${x + inset}" y="${y + inset}" width="${size - inset * 2}" height="${size - inset * 2}" fill="none" stroke="${color}" stroke-width="${stroke}" />
    <rect x="${innerX}" y="${innerY}" width="${inner}" height="${inner}" fill="${color}" />
  `;
}

function ogSvg({ locale, headline, subline }) {
  const isFr = locale === "fr";
  const eyebrow = isFr ? "NEXURA  ANALYTICS  —  MONTRÉAL" : "NEXURA  ANALYTICS  —  MONTREAL";
  const statusLocale = isFr ? "FR" : "EN";

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${COLORS.bone}" />
  <rect x="0" y="0" width="1200" height="132" fill="${COLORS.bone}" />
  <line x1="0" y1="132" x2="1200" y2="132" stroke="${COLORS.black}" stroke-opacity="0.16" stroke-width="1" />

  ${logoMark(42, 30, 72)}
  <text x="130" y="83" fill="${COLORS.black}" font-family="${DISPLAY_FONT}" font-size="56" font-weight="800" letter-spacing="-1">Nexura</text>
  <text x="336" y="78" fill="${COLORS.black}" fill-opacity="0.16" font-family="${MONO_FONT}" font-size="38" letter-spacing="0">|</text>
  <text x="396" y="77" fill="${COLORS.black}" font-family="${MONO_FONT}" font-size="23" font-weight="700" letter-spacing="4">${statusLocale === "FR" ? "EN" : "FR"}</text>
  <text x="670" y="77" fill="${COLORS.black}" font-family="${MONO_FONT}" font-size="22" font-weight="700" letter-spacing="5">PLATFORM</text>
  <text x="835" y="77" fill="${COLORS.black}" font-family="${MONO_FONT}" font-size="22" font-weight="700" letter-spacing="5">SERVICES</text>
  <text x="1015" y="77" fill="${COLORS.black}" font-family="${MONO_FONT}" font-size="22" font-weight="700" letter-spacing="5">PRICING</text>

  <rect x="0" y="132" width="1200" height="410" fill="${COLORS.black}" />
  <text x="54" y="218" fill="${COLORS.boneMuted}" font-family="${MONO_FONT}" font-size="23" letter-spacing="11">${escapeXml(eyebrow)}</text>
  ${textLines(headline, { x: 54, y: 356, size: 100, lineHeight: 100, fill: COLORS.bone, weight: 800 })}
  <text x="54" y="505" fill="${COLORS.bone}" fill-opacity="0.72" font-family="${SANS_FONT}" font-size="28" letter-spacing="0">${escapeXml(subline)}</text>
  ${logoMark(1082, 458, 58, COLORS.bone)}

  <line x1="0" y1="542" x2="1200" y2="542" stroke="${COLORS.black}" stroke-opacity="0.12" stroke-width="1" />
  <text x="84" y="594" fill="${COLORS.inkMuted}" font-family="${MONO_FONT}" font-size="16" letter-spacing="7">© 2026 NEXURA. ALL RIGHTS RESERVED.</text>
  <rect x="760" y="576" width="16" height="16" fill="${COLORS.green}" />
  <text x="800" y="594" fill="${COLORS.inkMuted}" font-family="${MONO_FONT}" font-size="16" letter-spacing="5">ALL SYSTEMS OPERATIONAL</text>
  <text x="1138" y="594" fill="${COLORS.inkMuted}" font-family="${MONO_FONT}" font-size="16" letter-spacing="4">${statusLocale}</text>
</svg>`;
}

const images = [
  {
    name: "og-default.png",
    locale: "fr",
    headline: ["On trouve ce qui vous", "coûte de l'argent."],
    subline: "Intelligence opérationnelle pour entreprises de taille moyenne.",
  },
  {
    name: "og-en.png",
    locale: "en",
    headline: ["We find what's costing", "you money."],
    subline: "Operational intelligence for mid-sized companies.",
  },
];

await mkdir(OUT_DIR, { recursive: true });

for (const image of images) {
  const svg = ogSvg(image);
  const file = path.join(OUT_DIR, image.name);
  await sharp(Buffer.from(svg)).png().toFile(file);
  console.log(`generated ${path.relative(ROOT, file)}`);
}
