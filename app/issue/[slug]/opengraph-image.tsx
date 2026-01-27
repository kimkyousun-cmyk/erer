import { ImageResponse } from "next/og";
import { IssueService } from "@/services/issues/issueService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

function bar(value: number, color: string) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width: "100%"
      }}
    >
      <div
        style={{
          fontSize: 16,
          color: "#c9d2e3",
          textTransform: "uppercase",
          letterSpacing: 1,
          fontWeight: 700
        }}
      >
        {color === "#ff4d4f" ? "Anger" : color === "#f7b500" ? "Humor" : "Division"} · {value}
      </div>
      <div
        style={{
          width: "100%",
          height: 12,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${Math.max(4, value)}%`,
            height: "100%",
            borderRadius: 999,
            background: color
          }}
        />
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: { slug: string } }) {
  const issue = await IssueService.getIssueDetailBySlug(params.slug);

  const title = issue?.title ?? "Emotion Radar";
  const verdict = issue?.verdict.label ?? "Feel the internet";
  const anger = issue?.scores.anger ?? 64;
  const humor = issue?.scores.humor ?? 52;
  const division = issue?.scores.division ?? 71;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "48px 60px",
          background: "#0b0c10",
          color: "#f4f7ff",
          fontFamily: "Inter, system-ui, sans-serif"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 18,
              textTransform: "uppercase",
              letterSpacing: 1.6,
              color: "#9aa4b2",
              fontWeight: 700
            }}
          >
            Emotion Radar
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1.05,
              maxWidth: 980
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#c9d2e3"
            }}
          >
            {verdict}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {bar(anger, "#ff4d4f")}
          {bar(humor, "#f7b500")}
          {bar(division, "#7c5cff")}
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
