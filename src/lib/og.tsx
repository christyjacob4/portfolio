import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

export function renderOg(title: string, kicker = "christyjacob.dev") {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b0c",
          color: "#f5f3ee",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#a8a49a" }}>
          {kicker}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 60 ? 64 : 80,
            lineHeight: 1.08,
            letterSpacing: -2,
            fontWeight: 700,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#a8a49a" }}>
          Christy Jacob
        </div>
      </div>
    ),
    ogSize,
  );
}
