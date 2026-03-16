import { useState } from "react";

export default function AuditForm({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) { setError("Please enter a URL"); return; }
    try {
      const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      setError("");
      onSubmit(parsed.toString());
    } catch {
      setError("Please enter a valid URL (e.g. https://example.com)");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 580, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          autoFocus
          style={{
            flex: 1, minWidth: 240,
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
            padding: "13px 16px", color: "var(--text)", fontSize: 15,
            outline: "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        />
        <button
          type="submit"
          style={{
            background: "linear-gradient(135deg, #6C63FF, #4B3DFF)",
            border: "none", borderRadius: 10, padding: "13px 24px",
            color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Run Audit →
        </button>
      </div>
      {error && <p style={{ color: "#F87171", fontSize: 13, marginTop: 8 }}>{error}</p>}
      <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 12, textAlign: "center" }}>
        Works on any public URL — no login or configuration required.
      </p>
    </form>
  );
}
