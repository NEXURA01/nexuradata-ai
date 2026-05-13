"use client";

import type { CSSProperties } from "react";

const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

/**
 * NEXURA — The Aperture Mark
 * ----------------------------------------------------------------
 * The mark IS the business.
 *
 * NEXURA reveals what limits companies. The logo is a literal
 * aperture — a lens focused on a single point of insight.
 * Two opposing blades form an iris around a focal square.
 *
 * Symbol semantics:
 *   • Aperture        → "See what's limiting your company"
 *   • Focal square    → the insight, the bottleneck exposed
 *   • Outer ring      → instrument-grade precision
 *   • Bold geometry   → operational, not decorative
 *
 * Monochrome only. No red. No fluff.
 * ----------------------------------------------------------------
 */

interface LogoBaseProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/* ---------------------------------------------------------------- */
/*  The Aperture — primary symbol                                   */
/* ---------------------------------------------------------------- */
export function LogoMark({ size = 32, className, style }: LogoBaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Nexura"
      className={cn("inline-block shrink-0", className)}
      style={style}
    >
      {/* Outer instrument ring — hairline, registration grade.          */}
      <circle
        cx="32"
        cy="32"
        r="30"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
        fill="none"
      />

      {/* Aperture blades — two opposing triangles forming an iris       */}
      {/* converging on the focal point. The space between them is the   */}
      {/* lens opening — the "field of view".                            */}
      <path d="M32 7 L48 29 L16 29 Z" fill="currentColor" />
      <path d="M32 57 L16 35 L48 35 Z" fill="currentColor" />

      {/* Focal point — the insight at center.                           */}
      <rect x="29.5" y="29.5" width="5" height="5" fill="currentColor" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/*  Compact wordmark — header / nav                                 */
/* ---------------------------------------------------------------- */
export function LogoWordmark({ size = 28, className }: LogoBaseProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size * 1.15} />
      <span
        className="font-serif leading-none"
        style={{
          fontSize: size,
          letterSpacing: "-0.025em",
          fontWeight: 500,
        }}
      >
        Nexura
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Full editorial lockup — footer / brand surfaces                 */
/* ---------------------------------------------------------------- */
export function Logo({ size = 44, className }: LogoBaseProps) {
  return (
    <div className={cn("inline-flex items-center gap-4", className)}>
      <LogoMark size={size * 1.1} />
      <div className="flex flex-col">
        <span
          className="font-serif leading-none"
          style={{
            fontSize: size,
            letterSpacing: "-0.025em",
            fontWeight: 500,
          }}
        >
          Nexura
        </span>
        <span
          className="font-mono uppercase mt-2"
          style={{
            fontSize: size * 0.2,
            letterSpacing: "0.4em",
            opacity: 0.55,
            lineHeight: 1,
          }}
        >
          Operational Intelligence
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Hero display lockup — landing plates                            */
/* ---------------------------------------------------------------- */
export function LogoDisplay({ size = 100, className }: LogoBaseProps) {
  return (
    <div className={cn("inline-flex flex-col items-center gap-8", className)}>
      <LogoMark size={size} />
      <div className="flex flex-col items-center gap-4">
        <span
          className="font-serif leading-none"
          style={{
            fontSize: size * 0.55,
            letterSpacing: "-0.028em",
            fontWeight: 500,
          }}
        >
          Nexura
        </span>
        <div className="flex items-center gap-4">
          <span
            className="block bg-current"
            style={{ width: size * 0.35, height: 1, opacity: 0.35 }}
          />
          <span
            className="font-mono uppercase"
            style={{
              fontSize: size * 0.09,
              letterSpacing: "0.45em",
              opacity: 0.6,
            }}
          >
            Operational Intelligence
          </span>
          <span
            className="block bg-current"
            style={{ width: size * 0.35, height: 1, opacity: 0.35 }}
          />
        </div>
      </div>
    </div>
  );
}
