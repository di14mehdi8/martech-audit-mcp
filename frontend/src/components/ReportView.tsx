import type { AuditReport } from "../types";
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

      {/* Evidence */}
      {report.evidence.length > 0 && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Evidence</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {report.evidence.map((item) => (
              <div key={`${item.name}-${item.method}-${item.evidence}`} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", background: "var(--elevated)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</p>
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>{item.category} · {item.method} · {item.confidence} confidence</p>
                  </div>
                  {item.version && (
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>v{item.version}</span>
                  )}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)", wordBreak: "break-all" }}>
                  {item.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LLM Summary */}
      {report.llm?.summary && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>LLM Summary (Evidence-Grounded)</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>{report.llm.summary.summary}</p>

          {report.llm.summary.key_observations.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Key observations</p>
              <div style={{ display: "grid", gap: 8 }}>
                {report.llm.summary.key_observations.map((obs, idx) => (
                  <div key={`${obs.text}-${idx}`} style={{ fontSize: 12, color: "var(--muted)" }}>
                    {obs.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.llm.summary.risk_flags.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Risk flags</p>
              <div style={{ display: "grid", gap: 8 }}>
                {report.llm.summary.risk_flags.map((flag, idx) => (
                  <div key={`${flag.text}-${idx}`} style={{ fontSize: 12, color: "var(--muted)" }}>
                    [{flag.severity}] {flag.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.llm.summary.limitations.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Limitations</p>
              <div style={{ display: "grid", gap: 6 }}>
                {report.llm.summary.limitations.map((lim, idx) => (
                  <div key={`${lim}-${idx}`} style={{ fontSize: 12, color: "var(--muted)" }}>
                    {lim}
                  </div>
                ))}
              </div>
            </div>
          )}
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
