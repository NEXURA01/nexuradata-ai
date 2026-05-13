import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Browser tab icon — The Locator Mark.
 * Two concentric squares: outer system, inner intelligence core.
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
        <svg width="52" height="52" viewBox="0 0 64 64">
          {/* Outer hairline square — the system */}
          <rect
            x="4" y="4" width="56" height="56"
            stroke="#1A1A1A" strokeWidth="3"
            fill="none"
          />
          {/* Inner solid square — the intelligence core, concentric */}
          <rect
            x="21" y="21" width="22" height="22"
            fill="#1A1A1A"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
