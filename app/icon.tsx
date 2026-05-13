import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Browser tab icon — The Aperture Mark.
 * A lens focused on a single point of insight.
 * The mark = the business: "See what's limiting your company."
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
        <svg width="56" height="56" viewBox="0 0 64 64">
          {/* Outer ring */}
          <circle
            cx="32" cy="32" r="30"
            stroke="#1A1A1A" strokeWidth="1.5"
            fill="none" opacity="0.5"
          />
          {/* Top blade */}
          <path d="M32 7 L48 29 L16 29 Z" fill="#1A1A1A" />
          {/* Bottom blade */}
          <path d="M32 57 L16 35 L48 35 Z" fill="#1A1A1A" />
          {/* Focal point */}
          <rect x="29.5" y="29.5" width="5" height="5" fill="#1A1A1A" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
