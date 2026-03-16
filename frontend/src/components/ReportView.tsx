import type { AuditReport } from "../types";
import ScoreGauge from "./ScoreGauge";
import CategoryGrid from "./CategoryGrid";
import FindingsPanel from "./FindingsPanel";
import RecommendationsPanel from "./RecommendationsPanel";

const card: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 16, padding: "24px 28px", marginBottom: 20,
};

export default function ReportView({ report }: { report: AuditReport }) {
  const domain = new URL(report.url).hostname;
  const date = new Date(report.audited_at).toLocaleString();

  return (
    <div>
      {/* Header */}
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Martech Audit Report</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{domain}</h2>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>{report.url}</p>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>Audited {date} · {(report.elapsed_ms / 1000).toFixed(1)}s</p>
        </div>
        <ScoreGauge score={report.stack_score} label={report.score_label} rationale={report.score_rationale} />
      </div>

      {/* Categories */}
      <div style={card}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Stack Overview</h3>
        <CategoryGrid categories={report.categories} />
      </div>

      {/* Findings */}
      {report.findings.length > 0 && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Findings</h3>
          <FindingsPanel findings={report.findings} />
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Recommendations</h3>
          <RecommendationsPanel recommendations={report.recommendations} />
        </div>
      )}

      {/* Raw signals */}
      <div style={{ ...card, padding: "16px 24px" }}>
        <p style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Signal Coverage</p>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            ["Scripts detected", report.raw_signals.total_scripts],
            ["Network requests", report.raw_signals.total_network_requests],
            ["Cookies", report.raw_signals.total_cookies],
            ["DataLayer present", report.raw_signals.has_data_layer ? "Yes" : "No"],
          ].map(([label, val]) => (
            <div key={String(label)}>
              <p style={{ color: "var(--muted)", fontSize: 11 }}>{label}</p>
              <p style={{ fontWeight: 600, fontSize: 16 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
