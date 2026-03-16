import type { PageSnapshot } from "../lib/crawler.js";
import type { DetectedTool, ToolCategory } from "./types.js";
import { GtmDetector } from "./gtm.js";
import { Ga4Detector } from "./ga4.js";
import { HubSpotDetector } from "./hubspot.js";
import { SegmentDetector } from "./segment.js";
import { GenericToolDetector } from "./others.js";

const DETECTORS = [
  new GtmDetector(),
  new Ga4Detector(),
  new HubSpotDetector(),
  new SegmentDetector(),
  new GenericToolDetector(),
];

export function runAllDetectors(snapshot: PageSnapshot): DetectedTool[] {
  const all: DetectedTool[] = [];

  for (const detector of DETECTORS) {
    try {
      all.push(...detector.detect(snapshot));
    } catch (err) {
      console.error(`[detector:${detector.name}] Error:`, err);
    }
  }

  // Deduplicate by tool name — keep highest confidence
  const seen = new Map<string, DetectedTool>();
  const order: Record<string, number> = { high: 3, medium: 2, low: 1 };
  for (const tool of all) {
    const existing = seen.get(tool.name);
    if (!existing || order[tool.confidence] > order[existing.confidence]) {
      seen.set(tool.name, tool);
    }
  }

  return Array.from(seen.values());
}

export function buildCategorySummary(tools: DetectedTool[]): Record<ToolCategory, string[]> {
  const summary = {} as Record<ToolCategory, string[]>;
  for (const tool of tools) {
    if (!summary[tool.category]) summary[tool.category] = [];
    summary[tool.category].push(tool.name);
  }
  return summary;
}
