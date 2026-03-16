import type { PageSnapshot } from "../lib/crawler.js";
import type { Detector, DetectedTool } from "./types.js";

export class Ga4Detector implements Detector {
  name = "GA4";

  detect(snapshot: PageSnapshot): DetectedTool[] {
    const found: DetectedTool[] = [];

    const gtagScript = snapshot.scripts.find((s) => s.includes("googletagmanager.com/gtag/js"));
    if (gtagScript) {
      const match = gtagScript.match(/id=(G-[A-Z0-9]+)/);
      found.push({
        name: "Google Analytics 4",
        category: "analytics",
        confidence: "high",
        method: "script_src",
        evidence: gtagScript,
        config: match ? { measurementId: match[1] } : undefined,
      });
    }

    const inlineMatch = snapshot.inlineScripts
      .join("\n")
      .match(/gtag\(['"]config['"],\s*['"]?(G-[A-Z0-9]+)['"]?\)/);
    if (inlineMatch && !found.length) {
      found.push({
        name: "Google Analytics 4",
        category: "analytics",
        confidence: "high",
        method: "inline_script",
        evidence: inlineMatch[0],
        config: { measurementId: inlineMatch[1] },
      });
    }

    // GA4 fired via GTM — network request to google-analytics.com/g/collect
    const ga4Network = snapshot.networkRequests.find(
      (r) => r.url.includes("google-analytics.com/g/collect") || r.url.includes("analytics.google.com/g/collect")
    );
    if (ga4Network && !found.length) {
      const mid = ga4Network.url.match(/[?&]tid=(G-[A-Z0-9]+)/);
      found.push({
        name: "Google Analytics 4",
        category: "analytics",
        confidence: "high",
        method: "network_request",
        evidence: ga4Network.url.split("?")[0],
        config: mid ? { measurementId: mid[1] } : undefined,
      });
    }

    const gaCookie = snapshot.cookies.find((c) => c.name === "_ga");
    if (gaCookie && !found.length) {
      found.push({
        name: "Google Analytics 4",
        category: "analytics",
        confidence: "medium",
        method: "cookie",
        evidence: "_ga cookie present",
      });
    }

    return found;
  }
}
