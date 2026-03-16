import type { PageSnapshot } from "../lib/crawler.js";

export type DetectionConfidence = "high" | "medium" | "low";
export type DetectionMethod = "script_src" | "inline_script" | "cookie" | "network_request" | "html_attribute" | "data_layer";
export type ToolCategory =
  | "tag_management"
  | "analytics"
  | "crm"
  | "cdp"
  | "email_marketing"
  | "advertising"
  | "live_chat"
  | "heatmaps"
  | "a_b_testing"
  | "personalization"
  | "consent"
  | "unknown";

export interface DetectedTool {
  name: string;
  category: ToolCategory;
  confidence: DetectionConfidence;
  method: DetectionMethod;
  evidence: string;
  version?: string;
  config?: Record<string, unknown>;
}

export interface Detector {
  name: string;
  detect(snapshot: PageSnapshot): DetectedTool[];
}
