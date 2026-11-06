import { McpAgent } from "agents/mcp";
import { registerAllTools } from "./registerTools.js";
import { createCarsxeMcpServer } from "./serverInfo.js";

export class MyMCP extends McpAgent {
  server = createCarsxeMcpServer();

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
