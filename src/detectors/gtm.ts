import type { PageSnapshot } from "../lib/crawler.js";
import type { Detector, DetectedTool } from "./types.js";

export class GtmDetector implements Detector {
  name = "GTM";

  detect(snapshot: PageSnapshot): DetectedTool[] {
    const found: DetectedTool[] = [];

    const gtmScript = snapshot.scripts.find((s) => s.includes("googletagmanager.com/gtm.js"));
    if (gtmScript) {
      const match = gtmScript.match(/id=(GTM-[A-Z0-9]+)/);
      found.push({
        name: "Google Tag Manager",
        category: "tag_management",
        confidence: "high",
        method: "script_src",
        evidence: gtmScript,
        config: match ? { containerId: match[1] } : undefined,
      });
      return found;
    }

    if (snapshot.html.includes("googletagmanager.com/ns.html")) {
      const match = snapshot.html.match(/googletagmanager\.com\/ns\.html\?id=(GTM-[A-Z0-9]+)/);
      found.push({
        name: "Google Tag Manager",
        category: "tag_management",
        confidence: "high",
        method: "html_attribute",
        evidence: "GTM noscript iframe found",
        config: match ? { containerId: match[1] } : undefined,
      });
      return found;
    }

    const hasDataLayer = snapshot.inlineScripts.some(
      (s) => s.includes("window.dataLayer") || s.includes("gtm.start")
    );
    if (hasDataLayer) {
      found.push({
        name: "Google Tag Manager",
        category: "tag_management",
        confidence: "medium",
        method: "inline_script",
        evidence: "window.dataLayer initialization found",
      });
    }

    return found;
  }
}
