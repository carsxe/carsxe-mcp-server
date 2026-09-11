import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAllTools } from "./registerTools.js";

export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "carsxe",
    version: "1.0.1",
  });

  async init() {
    // Function to get API key from execution context props
    const getApiKey = (): string | null => {
      const apiKey = (this.props as any)?.API_KEY;
      console.log(
        "Getting API key from props:",
        apiKey ? "***" + apiKey.slice(-4) : "null",
      );
      return apiKey || null;
    };

    registerAllTools(this.server, getApiKey);
  }
}
