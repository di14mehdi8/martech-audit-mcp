export type ScoreLabel = "Well-Instrumented" | "Functional with Gaps" | "Needs Attention" | "Critical Gaps";
export type Severity = "critical" | "warning" | "info";

export interface ToolChip {
  name: string;
  confidence: "high" | "medium" | "low";
  method: string;
  config?: Record<string, unknown>;
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

export interface AuditReport {
  url: string;
  audited_at: string;
  elapsed_ms: number;
  stack_score: number;
  score_label: ScoreLabel;
  score_rationale: string;
  categories: CategoryReport[];
  raw_signals: RawSignals;
  findings: Finding[];
  recommendations: Recommendation[];
}
