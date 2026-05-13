const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

/**
 * NEXURA — Brand Mark
 *
 * A circular instrument emblem:
 *  · Hairline bezel (the "quiet mechanism")
 *  · Single elliptical orbit with one agent node (warm red accent)
 *  · Serif "N" letterform at the center
 *  · Cardinal registration marks at 12 / 3 / 6 / 9
 *
 * Use `LogoMark` for the icon alone (favicons, social, small spaces).
 * Use `Logo` for the full lockup (mark + serif wordmark + analytics line).
 */

type LogoProps = {
  className?: string;
  size?: number;
  /** Override the stroke / text color (defaults to currentColor). */
  color?: string;
  /** Override the orbit accent color. Defaults to the brand red. */
  accent?: string;
};

export function LogoMark({
  className,
  size = 32,
  color = "currentColor",
  accent = "#B8412E",
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Outer bezel */}
      <circle cx="50" cy="50" r="46" stroke={color} strokeWidth="0.75" opacity="0.9" />

      {/* Cardinal registration marks (12 / 3 / 6 / 9) */}
      <line x1="50" y1="1" x2="50" y2="6" stroke={color} strokeWidth="0.75" />
      <line x1="99" y1="50" x2="94" y2="50" stroke={color} strokeWidth="0.75" />
      <line x1="50" y1="99" x2="50" y2="94" stroke={color} strokeWidth="0.75" />
      <line x1="1" y1="50" x2="6" y2="50" stroke={color} strokeWidth="0.75" />

      {/* Single elliptical orbit — the "agent path" */}
      <ellipse
        cx="50"
        cy="50"
        rx="38"
        ry="16"
        stroke={accent}
        strokeWidth="0.75"
        transform="rotate(-22 50 50)"
        opacity="0.85"
      />

      {/* Agent node on the orbit */}
      <circle cx="83" cy="38" r="1.6" fill={accent} />

      {/* Center serif N — the letterform anchor */}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontFamily="var(--font-playfair), Georgia, serif"
        fontSize="44"
        fontWeight="400"
        letterSpacing="-0.02em"
      >
        N
      </text>

      {/* Subtle baseline under N */}
      <line x1="42" y1="72" x2="58" y2="72" stroke={color} strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

/**
 * Full horizontal lockup: mark + wordmark + analytics tag.
 * Sized via the mark's `size`; the wordmark scales to match.
 */
export function Logo({
  className,
  size = 36,
  color = "currentColor",
  accent = "#B8412E",
  showTag = true,
}: LogoProps & { showTag?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} color={color} accent={accent} />
      <div className="flex flex-col leading-none">
        <span
          className="font-serif tracking-tight"
          style={{
            fontSize: `${size * 0.62}px`,
            color,
            lineHeight: 1,
          }}
        >
          Nexura
        </span>
        {showTag && (
          <span
            className="font-mono uppercase tracking-[0.22em] mt-1"
            style={{
              fontSize: `${size * 0.22}px`,
              color: accent,
              lineHeight: 1,
            }}
          >
            Analytics
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact monospace wordmark — for places where the serif feels too editorial.
 * Used by the fixed header.
 */
export function LogoWordmark({
  className,
  size = 14,
  color = "currentColor",
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size * 1.6} color={color} />
      <span
        className="font-mono font-semibold tracking-[0.28em] uppercase"
        style={{
          fontSize: `${size}px`,
          color,
          lineHeight: 1,
        }}
      >
        Nexura
      </span>
    </div>
  );
}
