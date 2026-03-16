import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { crawlPage } from "../lib/crawler.js";
import { runAllDetectors, buildCategorySummary } from "../detectors/index.js";

export function registerStackDetectiveTool(server: McpServer) {
  server.tool(
    "detect_martech_stack",
    "Crawls a URL and detects all installed martech tools from page source, script tags, cookies, and network requests.",
    {
      url: z.string().url().describe("The full URL to audit (e.g. https://example.com)"),
      include_evidence: z.boolean().optional().default(true).describe("Include raw detection evidence strings"),
      timeout_ms: z.number().int().min(5000).max(60000).optional().default(30000).describe("Navigation timeout in milliseconds"),
    },
    async ({ url, include_evidence, timeout_ms }) => {
      console.error(`[stack-detective] Crawling: ${url}`);

      const snapshot = await crawlPage(url, timeout_ms);
      const tools = runAllDetectors(snapshot);
      const summary = buildCategorySummary(tools);

      const result = {
        url: snapshot.url,
        crawled_at: new Date().toISOString(),
        elapsed_ms: snapshot.elapsed_ms,
        total_tools_detected: tools.length,
        summary,
        tools: tools.map((t) => ({
          name: t.name,
          category: t.category,
          confidence: t.confidence,
          method: t.method,
          ...(include_evidence ? { evidence: t.evidence } : {}),
          ...(t.version ? { version: t.version } : {}),
          ...(t.config ? { config: t.config } : {}),
        })),
        raw_signals: {
          total_scripts: snapshot.scripts.length,
          total_network_requests: snapshot.networkRequests.length,
          total_cookies: snapshot.cookies.length,
          has_data_layer: snapshot.dataLayer.length > 0,
        },
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
