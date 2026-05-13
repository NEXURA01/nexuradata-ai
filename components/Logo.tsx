"use client";

const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

interface LogoBaseProps {
  size?: number;
  className?: string;
}

const markSizeClass = (size: number) => {
  if (size <= 22) return "h-5 w-5";
  if (size <= 28) return "h-7 w-7";
  if (size <= 36) return "h-9 w-9";
  if (size <= 56) return "h-12 w-12";
  if (size <= 90) return "h-20 w-20";
  return "h-24 w-24";
};

/* ---------------------------------------------------------------- */
/*  The Aperture — primary symbol                                   */
/* ---------------------------------------------------------------- */
export function LogoMark({ size = 32, className }: LogoBaseProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Nexura"
      className={cn("inline-block shrink-0 text-current", markSizeClass(size), className)}
    >
      <rect
        x="7"
        y="7"
        width="50"
        height="50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
      />
      <rect x="25" y="25" width="14" height="14" fill="currentColor" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/*  Compact wordmark — header / nav                                 */
/* ---------------------------------------------------------------- */
export function LogoWordmark({ size = 28, className }: LogoBaseProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark size={size * 1.15} />
      <span className="font-serif text-[30px] font-semibold leading-none tracking-normal sm:text-[38px] lg:text-[42px]">
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
        <span className="font-serif text-[44px] font-semibold leading-none tracking-normal">
          Nexura
        </span>
        <span className="mt-2 font-mono text-[9px] uppercase leading-none tracking-[0.4em] opacity-[0.55]">
          Operational Intelligence Infrastructure
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
        <span className="font-serif text-[55px] font-semibold leading-none tracking-normal">
          Nexura
        </span>
        <div className="flex items-center gap-4">
          <span className="block h-px w-[35px] bg-current opacity-[0.35]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.45em] opacity-60">
            Operational Command Systems
          </span>
          <span className="block h-px w-[35px] bg-current opacity-[0.35]" />
        </div>
      </div>
    </div>
  );
}
