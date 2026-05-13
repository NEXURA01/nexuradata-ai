import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Browser tab icon — the "N." monogram.
 * Same mark, same red signal, nothing else.
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
          fontFamily: "Georgia, serif",
          fontSize: 48,
          color: "#1A1A1A",
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        <span style={{ display: "flex", alignItems: "baseline" }}>
          N<span style={{ color: "#B8412E", marginLeft: 1 }}>.</span>
        </span>
      </div>
    ),
    { ...size },
  );
}
