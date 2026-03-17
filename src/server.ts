import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { crawlPage } from "./lib/crawler.js";
import { runAllDetectors } from "./detectors/index.js";
import { formatReport } from "./lib/report-formatter.js";
import { attachLlmReport, generateGeminiSummary } from "./lib/gemini.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    message: { error: "Too many requests. Please try again later." },
  })
);

// Serve frontend static files if they exist
const frontendDist = join(__dirname, "../frontend/dist");
if (existsSync(frontendDist)) {
  const { default: serveStatic } = await import("serve-static");
  app.use(serveStatic(frontendDist));
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "0.1.0" });
});

app.post("/api/audit", async (req, res) => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url is required", code: "INVALID_URL" });
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
  } catch {
    res.status(400).json({ error: "Invalid URL — must start with http:// or https://", code: "INVALID_URL" });
    return;
  }

  console.error(`[server] Audit request: ${url}`);

  try {
    const timeout = 45_000;
    const snapshot = await crawlPage(parsedUrl.toString(), timeout);
    const tools = runAllDetectors(snapshot);

    const reportBase = formatReport(parsedUrl.toString(), tools, {
      total_scripts: snapshot.scripts.length,
      total_network_requests: snapshot.networkRequests.length,
      total_cookies: snapshot.cookies.length,
      has_data_layer: snapshot.dataLayer.length > 0,
    }, snapshot.elapsed_ms);

    const llm = await generateGeminiSummary({
      tools,
      findings: reportBase.findings,
      recommendations: reportBase.recommendations,
      rawSignals: reportBase.raw_signals,
      url: reportBase.url,
      auditedAt: reportBase.audited_at,
    });

    const report = attachLlmReport(reportBase, llm);
    res.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[server] Audit failed for ${url}:`, message);

    if (message.includes("timeout") || message.includes("Timeout")) {
      res.status(504).json({ error: "Page took too long to load", code: "TIMEOUT" });
    } else if (message.includes("net::ERR_") || message.includes("NS_ERROR")) {
      res.status(422).json({ error: "Could not reach the page — check the URL is publicly accessible", code: "UNREACHABLE" });
    } else if (message.includes("403") || message.includes("blocked") || message.includes("Cloudflare") || message.includes("Access Denied")) {
      res.status(422).json({ error: "The site is blocking automated access (bot protection). Try a different URL.", code: "BOT_BLOCKED" });
    } else {
      res.status(500).json({ error: "Failed to crawl the page", code: "CRAWL_FAILED", detail: message });
    }
  }
});

// SPA fallback
app.get("/{*path}", (_req, res) => {
  const indexPath = join(frontendDist, "index.html");
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Frontend not built. Run: cd frontend && npm run build");
  }
});

createServer(app).listen(PORT, () => {
  console.error(`[server] Martech Audit API running on http://localhost:${PORT}`);
});
