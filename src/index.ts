import { MCP_OBJECT } from "./MCP_OBJECT";

export default {
  async fetch(
    request: Request,
    env: any,
    ctx: ExecutionContext
  ): Promise<Response> {
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

    // Get Durable Object stub
    const id = env.MCP_OBJECT.idFromName("mcp");
    const stub = env.MCP_OBJECT.get(id);

    // Forward the request to the DO
    const response = await stub.fetch(request);

    // Apply CORS to response
    const corsified = new Response(response.body, response);
    corsified.headers.set("Access-Control-Allow-Origin", "*");
    return corsified;
  },
};

export { MCP_OBJECT };
