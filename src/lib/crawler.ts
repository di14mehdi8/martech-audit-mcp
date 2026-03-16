import { chromium } from "playwright";

export interface NetworkRequest {
  url: string;
  resourceType: string;
}

export interface PageCookie {
  name: string;
  value: string;
  domain: string;
}

export interface PageSnapshot {
  url: string;
  html: string;
  scripts: string[];
  inlineScripts: string[];
  cookies: PageCookie[];
  networkRequests: NetworkRequest[];
  metaTags: Record<string, string>;
  dataLayer: unknown[];
  elapsed_ms: number;
}

export async function crawlPage(url: string, timeout = 30_000): Promise<PageSnapshot> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const networkRequests: NetworkRequest[] = [];
  const start = Date.now();

  page.on("request", (req) => {
    networkRequests.push({ url: req.url(), resourceType: req.resourceType() });
  });

  await page.goto(url, { waitUntil: "networkidle", timeout });

  const html = await page.content();
  const finalUrl = page.url();

  const scripts = await page.evaluate(() =>
    Array.from(document.querySelectorAll("script[src]"))
      .map((s) => (s as HTMLScriptElement).src)
  );

  const inlineScripts = await page.evaluate(() =>
    Array.from(document.querySelectorAll("script:not([src])"))
      .map((s) => s.textContent ?? "")
      .filter(Boolean)
  );

  const rawCookies = await context.cookies();
  const cookies: PageCookie[] = rawCookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
  }));

  const metaTags = await page.evaluate(() => {
    const result: Record<string, string> = {};
    document.querySelectorAll("meta[name], meta[property]").forEach((el) => {
      const key = el.getAttribute("name") || el.getAttribute("property") || "";
      const val = el.getAttribute("content") || "";
      if (key) result[key] = val;
    });
    return result;
  });

  const dataLayer = await page.evaluate(() =>
    (window as unknown as Record<string, unknown>).dataLayer ?? []
  ) as unknown[];

  await browser.close();

  return {
    url: finalUrl,
    html,
    scripts,
    inlineScripts,
    cookies,
    networkRequests,
    metaTags,
    dataLayer,
    elapsed_ms: Date.now() - start,
  };
}
