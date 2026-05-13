const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

/**
 * NEXURA — Wordmark-led identity
 *
 * The type IS the logo. Bold serif "Nexura" with one precise
 * detail: a solid square punctum as terminal punctuation —
 * the instrument-maker's signature. Pure monochrome. No icon
 * needed alongside the type. The mark exists only for square
 * contexts (favicon, avatars).
 *
 *   LogoMark      → bold N for favicons & tight squares
 *   LogoWordmark  → "Nexura▪" — primary logo, used everywhere
 *   Logo          → wordmark + ANALYTICS rule for footer / hero
 *   LogoDisplay   → framed plate version for brand pages
 */

interface LogoBaseProps {
  size?: number;
  className?: string;
}

/* ---------------------------------------------------------------- */
/*  Mark — bold geometric N (favicon / square avatars only)         */
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
      {/* Solid geometric N — one connected shape */}
      <path
        d="M 16 12 L 30 12 L 70 64 L 70 12 L 84 12 L 84 88 L 70 88 L 30 36 L 30 88 L 16 88 Z"
        fill="currentColor"
      />
      {/* The punctum — terminal square, anchored bottom-right */}
      <rect x="88" y="80" width="8" height="8" fill="currentColor" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/*  Punctum glyph — terminal punctuation in the wordmark            */
/* ---------------------------------------------------------------- */
function Punctum({ size }: { size: number }) {
  return (
    <span
      className="inline-block"
      style={{
        width: size,
        height: size,
        backgroundColor: "currentColor",
        marginLeft: size * 0.45,
        transform: `translateY(-${size * 0.05}px)`,
      }}
      aria-hidden="true"
    />
  );
}

/* ---------------------------------------------------------------- */
/*  Primary wordmark — header, used everywhere                      */
/* ---------------------------------------------------------------- */
export function LogoWordmark({ size = 26, className }: LogoBaseProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-serif leading-none",
        className,
      )}
      style={{
        fontSize: size,
        letterSpacing: "-0.025em",
        fontWeight: 500,
      }}
    >
      Nexura
      <Punctum size={size * 0.16} />
    </span>
  );
}

/* ---------------------------------------------------------------- */
/*  Full lockup — footer / hero                                     */
/* ---------------------------------------------------------------- */
export function Logo({ size = 36, className }: LogoBaseProps) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <LogoWordmark size={size} />
      <span
        className="font-mono uppercase mt-3"
        style={{
          fontSize: size * 0.22,
          letterSpacing: "0.42em",
          opacity: 0.55,
          lineHeight: 1,
        }}
      >
        Analytics
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------- */
/*  Display — framed plate version for brand pages                  */
/* ---------------------------------------------------------------- */
export function LogoDisplay({ size = 80, className }: LogoBaseProps) {
  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <div className="relative" style={{ padding: size * 0.5 }}>
        <span className="absolute top-0 left-0 w-3 h-3 border-l border-t border-current opacity-30" />
        <span className="absolute top-0 right-0 w-3 h-3 border-r border-t border-current opacity-30" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-current opacity-30" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-current opacity-30" />
        <LogoWordmark size={size} />
      </div>
      <span
        className="font-mono uppercase mt-4"
        style={{
          fontSize: size * 0.13,
          letterSpacing: "0.42em",
          opacity: 0.5,
        }}
      >
        Nexura Analytics — Est. MMXXVI
      </span>
    </div>
  );
}
