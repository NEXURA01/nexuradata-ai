import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Browser tab icon — the Punctum Mark.
 * Two pillars · hairline diagonal · a solid square at the meeting point.
 * Pure monochrome.
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
        <svg width="52" height="52" viewBox="0 0 100 100">
          <rect x="14" y="12" width="10" height="76" fill="#1A1A1A" />
          <rect x="76" y="12" width="10" height="76" fill="#1A1A1A" />
          <line
            x1="24" y1="12" x2="76" y2="88"
            stroke="#1A1A1A" strokeWidth="2"
          />
          <rect x="44" y="44" width="12" height="12" fill="#1A1A1A" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
