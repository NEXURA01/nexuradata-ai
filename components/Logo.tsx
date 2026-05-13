const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

/**
 * NEXURA — The Punctum Mark
 *
 * A monogram built from three weights of line:
 *   · two heavy pillars (architectural)
 *   · one hairline diagonal under tension (the signal path)
 *   · one solid square at the meeting point (the punctum)
 *
 * The square is the signature. It re-appears as the brand's
 * terminal punctuation in the wordmark — "Nexura ▪"  — so the
 * mark and the type carry the same DNA. Pure monochrome.
 * No circles, no gradients, no decoration.
 *
 *   LogoMark      → the mark in isolation (favicon, avatar)
 *   LogoWordmark  → mark + monospace "NEXURA" (header)
 *   Logo          → mark + serif "Nexura" + rule (footer / hero)
 *   LogoDisplay   → framed plate version (brand pages)
 */

interface LogoBaseProps {
  size?: number;
  className?: string;
}

/* ---------------------------------------------------------------- */
/*  The Mark                                                        */
/* ---------------------------------------------------------------- */
export function LogoMark({ size = 32, className }: LogoBaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block shrink-0", className)}
      aria-hidden="true"
    >
      {/* Left pillar — heavy */}
      <rect x="14" y="12" width="10" height="76" fill="currentColor" />
      {/* Right pillar — heavy */}
      <rect x="76" y="12" width="10" height="76" fill="currentColor" />
      {/* Signal path — hairline diagonal under tension */}
      <line
        x1="24"
        y1="12"
        x2="76"
        y2="88"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      {/* The punctum — the brand signature */}
      <rect x="44" y="44" width="12" height="12" fill="currentColor" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/*  Punctum glyph — re-used as terminal punctuation                 */
/* ---------------------------------------------------------------- */
function Punctum({ size }: { size: number }) {
  return (
    <span
      className="inline-block align-baseline"
      style={{
        width: size,
        height: size,
        backgroundColor: "currentColor",
        marginLeft: size * 0.4,
      }}
      aria-hidden="true"
    />
  );
}

/* ---------------------------------------------------------------- */
/*  Compact wordmark — header / nav                                 */
/* ---------------------------------------------------------------- */
export function LogoWordmark({ size = 26, className }: LogoBaseProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark size={size * 1.4} />
      <span
        className="font-serif leading-none inline-flex items-baseline"
        style={{
          fontSize: size,
          letterSpacing: "-0.018em",
        }}
      >
        Nexura
        <Punctum size={size * 0.16} />
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Full lockup — footer / hero                                     */
/* ---------------------------------------------------------------- */
export function Logo({ size = 44, className }: LogoBaseProps) {
  return (
    <div className={cn("inline-flex items-center gap-4", className)}>
      <LogoMark size={size} />
      <div className="flex flex-col leading-none">
        <span
          className="font-serif inline-flex items-baseline"
          style={{
            fontSize: size * 0.62,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          Nexura
          <Punctum size={size * 0.11} />
        </span>
        <span
          className="font-mono uppercase mt-2"
          style={{
            fontSize: size * 0.2,
            letterSpacing: "0.34em",
            opacity: 0.55,
            lineHeight: 1,
          }}
        >
          Analytics
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Display — framed plate version for brand pages                  */
/* ---------------------------------------------------------------- */
export function LogoDisplay({ size = 200, className }: LogoBaseProps) {
  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <div className="relative" style={{ padding: size * 0.1 }}>
        <span className="absolute top-0 left-0 w-3 h-3 border-l border-t border-current opacity-30" />
        <span className="absolute top-0 right-0 w-3 h-3 border-r border-t border-current opacity-30" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-current opacity-30" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-current opacity-30" />
        <LogoMark size={size} />
      </div>
      <span
        className="font-mono uppercase mt-5"
        style={{
          fontSize: size * 0.055,
          letterSpacing: "0.35em",
          opacity: 0.5,
        }}
      >
        N · 0001 — Punctum Mark
      </span>
    </div>
  );
}
