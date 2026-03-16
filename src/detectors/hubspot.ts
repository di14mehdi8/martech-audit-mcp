import type { PageSnapshot } from "../lib/crawler.js";
import type { Detector, DetectedTool } from "./types.js";

export class HubSpotDetector implements Detector {
  name = "HubSpot";

  detect(snapshot: PageSnapshot): DetectedTool[] {
    const found: DetectedTool[] = [];

    const hsScript = snapshot.scripts.find(
      (s) => s.includes("js.hs-scripts.com") || s.includes("js.hubspot.com")
    );
    if (hsScript) {
      const match = hsScript.match(/hs-scripts\.com\/(\d+)/);
      found.push({
        name: "HubSpot",
        category: "crm",
        confidence: "high",
        method: "script_src",
        evidence: hsScript,
        config: match ? { portalId: match[1] } : undefined,
      });
      return found;
    }

    const hsCookie = snapshot.cookies.find((c) => c.name === "__hstc" || c.name === "hubspotutk");
    if (hsCookie) {
      found.push({
        name: "HubSpot",
        category: "crm",
        confidence: "high",
        method: "cookie",
        evidence: `${hsCookie.name} cookie present`,
      });
    }

    return found;
  }
}
