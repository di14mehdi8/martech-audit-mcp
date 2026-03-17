export type Severity = "critical" | "warning" | "info";

export interface ToolChip {
  name: string;
  confidence: "high" | "medium" | "low";
  method: string;
  config?: Record<string, unknown>;
}

export interface ToolEvidence extends ToolChip {
  category: string;
  evidence: string;
  version?: string;
}

export interface CategoryReport {
  name: string;
  key: string;
  tools: ToolChip[];
  is_covered: boolean;
}

export interface Finding {
  severity: Severity;
  title: string;
  detail: string;
}

export interface Recommendation {
  priority: 1 | 2 | 3;
  title: string;
  rationale: string;
  category: string;
}

export interface RawSignals {
  total_scripts: number;
  total_network_requests: number;
  total_cookies: number;
  has_data_layer: boolean;
}

export interface LlmSummary {
  summary: string;
  key_observations: Array<{ text: string; evidence: string[] }>;
  risk_flags: Array<{ severity: Severity; text: string; evidence: string[] }>;
  limitations: string[];
}

export interface LlmReport {
  status: { status: "disabled" | "ok" | "invalid" | "error"; model?: string; error?: string };
  summary?: LlmSummary;
}

export interface AuditReport {
  url: string;
  audited_at: string;
  elapsed_ms: number;
  categories: CategoryReport[];
  evidence: ToolEvidence[];
  raw_signals: RawSignals;
  findings: Finding[];
  recommendations: Recommendation[];
  llm?: LlmReport;
}
