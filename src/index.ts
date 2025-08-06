import { CarsXEMCP } from "./CarsXEMCP";

export default {
  async fetch(
    request: Request,
    env: any,
    ctx: ExecutionContext
  ): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Handle SSE transport (legacy)
    if (pathname.startsWith("/sse")) {
      return CarsXEMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    // Handle Streamable HTTP transport (new standard)
    if (pathname.startsWith("/mcp")) {
      return CarsXEMCP.serve("/mcp").fetch(request, env, ctx);
    }

    // Default to MCP endpoint for backward compatibility
    return CarsXEMCP.serve("/").fetch(request, env, ctx);
  },
};

export { CarsXEMCP };
