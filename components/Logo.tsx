"use client";

import type { CSSProperties } from "react";

const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

/**
 * NEXURA — The Locator Mark
 * ----------------------------------------------------------------
 * The mark IS the business.
 *
 * Two squares. One frame. One point inside it.
 * The outer square is the system — your company, your operations.
 * The inner solid square is what NEXURA reveals — the constraint,
 * the bottleneck, the exact point where intelligence is missing.
 *
 * Symbol semantics:
 *   • Outer hairline square → the operational system
 *   • Inner solid square    → the located insight
 *   • Asymmetric placement  → constraint never sits in the center
 *
 * Monochrome only. No red. No fluff. No decoration.
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
      {/* Outer square — the system. Hairline, precision-instrument.    */}
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Inner solid square — the located constraint.                   */}
      {/* Offset down-right deliberately: insights are never centered.   */}
      <rect
        x="34"
        y="34"
        width="22"
        height="22"
        fill="currentColor"
      />
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
