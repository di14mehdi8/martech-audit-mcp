import { useState } from "react";
import type { AuditReport } from "./types";
import AuditForm from "./components/AuditForm";
import ReportView from "./components/ReportView";

type State =
  | { status: "idle" }
  | { status: "loading"; phase: string }
  | { status: "done"; report: AuditReport }
  | { status: "error"; message: string };

const PHASES = ["Launching headless browser...", "Crawling page & intercepting network...", "Analysing martech signals..."];

export default function App() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function runAudit(url: string) {
    setState({ status: "loading", phase: PHASES[0] });

    const phaseTimer1 = setTimeout(() => setState({ status: "loading", phase: PHASES[1] }), 2000);
    const phaseTimer2 = setTimeout(() => setState({ status: "loading", phase: PHASES[2] }), 6000);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);

      if (!res.ok) {
        const err = await res.json() as { error: string };
        setState({ status: "error", message: err.error ?? "Audit failed." });
        return;
      }

      const report = await res.json() as AuditReport;
      setState({ status: "done", report });
    } catch {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      setState({ status: "error", message: "Could not reach the audit server. Please try again." });
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: "1px solid var(--border)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: "var(--text)" }}>
          <span style={{ color: "var(--primary)" }}>M</span> MardiLabs
        </span>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>/ Martech Stack Auditor</span>
      </header>

      <main style={{ flex: 1, maxWidth: 900, margin: "0 auto", padding: "48px 24px", width: "100%" }}>
        {state.status !== "done" && (
          <div style={{ marginBottom: 48, textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
              What's in your<br />
              <span style={{ color: "var(--primary)" }}>martech stack?</span>
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              Enter any URL and get a structured audit of every tracking tool, analytics platform, and martech signal on that page.
            </p>
          </div>
        )}

        {state.status === "idle" && <AuditForm onSubmit={runAudit} />}

        {state.status === "loading" && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 48, height: 48, border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", margin: "0 auto 24px", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: "var(--muted)", fontSize: 15 }}>{state.phase}</p>
          </div>
        )}

        {state.status === "error" && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "20px 24px", maxWidth: 560, margin: "0 auto" }}>
            <p style={{ color: "#F87171", fontWeight: 600, marginBottom: 8 }}>Audit failed</p>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>{state.message}</p>
            <button onClick={() => setState({ status: "idle" })} style={{ marginTop: 16, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
              Try again
            </button>
          </div>
        )}

        {state.status === "done" && (
          <>
            <ReportView report={state.report} />
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <button onClick={() => setState({ status: "idle" })} style={{ background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text)", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
                Audit another URL
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
