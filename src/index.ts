import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerStackDetectiveTool } from "./tools/stack-detective.js";

const server = new McpServer({
  name: "martech-audit-mcp",
  version: "0.1.0",
});

registerStackDetectiveTool(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Martech Audit MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
