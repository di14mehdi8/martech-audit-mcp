import type { CategoryReport } from "../types";

const CONFIDENCE_COLOR = { high: "#10B981", medium: "#F59E0B", low: "#6B7280" };

const CATEGORY_COLOR: Record<string, string> = {
  tag_management: "#6C63FF", analytics: "#3B82F6", crm: "#10B981",
  cdp: "#8B5CF6", email_marketing: "#EC4899", advertising: "#F59E0B",
  live_chat: "#06B6D4", heatmaps: "#F97316", a_b_testing: "#84CC16",
  consent: "#EF4444", personalization: "#14B8A6", unknown: "#6B7280",
};

function ToolChip({ tool }: { tool: CategoryReport["tools"][0] }) {
  const configStr = tool.config ? Object.values(tool.config)[0] : null;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "var(--elevated)", border: "1px solid var(--border)",
      borderRadius: 20, padding: "5px 10px", fontSize: 12,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: CONFIDENCE_COLOR[tool.confidence], flexShrink: 0 }} />
      <span style={{ fontWeight: 500 }}>{tool.name}</span>
      {configStr && <span style={{ color: "var(--muted)", fontSize: 11 }}>{String(configStr)}</span>}
    </div>
  );
}

export default function CategoryGrid({ categories }: { categories: CategoryReport[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
      {categories.map((cat) => (
        <div key={cat.key} style={{
          background: "var(--elevated)", borderRadius: 12, padding: "14px 16px",
          border: `1px solid ${cat.is_covered ? `${CATEGORY_COLOR[cat.key]}30` : "var(--border)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.is_covered ? CATEGORY_COLOR[cat.key] : "var(--muted)", flexShrink: 0 }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: cat.is_covered ? "var(--text)" : "var(--muted)" }}>{cat.name}</p>
          </div>
          {cat.is_covered ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cat.tools.map((t) => <ToolChip key={t.name} tool={t} />)}
            </div>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: 12, fontStyle: "italic" }}>Not detected</p>
          )}
        </div>
      ))}
    </div>
  );
}
