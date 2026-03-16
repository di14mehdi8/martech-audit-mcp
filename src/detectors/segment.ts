import type { PageSnapshot } from "../lib/crawler.js";
import type { Detector, DetectedTool } from "./types.js";

export class SegmentDetector implements Detector {
  name = "Segment";

  detect(snapshot: PageSnapshot): DetectedTool[] {
    const found: DetectedTool[] = [];

    const segScript = snapshot.scripts.find((s) => s.includes("cdn.segment.com"));
    if (segScript) {
      found.push({
        name: "Segment",
        category: "cdp",
        confidence: "high",
        method: "script_src",
        evidence: segScript,
      });
      return found;
    }

    const inline = snapshot.inlineScripts.join("\n");
    const writeKeyMatch = inline.match(/analytics\.load\(["']([^"']+)["']/);
    if (writeKeyMatch) {
      found.push({
        name: "Segment",
        category: "cdp",
        confidence: "high",
        method: "inline_script",
        evidence: writeKeyMatch[0],
        config: { writeKey: writeKeyMatch[1] },
      });
      return found;
    }

    const ajsCookie = snapshot.cookies.find((c) => c.name === "ajs_user_id" || c.name === "ajs_anonymous_id");
    if (ajsCookie) {
      found.push({
        name: "Segment",
        category: "cdp",
        confidence: "medium",
        method: "cookie",
        evidence: `${ajsCookie.name} cookie present`,
      });
    }

    return found;
  }
}
