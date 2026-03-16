import type { PageSnapshot } from "../lib/crawler.js";
import type { Detector, DetectedTool } from "./types.js";

// Common cookie names set by custom/homegrown consent banners
const CONSENT_COOKIE_NAMES = [
  "cookie-consent",
  "cookieconsent",
  "cookie_consent",
  "gdpr_consent",
  "consent",
  "user-consent",
  "cc_cookie",
  "consent_status",
  "privacy_consent",
];

// HTML patterns that indicate a consent banner is present in the page
const HTML_CONSENT_PATTERNS = [
  'data-cookie-consent',
  'cookie-banner',
  'cookie-consent',
  'consent-banner',
  'consent-popup',
  'gdpr-banner',
  'gdpr-consent',
  'CookieConsent',
  'cookieConsent',
];

export class CustomConsentDetector implements Detector {
  name = "CustomConsent";

  detect(snapshot: PageSnapshot): DetectedTool[] {
    // Cookie-based detection
    const consentCookie = snapshot.cookies.find((c) =>
      CONSENT_COOKIE_NAMES.some((name) => c.name.toLowerCase().includes(name.toLowerCase()))
    );
    if (consentCookie) {
      return [{
        name: "Custom Consent Banner",
        category: "consent",
        confidence: "medium",
        method: "cookie",
        evidence: `${consentCookie.name} cookie`,
      }];
    }

    // HTML pattern detection — catches banners rendered server-side or in static HTML
    const htmlLower = snapshot.html;
    const htmlMatch = HTML_CONSENT_PATTERNS.find((p) => htmlLower.includes(p));
    if (htmlMatch) {
      return [{
        name: "Custom Consent Banner",
        category: "consent",
        confidence: "low",
        method: "html_attribute",
        evidence: htmlMatch,
      }];
    }

    // Inline script detection
    const inlineAll = snapshot.inlineScripts.join("\n");
    if (
      inlineAll.includes("cookieConsent") ||
      inlineAll.includes("cookie_consent") ||
      inlineAll.includes("gdpr") ||
      inlineAll.includes("acceptCookies") ||
      inlineAll.includes("consentGranted")
    ) {
      return [{
        name: "Custom Consent Banner",
        category: "consent",
        confidence: "low",
        method: "inline_script",
        evidence: "Consent-related JavaScript found",
      }];
    }

    return [];
  }
}
