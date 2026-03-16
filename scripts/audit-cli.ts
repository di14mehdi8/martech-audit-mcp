import { crawlPage } from "../src/lib/crawler.js";
import { runAllDetectors, buildCategorySummary } from "../src/detectors/index.js";

const url = process.argv[2];
if (!url) {
  console.error("Usage: npm run audit <url>");
  process.exit(1);
}

console.log(`\nAuditing: ${url}\n`);

const snapshot = await crawlPage(url);
const tools = runAllDetectors(snapshot);
const summary = buildCategorySummary(tools);

console.log(`✓ Crawled in ${snapshot.elapsed_ms}ms`);
console.log(`✓ ${snapshot.scripts.length} scripts, ${snapshot.networkRequests.length} network requests, ${snapshot.cookies.length} cookies\n`);
console.log(`Detected ${tools.length} martech tools:\n`);

for (const [category, names] of Object.entries(summary)) {
  console.log(`  ${category.toUpperCase()}`);
  for (const name of names) {
    const tool = tools.find((t) => t.name === name)!;
    const cfg = tool.config ? ` — ${JSON.stringify(tool.config)}` : "";
    console.log(`    [${tool.confidence}] ${tool.name}${cfg}`);
  }
}
