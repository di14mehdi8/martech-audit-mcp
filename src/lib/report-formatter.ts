import type { DetectedTool, ToolCategory } from "../detectors/types.js";

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
  key: ToolCategory;
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
  category: ToolCategory;
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

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  tag_management: "Tag Management",
  analytics: "Analytics",
  crm: "CRM",
  cdp: "CDP",
  email_marketing: "Email & Marketing Automation",
  advertising: "Advertising & Pixels",
  live_chat: "Live Chat",
  heatmaps: "Heatmaps & Session Recording",
  a_b_testing: "A/B Testing",
  personalization: "Personalization",
  consent: "Consent Management",
  unknown: "Other",
};

const CORE_CATEGORIES: ToolCategory[] = ["tag_management", "analytics", "crm", "consent"];

export function formatReport(
  url: string,
  tools: DetectedTool[],
  rawSignals: RawSignals,
  elapsed_ms: number
): AuditReport {
  const categories = buildCategories(tools);
  const findings = generateFindings(tools);
  const { score, label, rationale } = calculateScore(tools, findings);
  const recommendations = generateRecommendations(findings, tools);

  return {
    url,
    audited_at: new Date().toISOString(),
    elapsed_ms,
    stack_score: score,
    score_label: label,
    score_rationale: rationale,
    categories,
    raw_signals: rawSignals,
    findings,
    recommendations,
  };
}

function buildCategories(tools: DetectedTool[]): CategoryReport[] {
  const allCategories = new Set<ToolCategory>([
    ...CORE_CATEGORIES,
    ...tools.map((t) => t.category).filter((c) => c !== "unknown"),
  ]);

  return Array.from(allCategories).map((key) => {
    const categoryTools = tools.filter((t) => t.category === key);
    return {
      name: CATEGORY_LABELS[key],
      key,
      tools: categoryTools.map((t) => ({
        name: t.name,
        confidence: t.confidence,
        method: t.method,
        config: t.config,
      })),
      is_covered: categoryTools.length > 0,
    };
  });
}

function generateFindings(tools: DetectedTool[]): Finding[] {
  const findings: Finding[] = [];
  const hasCategory = (cat: ToolCategory) => tools.some((t) => t.category === cat);
  const hasName = (name: string) => tools.some((t) => t.name.toLowerCase().includes(name.toLowerCase()));

  if (!hasCategory("analytics")) {
    findings.push({
      severity: "critical",
      title: "No analytics tool detected",
      detail: "No web analytics platform was found. You have zero visibility into traffic, user behavior, or conversion performance.",
    });
  }

  if (hasName("Google Tag Manager") && !hasName("Google Analytics")) {
    findings.push({
      severity: "critical",
      title: "GTM present but no GA4 detected",
      detail: "A GTM container is firing but no GA4 configuration tag was found. Data collection may be broken or misconfigured inside the container.",
    });
  }

  if (!hasCategory("consent") && (hasCategory("advertising") || hasName("Meta Pixel") || hasName("Google Ads"))) {
    findings.push({
      severity: "critical",
      title: "Advertising pixels active with no consent management",
      detail: "Meta Pixel and/or Google Ads conversion tags are firing with no cookie consent platform detected — potential GDPR and CCPA exposure.",
    });
  }

  if (!hasCategory("consent")) {
    findings.push({
      severity: "warning",
      title: "No consent management platform detected",
      detail: "No cookie consent tool (OneTrust, Cookiebot, Osano, etc.) was found. This may indicate a compliance gap depending on your audience geography.",
    });
  }

  if (!hasCategory("tag_management")) {
    findings.push({
      severity: "warning",
      title: "No tag management system detected",
      detail: "Tags appear to be hardcoded directly. A TMS like GTM enables faster deployments, version control, and reduced developer dependency.",
    });
  }

  const analyticsTools = tools.filter((t) => t.category === "analytics");
  if (analyticsTools.length >= 3) {
    findings.push({
      severity: "warning",
      title: `${analyticsTools.length} analytics tools detected`,
      detail: `${analyticsTools.map((t) => t.name).join(", ")} are all active. Review whether each is actively used — duplicate tools inflate page weight and create conflicting data.`,
    });
  }

  if (hasName("HubSpot") && hasName("Segment")) {
    findings.push({
      severity: "info",
      title: "Both HubSpot and Segment detected",
      detail: "Both a CRM and a CDP are present. Verify whether Segment is routing data into HubSpot or if both are collecting independently.",
    });
  }

  if (!hasName("Google Analytics") && hasCategory("analytics")) {
    findings.push({
      severity: "info",
      title: "GA4 not detected — using alternative analytics",
      detail: "Google Analytics 4 is the standard baseline for Search Console integration and Google Ads attribution. Confirm your current tool covers these use cases.",
    });
  }

  return findings;
}

function calculateScore(
  tools: DetectedTool[],
  findings: Finding[]
): { score: number; label: ScoreLabel; rationale: string } {
  const coveredCore = CORE_CATEGORIES.filter((c) => tools.some((t) => t.category === c)).length;
  const coverageScore = (coveredCore / CORE_CATEGORIES.length) * 40;

  const highConfidence = tools.filter((t) => t.confidence === "high").length;
  const signalScore = tools.length > 0 ? (highConfidence / tools.length) * 35 : 0;

  const criticals = findings.filter((f) => f.severity === "critical").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const hygieneScore = Math.max(0, 25 - criticals * 10 - warnings * 4);

  const score = Math.round(coverageScore + signalScore + hygieneScore);

  let label: ScoreLabel;
  let rationale: string;

  if (score >= 80) {
    label = "Well-Instrumented";
    rationale = "Core tracking categories are covered with high-confidence signals and no critical gaps.";
  } else if (score >= 60) {
    label = "Functional with Gaps";
    rationale = "Basic tracking is in place but key categories or signal quality issues need attention.";
  } else if (score >= 40) {
    label = "Needs Attention";
    rationale = "Significant gaps in tracking coverage or data quality are impacting marketing visibility.";
  } else {
    label = "Critical Gaps";
    rationale = "Critical tracking failures detected — marketing decisions are likely based on incomplete data.";
  }

  return { score, label, rationale };
}

function generateRecommendations(findings: Finding[], tools: DetectedTool[]): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const finding of findings) {
    if (finding.severity === "critical") {
      if (finding.title.includes("analytics")) {
        recs.push({ priority: 1, title: "Implement GA4 via GTM", rationale: finding.detail, category: "analytics" });
      } else if (finding.title.includes("GTM")) {
        recs.push({ priority: 1, title: "Audit GTM container for broken GA4 tag", rationale: finding.detail, category: "tag_management" });
      } else if (finding.title.includes("consent")) {
        recs.push({ priority: 1, title: "Deploy a consent management platform", rationale: finding.detail, category: "consent" });
      }
    } else if (finding.severity === "warning") {
      if (finding.title.includes("consent")) {
        recs.push({ priority: 2, title: "Add cookie consent management", rationale: finding.detail, category: "consent" });
      } else if (finding.title.includes("tag management")) {
        recs.push({ priority: 2, title: "Migrate to a tag management system", rationale: finding.detail, category: "tag_management" });
      } else if (finding.title.includes("analytics tools")) {
        recs.push({ priority: 2, title: "Audit and consolidate analytics tools", rationale: finding.detail, category: "analytics" });
      }
    }
  }

  if (!tools.some((t) => t.category === "crm")) {
    recs.push({ priority: 3, title: "Connect a CRM to your marketing stack", rationale: "No CRM tracking detected. Linking web behaviour to contact records enables closed-loop attribution.", category: "crm" });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}
