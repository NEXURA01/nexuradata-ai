import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Browser tab icon — the Nexus Mark.
 * Two pillars, one tensioned diagonal, a red node at the nexus point.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#EDE7DA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="48" height="48" viewBox="0 0 100 100">
          <rect x="16" y="14" width="11" height="72" fill="#1A1A1A" />
          <rect x="73" y="14" width="11" height="72" fill="#1A1A1A" />
          <line
            x1="27" y1="14" x2="73" y2="86"
            stroke="#1A1A1A" strokeWidth="3"
          />
          <circle cx="50" cy="50" r="7" fill="#C8472E" />
          <circle cx="50" cy="50" r="2.5" fill="#EDE7DA" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
