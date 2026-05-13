"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function OrbitalDiagram() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full" />;
  }

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        {/* Registration marks at corners */}
        <g className="registration-mark">
          <line x1="30" y1="30" x2="50" y2="30" />
          <line x1="30" y1="30" x2="30" y2="50" />
          <line x1="370" y1="30" x2="350" y2="30" />
          <line x1="370" y1="30" x2="370" y2="50" />
          <line x1="30" y1="370" x2="50" y2="370" />
          <line x1="30" y1="370" x2="30" y2="350" />
          <line x1="370" y1="370" x2="350" y2="370" />
          <line x1="370" y1="370" x2="370" y2="350" />
        </g>

        {/* Center point */}
        <circle cx="200" cy="200" r="3" className="orbit-dot" />
        <circle
          cx="200"
          cy="200"
          r="8"
          fill="none"
          className="orbit-line"
          strokeWidth={0.5}
        />

        {/* Outer dashed circle */}
        <circle cx="200" cy="200" r="160" className="orbit-line-dashed" />

        {/* Main orbit rings */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          {/* Ellipse 1 - tilted */}
          <ellipse
            cx="200"
            cy="200"
            rx="120"
            ry="60"
            className="orbit-line"
            transform="rotate(-20 200 200)"
          />
          {/* Orbiting dot on ellipse 1 */}
          <motion.circle
            cx="320"
            cy="200"
            r="4"
            className="orbit-dot"
            animate={{ rotate: -360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "200px 200px" }}
          />
        </motion.g>

        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          {/* Ellipse 2 - tilted opposite */}
          <ellipse
            cx="200"
            cy="200"
            rx="100"
            ry="45"
            className="orbit-line"
            transform="rotate(35 200 200)"
          />
        </motion.g>

        <defs>
          <radialGradient id="sphereGradient" cx="40%" cy="40%">
            <stop offset="0%" stopColor="oklch(0.60 0.008 75)" />
            <stop offset="100%" stopColor="oklch(0.40 0.008 75)" />
          </radialGradient>
        </defs>

        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          {/* Ellipse 3 - filled sphere */}
          <ellipse
            cx="200"
            cy="200"
            rx="80"
            ry="80"
            fill="url(#sphereGradient)"
            style={{ opacity: 0.5 }}
          />
          {/* Accent dot - now charcoal */}
          <circle cx="280" cy="200" r="5" className="orbit-dot" />
        </motion.g>

        {/* Inner dashed ellipse */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        >
          <ellipse
            cx="200"
            cy="200"
            rx="55"
            ry="30"
            className="orbit-line-dashed"
            transform="rotate(-45 200 200)"
          />
          <circle cx="145" cy="200" r="3" className="orbit-dot" style={{ opacity: 0.5 }} />
        </motion.g>

        {/* Small inner orbit */}
        <circle cx="200" cy="200" r="25" className="orbit-line" strokeWidth={0.5} />

        {/* Technical annotations */}
        <g className="frame-text" fill="currentColor" style={{ fontSize: "8px" }}>
          {/* Top annotation */}
          <text x="200" y="25" textAnchor="middle" className="fill-muted">
            FIG. I · ORCHESTRATION
          </text>
          {/* Right annotation */}
          <g transform="translate(380, 200) rotate(90)">
            <text textAnchor="middle" className="fill-muted">
              N-01 INGEST
            </text>
          </g>
          {/* Bottom annotation */}
          <text x="200" y="385" textAnchor="middle" className="fill-muted">
            N-02 REASON
          </text>
          {/* Left annotation */}
          <g transform="translate(20, 200) rotate(-90)">
            <text textAnchor="middle" className="fill-muted">
              N-03 ACT
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
