import { ImageResponse } from "next/og";

// The preview card people see when the link is shared on WhatsApp, Instagram or LinkedIn.
export const alt = "AI Client Finder - find local businesses that need a website";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "linear-gradient(135deg, #2e1065 0%, #6d28d9 55%, #7c3aed 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "22px",
              background: "rgba(255,255,255,0.15)",
              border: "3px solid rgba(255,255,255,0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            AI
          </div>
          <div style={{ fontSize: "34px", fontWeight: 600, letterSpacing: "-0.5px" }}>AI Client Finder</div>
        </div>

        <div
          style={{
            marginTop: "48px",
            fontSize: "76px",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-2px",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          Find local businesses that need a website
        </div>

        <div style={{ marginTop: "32px", fontSize: "32px", color: "rgba(255,255,255,0.82)", lineHeight: 1.4 }}>
          Search any city, score the hottest leads, pitch them on WhatsApp.
        </div>

        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "16px", fontSize: "26px", color: "rgba(255,255,255,0.7)" }}>
          aiclientfinderapp.com
        </div>
      </div>
    ),
    size,
  );
}
