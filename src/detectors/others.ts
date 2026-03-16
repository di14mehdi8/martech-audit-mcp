import type { PageSnapshot } from "../lib/crawler.js";
import type { Detector, DetectedTool, ToolCategory } from "./types.js";

// Generic pattern-based detector for all remaining tools
interface ToolPattern {
  name: string;
  category: ToolCategory;
  scriptPatterns?: string[];
  cookiePatterns?: string[];
  inlinePatterns?: string[];
  networkPatterns?: string[];
}

const TOOL_PATTERNS: ToolPattern[] = [
  // Analytics
  { name: "Mixpanel", category: "analytics", scriptPatterns: ["cdn.mxpnl.com", "cdn.mixpanel.com"], inlinePatterns: ["mixpanel.init"] },
  { name: "Amplitude", category: "analytics", scriptPatterns: ["cdn.amplitude.com"], inlinePatterns: ["amplitude.init"] },
  { name: "Heap", category: "analytics", scriptPatterns: ["cdn.heapanalytics.com"], inlinePatterns: ["heap.load"] },
  { name: "Posthog", category: "analytics", scriptPatterns: ["app.posthog.com/static/array.js"], inlinePatterns: ["posthog.init"] },
  // Advertising
  { name: "Meta Pixel", category: "advertising", scriptPatterns: ["connect.facebook.net/en_US/fbevents.js"], cookiePatterns: ["_fbp", "_fbc"], inlinePatterns: ["fbq('init'"] },
  { name: "Google Ads", category: "advertising", scriptPatterns: ["googleadservices.com/pagead/conversion"], inlinePatterns: ["gtag('config', 'AW-"] },
  { name: "LinkedIn Insight Tag", category: "advertising", scriptPatterns: ["snap.licdn.com/li.lms-analytics"], cookiePatterns: ["li_fat_id"] },
  { name: "TikTok Pixel", category: "advertising", scriptPatterns: ["analytics.tiktok.com/i18n/pixel/events.js"], inlinePatterns: ["ttq.load"] },
  // Heatmaps
  { name: "Hotjar", category: "heatmaps", scriptPatterns: ["static.hotjar.com"], cookiePatterns: ["_hjid"], inlinePatterns: ["hjBootstrap"] },
  { name: "Microsoft Clarity", category: "heatmaps", scriptPatterns: ["www.clarity.ms/tag"], inlinePatterns: ["clarity(\"set\"", "clarity(\"start\""] },
  { name: "FullStory", category: "heatmaps", scriptPatterns: ["fullstory.com/s/fs.js"], inlinePatterns: ["window['_fs_debug']"] },
  { name: "Crazy Egg", category: "heatmaps", scriptPatterns: ["script.crazyegg.com/pages/scripts"] },
  // Live Chat
  { name: "Intercom", category: "live_chat", scriptPatterns: ["widget.intercom.io", "js.intercomcdn.com"], cookiePatterns: ["intercom-session-"], inlinePatterns: ["window.intercomSettings"] },
  { name: "Drift", category: "live_chat", scriptPatterns: ["js.driftt.com"], inlinePatterns: ["drift.load"] },
  { name: "Zendesk", category: "live_chat", scriptPatterns: ["static.zdassets.com"], inlinePatterns: ["zE('messenger"] },
  { name: "HubSpot Chat", category: "live_chat", scriptPatterns: ["js.usemessages.com"] },
  // CRM / Marketing Automation
  { name: "Marketo Munchkin", category: "crm", scriptPatterns: ["munchkin.marketo.net"], inlinePatterns: ["Munchkin.init"] },
  { name: "Pardot", category: "crm", scriptPatterns: ["pi.pardot.com"], inlinePatterns: ["piAId"] },
  // Email / CDP
  { name: "Klaviyo", category: "email_marketing", scriptPatterns: ["static.klaviyo.com/onsite/js", "a.klaviyo.com"], cookiePatterns: ["__kla_id"], inlinePatterns: ["klaviyo.init"] },
  { name: "Attentive", category: "email_marketing", scriptPatterns: ["cdn.attn.tv"] },
  { name: "RudderStack", category: "cdp", scriptPatterns: ["cdn.rudderlabs.com"], inlinePatterns: ["rudderanalytics.load"] },
  // A/B Testing
  { name: "Optimizely", category: "a_b_testing", scriptPatterns: ["cdn.optimizely.com/js"] },
  { name: "VWO", category: "a_b_testing", scriptPatterns: ["dev.visualwebsiteoptimizer.com"] },
  { name: "AB Tasty", category: "a_b_testing", scriptPatterns: ["try.abtasty.com"] },
  // Consent
  { name: "OneTrust", category: "consent", scriptPatterns: ["cdn.cookielaw.org/scripttemplates/otSDKStub.js"] },
  { name: "Cookiebot", category: "consent", scriptPatterns: ["consent.cookiebot.com"] },
  { name: "Osano", category: "consent", scriptPatterns: ["cmp.osano.com"] },
];

export class GenericToolDetector implements Detector {
  name = "Generic";

  detect(snapshot: PageSnapshot): DetectedTool[] {
    const found: DetectedTool[] = [];

    for (const tool of TOOL_PATTERNS) {
      // Script src check
      if (tool.scriptPatterns) {
        const match = snapshot.scripts.find((s) =>
          tool.scriptPatterns!.some((p) => s.includes(p))
        );
        if (match) {
          found.push({ name: tool.name, category: tool.category, confidence: "high", method: "script_src", evidence: match });
          continue;
        }
      }

      // Inline script check
      if (tool.inlinePatterns) {
        const inline = snapshot.inlineScripts.join("\n");
        const match = tool.inlinePatterns.find((p) => inline.includes(p));
        if (match) {
          found.push({ name: tool.name, category: tool.category, confidence: "high", method: "inline_script", evidence: match });
          continue;
        }
      }

      // Cookie check
      if (tool.cookiePatterns) {
        const cookie = snapshot.cookies.find((c) =>
          tool.cookiePatterns!.some((p) => c.name.includes(p))
        );
        if (cookie) {
          found.push({ name: tool.name, category: tool.category, confidence: "medium", method: "cookie", evidence: `${cookie.name} cookie` });
          continue;
        }
      }

      // Network request check
      if (tool.networkPatterns) {
        const req = snapshot.networkRequests.find((r) =>
          tool.networkPatterns!.some((p) => r.url.includes(p))
        );
        if (req) {
          found.push({ name: tool.name, category: tool.category, confidence: "medium", method: "network_request", evidence: req.url });
        }
      }
    }

    return found;
  }
}
