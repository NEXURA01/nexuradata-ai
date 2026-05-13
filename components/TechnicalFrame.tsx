"use client";

interface TechnicalFrameProps {
  number?: string;
  title?: string;
  plate?: string;
  children: React.ReactNode;
  className?: string;
}

export function TechnicalFrame({
  number = "0001",
  title = "QUIET MECHANISM",
  plate = "I",
  children,
  className = "",
}: TechnicalFrameProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Top frame line */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2">
        <span className="font-mono text-[10px] text-muted tracking-widest uppercase">
          NXR · {number} — {title}
        </span>
        <span className="font-mono text-[10px] text-muted tracking-widest uppercase">
          PLATE {plate} / MMXXVI
        </span>
      </div>

      {/* Corner marks */}
      <div className="absolute top-4 left-4 w-3 h-3 border-l border-t border-foreground/20" />
      <div className="absolute top-4 right-4 w-3 h-3 border-r border-t border-foreground/20" />
      <div className="absolute bottom-4 left-4 w-3 h-3 border-l border-b border-foreground/20" />
      <div className="absolute bottom-4 right-4 w-3 h-3 border-r border-b border-foreground/20" />

      {/* Content */}
      <div className="pt-8 pb-8">{children}</div>

      {/* Bottom frame line */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2">
        <span className="font-mono text-[10px] text-muted tracking-widest uppercase">
          NEXURA ANALYTICS · ATELIER
        </span>
        <span className="font-mono text-[10px] text-muted tracking-widest uppercase">
          851 × 315 · COVER
        </span>
      </div>
    </div>
  );
}
