"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function OrbitalDiagram() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full aspect-square" />;
  }

  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full overflow-visible"
      >
        {/* Outer dashed guide circle */}
        <circle 
          cx="200" 
          cy="200" 
          r="180" 
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="4 4"
          className="text-foreground/20"
        />

        {/* Tick marks around the circle - like a watch bezel */}
        {Array.from({ length: 72 }).map((_, i) => {
          const angle = (i * 5 * Math.PI) / 180;
          const isMajor = i % 6 === 0;
          const innerR = isMajor ? 168 : 172;
          const outerR = 180;
          return (
            <line
              key={i}
              x1={200 + innerR * Math.cos(angle)}
              y1={200 + innerR * Math.sin(angle)}
              x2={200 + outerR * Math.cos(angle)}
              y2={200 + outerR * Math.sin(angle)}
              stroke="currentColor"
              strokeWidth={isMajor ? "1" : "0.5"}
              className="text-foreground/30"
            />
          );
        })}

        {/* Registration marks at corners */}
        <g stroke="currentColor" strokeWidth="0.5" className="text-foreground/40">
          <line x1="10" y1="10" x2="30" y2="10" />
          <line x1="10" y1="10" x2="10" y2="30" />
          <line x1="390" y1="10" x2="370" y2="10" />
          <line x1="390" y1="10" x2="390" y2="30" />
          <line x1="10" y1="390" x2="30" y2="390" />
          <line x1="10" y1="390" x2="10" y2="370" />
          <line x1="390" y1="390" x2="370" y2="390" />
          <line x1="390" y1="390" x2="390" y2="370" />
        </g>

        {/* Main orbit ellipses */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="[transform-origin:200px_200px]"
        >
          {/* Ellipse 1 - outermost tilted */}
          <ellipse
            cx="200"
            cy="200"
            rx="140"
            ry="70"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            className="text-foreground/40"
            transform="rotate(-15 200 200)"
          />
        </motion.g>

        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          className="[transform-origin:200px_200px]"
        >
          {/* Ellipse 2 - opposite tilt */}
          <ellipse
            cx="200"
            cy="200"
            rx="110"
            ry="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            className="text-foreground/35"
            transform="rotate(40 200 200)"
          />
          {/* Orbiting dot */}
          <circle cx="90" cy="200" r="4" className="fill-foreground/60" />
        </motion.g>

        {/* Inner solid circle - the sphere */}
        <circle
          cx="200"
          cy="200"
          r="80"
          fill="currentColor"
          className="text-foreground/15"
        />
        <circle
          cx="200"
          cy="200"
          r="80"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          className="text-foreground/30"
        />

        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="[transform-origin:200px_200px]"
        >
          {/* Inner dashed ellipse */}
          <ellipse
            cx="200"
            cy="200"
            rx="55"
            ry="25"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="3 3"
            className="text-foreground/30"
            transform="rotate(-50 200 200)"
          />
        </motion.g>

        {/* Small inner rings */}
        <circle
          cx="200"
          cy="200"
          r="30"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-foreground/25"
        />
        <circle
          cx="200"
          cy="200"
          r="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          className="text-foreground/20"
        />

        {/* Center point */}
        <circle cx="200" cy="200" r="3" className="fill-foreground" />
        <circle
          cx="200"
          cy="200"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-foreground/40"
        />

        {/* Orbiting dots */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="[transform-origin:200px_200px]"
        >
          <circle cx="280" cy="200" r="5" className="fill-foreground" />
        </motion.g>

        {/* Node annotations - positioned exactly like your image */}
        <g className="fill-foreground font-mono text-[9px] tracking-[0.1em]">
          {/* N-01 INGEST - right side */}
          <text x="320" y="170" textAnchor="start">N-01</text>
          <text x="320" y="182" textAnchor="start" className="fill-foreground/60 text-[7px] tracking-[0.15em]">
            INGEST
          </text>
          <text x="320" y="194" textAnchor="start" className="fill-foreground/40 text-[6px] tracking-[0.12em]">
            DATA / EVENTS / CALLS
          </text>
          
          {/* N-02 REASON - bottom left */}
          <text x="60" y="320" textAnchor="start">N-02</text>
          <text x="60" y="332" textAnchor="start" className="fill-foreground/60 text-[7px] tracking-[0.15em]">
            REASON
          </text>
          <text x="60" y="344" textAnchor="start" className="fill-foreground/40 text-[6px] tracking-[0.12em]">
            MODELS / RULES / TOOLS
          </text>
        </g>
      </svg>
    </div>
  );
}
