import type { DetectedTool } from "../detectors/types.js";
import type { AuditReport, Finding, LlmReport, LlmSummary, RawSignals, Recommendation, Severity } from "./report-formatter.js";

const DEFAULT_MODEL = "gemini-3.1-flash-lite-preview";
const API_ROOT = "https://generativelanguage.googleapis.com/v1beta";

const LLM_SKILLS = [
  "Evidence-first: every claim must cite evidence strings from the input.",
  "No hallucinations: do not invent tools, vendors, or configurations not present in the input.",
  "Precision over speculation: if uncertain, mark it as a limitation.",
  "Ultra-thorough: cover coverage gaps, signal quality, and redundancies when supported by evidence.",
];

const BASE_LIMITATIONS = [
  "Detection is limited to client-side signals captured during a single headless crawl.",
  "Server-side tags, backend integrations, and blocked/consent-gated scripts may not be observable.",
  "Results reflect the audited URL only and may not represent the full site.",
];

type GeminiPayload = {
  tools: DetectedTool[];
  findings: Finding[];
  recommendations: Recommendation[];
  rawSignals: RawSignals;
  url: string;
  auditedAt: string;
};

function buildEvidenceCatalog(tools: DetectedTool[], rawSignals: RawSignals): string[] {
  const evidence = new Set<string>();
  for (const tool of tools) {
    evidence.add(tool.evidence);
  }
  evidence.add(`raw:total_scripts=${rawSignals.total_scripts}`);
  evidence.add(`raw:total_network_requests=${rawSignals.total_network_requests}`);
  evidence.add(`raw:total_cookies=${rawSignals.total_cookies}`);
  evidence.add(`raw:has_data_layer=${rawSignals.has_data_layer}`);
  return Array.from(evidence);
}

function safeJsonParse(text: string): unknown {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenceMatch ? fenceMatch[1] : text;
  return JSON.parse(jsonText);
}

function validateSummary(summary: LlmSummary, allowedEvidence: Set<string>): LlmSummary {
  const sanitizeEvidence = (items: string[]) => items.filter((e) => allowedEvidence.has(e));

  const key_observations = (summary.key_observations ?? [])
    .map((item) => ({
      text: item.text?.trim() ?? "",
      evidence: sanitizeEvidence(item.evidence ?? []),
    }))
    .filter((item) => item.text && item.evidence.length > 0);

  const risk_flags = (summary.risk_flags ?? [])
    .map((item) => ({
      severity: (item.severity ?? "info") as Severity,
      text: item.text?.trim() ?? "",
      evidence: sanitizeEvidence(item.evidence ?? []),
    }))
    .filter((item) => item.text && item.evidence.length > 0);

  const limitations = Array.from(new Set([...(summary.limitations ?? []), ...BASE_LIMITATIONS]))
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    summary: summary.summary?.trim() ?? "",
    key_observations,
    risk_flags,
    limitations,
  };
}

function buildPrompt(payload: GeminiPayload, evidenceCatalog: string[]): string {
  const toolNames = payload.tools.map((t) => t.name);
  const compactTools = payload.tools.map((t) => ({
    name: t.name,
    category: t.category,
    confidence: t.confidence,
    method: t.method,
    evidence: t.evidence,
    version: t.version ?? null,
    config: t.config ?? null,
  }));

  return [
    "You are a martech audit analyst. Output ONLY valid JSON.",
    "",
    "SKILLS:",
    ...LLM_SKILLS.map((s) => `- ${s}`),
    "",
    "RULES:",
    "- Use only the data provided below.",
    "- Do not mention tools not in ALLOWED_TOOLS.",
    "- Every observation or risk must cite at least one evidence string from EVIDENCE_CATALOG.",
    "- If you cannot support a point with evidence, omit it.",
    "- Do not add new recommendations beyond the provided recommendations list.",
    "",
    "OUTPUT_SCHEMA:",
    "{",
    '  "summary": "2-4 sentences, grounded in evidence",',
    '  "key_observations": [{"text": "...", "evidence": ["..."]}],',
    '  "risk_flags": [{"severity": "critical|warning|info", "text": "...", "evidence": ["..."]}],',
    '  "limitations": ["..."]',
    "}",
    "",
    `URL: ${payload.url}`,
    `AUDITED_AT: ${payload.auditedAt}`,
    "",
    `ALLOWED_TOOLS: ${JSON.stringify(toolNames)}`,
    "",
    `TOOLS: ${JSON.stringify(compactTools)}`,
    "",
    `FINDINGS: ${JSON.stringify(payload.findings)}`,
    "",
    `RECOMMENDATIONS: ${JSON.stringify(payload.recommendations)}`,
    "",
    `RAW_SIGNALS: ${JSON.stringify(payload.rawSignals)}`,
    "",
    `EVIDENCE_CATALOG: ${JSON.stringify(evidenceCatalog)}`,
  ].join("\n");
}

export async function generateGeminiSummary(payload: GeminiPayload): Promise<LlmReport> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { status: { status: "disabled", error: "GEMINI_API_KEY not set" } };
  }

  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const evidenceCatalog = buildEvidenceCatalog(payload.tools, payload.rawSignals);
  const prompt = buildPrompt(payload, evidenceCatalog);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(`${API_ROOT}/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 800,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      return { status: { status: "error", model, error: `Gemini API error: ${res.status} ${text}` } };
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return { status: { status: "invalid", model, error: "Empty response from Gemini" } };
    }

    const parsed = safeJsonParse(text) as LlmSummary;
    const validated = validateSummary(parsed, new Set(evidenceCatalog));

    if (!validated.summary) {
      return { status: { status: "invalid", model, error: "Summary missing after validation" } };
    }

    return { status: { status: "ok", model }, summary: validated };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { status: { status: "error", model, error: message } };
  } finally {
    clearTimeout(timeout);
  }
}

export function attachLlmReport(report: AuditReport, llm: LlmReport): AuditReport {
  return { ...report, llm };
}
