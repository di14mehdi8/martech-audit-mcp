import type { Finding } from "../types";

const SEVERITY = {
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", icon: "⚠" },
  warning:  { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", icon: "!" },
  info:     { color: "#3B82F6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", icon: "i" },
};

export default function FindingsPanel({ findings }: { findings: Finding[] }) {
  const order = { critical: 0, warning: 1, info: 2 };
  const sorted = [...findings].sort((a, b) => order[a.severity] - order[b.severity]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sorted.map((f, i) => {
        const s = SEVERITY[f.severity];
        return (
          <div key={i} style={{
            display: "flex", gap: 14, alignItems: "flex-start",
            background: s.bg, border: `1px solid ${s.border}`,
            borderLeft: `3px solid ${s.color}`, borderRadius: 10, padding: "14px 16px",
          }}>
            <span style={{ color: s.color, fontWeight: 700, fontSize: 14, flexShrink: 0, width: 20, textAlign: "center" }}>{s.icon}</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: s.color, marginBottom: 4 }}>{f.title}</p>
              <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>{f.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
