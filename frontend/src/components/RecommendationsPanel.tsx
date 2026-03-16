import type { Recommendation } from "../types";

const PRIORITY_STYLE = {
  1: { label: "Priority 1", color: "#6C63FF", bg: "rgba(108,99,255,0.1)", border: "rgba(108,99,255,0.3)" },
  2: { label: "Priority 2", color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
  3: { label: "Priority 3", color: "#6B7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
};

export default function RecommendationsPanel({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {recommendations.map((r, i) => {
        const s = PRIORITY_STYLE[r.priority];
        return (
          <div key={i} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderLeft: `3px solid ${s.color}`, borderRadius: 10, padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ background: s.color, color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{s.label}</span>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</p>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>{r.rationale}</p>
          </div>
        );
      })}
    </div>
  );
}
