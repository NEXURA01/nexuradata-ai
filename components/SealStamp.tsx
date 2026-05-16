export function SealStamp() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-24 h-24 opacity-85"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer wax seal shape */}
      <circle cx="100" cy="100" r="95" fill="#c17c45" />

      {/* Inner ring */}
      <circle cx="100" cy="100" r="85" fill="none" stroke="#a7643a" strokeWidth="1.5" />

      {/* Decorative circle ring */}
      <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(245, 247, 250, 0.3)" strokeWidth="0.8" />

      {/* Center decorative elements */}
      <g opacity="0.4">
        {/* Top dot */}
        <circle cx="100" cy="35" r="2.5" fill="rgba(245, 247, 250, 0.6)" />
        {/* Bottom dot */}
        <circle cx="100" cy="165" r="2.5" fill="rgba(245, 247, 250, 0.6)" />
        {/* Left dot */}
        <circle cx="35" cy="100" r="2.5" fill="rgba(245, 247, 250, 0.6)" />
        {/* Right dot */}
        <circle cx="165" cy="100" r="2.5" fill="rgba(245, 247, 250, 0.6)" />
      </g>

      {/* Central "N" letter */}
      <text
        x="100"
        y="115"
        fontSize="72"
        fontWeight="bold"
        fontFamily="'Inter Tight', 'Satoshi', serif"
        fill="rgba(245, 247, 250, 0.85)"
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="-0.02em"
      >
        N
      </text>

      {/* Subtle shadow/3D effect */}
      <defs>
        <filter id="seal-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.3" />
        </filter>
      </defs>
    </svg>
  );
}
