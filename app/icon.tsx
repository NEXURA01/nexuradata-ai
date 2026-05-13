import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Browser tab icon — a compact version of the NEXURA mark.
 * Uses a serif "N" inside the bezel with a single red orbit node.
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
          position: "relative",
          borderRadius: 8,
        }}
      >
        {/* Bezel ring */}
        <div
          style={{
            position: "absolute",
            inset: 4,
            border: "1.5px solid #1a1a1a",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
        {/* Orbit accent dot, top-right */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            width: 5,
            height: 5,
            background: "#B8412E",
            borderRadius: "50%",
          }}
        />
        {/* Serif N */}
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 40,
            fontWeight: 400,
            color: "#1a1a1a",
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          N
        </span>
      </div>
    ),
    { ...size }
  );
}
