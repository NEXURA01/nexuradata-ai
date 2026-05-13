const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

/**
 * NEXURA — Brand Identity
 *
 * The logo IS the wordmark. One serif, one signal.
 * The red dot is the brand's quiet accent — a single signal,
 * never decoration. It appears nowhere else by default.
 *
 *   Logo          → full serif wordmark "Nexura." (primary lockup)
 *   LogoMark      → "N." monogram (favicon, avatar, tight spaces)
 *   LogoWordmark  → wordmark + monospace "ANALYTICS" stack (header)
 */

type LogoProps = {
  className?: string;
  size?: number;
  color?: string;
  accent?: string;
};

const BRAND_RED = "#B8412E";

/* ---------------------------------------------------------------- */
/*  Monogram — "N." in the brand serif                              */
/* ---------------------------------------------------------------- */
export function LogoMark({
  className,
  size = 32,
  color = "currentColor",
  accent = BRAND_RED,
}: LogoProps) {
  return (
    <span
      className={cn("inline-flex items-baseline leading-none font-serif", className)}
      style={{ fontSize: `${size}px`, color }}
      aria-hidden="true"
    >
      <span style={{ fontWeight: 400, letterSpacing: "-0.04em" }}>N</span>
      <span style={{ color: accent, marginLeft: "0.02em" }}>.</span>
    </span>
  );
}

/* ---------------------------------------------------------------- */
/*  Primary wordmark — "Nexura."                                     */
/* ---------------------------------------------------------------- */
export function Logo({
  className,
  size = 32,
  color = "currentColor",
  accent = BRAND_RED,
}: LogoProps) {
  return (
    <span
      className={cn("inline-flex items-baseline leading-none font-serif", className)}
      style={{ fontSize: `${size}px`, color }}
      aria-label="Nexura"
    >
      <span style={{ fontWeight: 400, letterSpacing: "-0.03em" }}>Nexura</span>
      <span style={{ color: accent, marginLeft: "0.02em" }}>.</span>
    </span>
  );
}

/* ---------------------------------------------------------------- */
/*  Lockup — wordmark above "ANALYTICS" rule (header / footer)       */
/* ---------------------------------------------------------------- */
export function LogoWordmark({
  className,
  size = 22,
  color = "currentColor",
  accent = BRAND_RED,
}: LogoProps) {
  return (
    <span
      className={cn("inline-flex flex-col leading-none", className)}
      aria-label="Nexura Analytics"
    >
      <span
        className="font-serif"
        style={{
          fontSize: `${size}px`,
          color,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        Nexura
        <span style={{ color: accent }}>.</span>
      </span>
      <span
        className="font-mono uppercase"
        style={{
          fontSize: `${size * 0.32}px`,
          letterSpacing: "0.28em",
          color,
          opacity: 0.55,
          marginTop: `${size * 0.18}px`,
          lineHeight: 1,
        }}
      >
        Analytics
      </span>
    </span>
  );
}
