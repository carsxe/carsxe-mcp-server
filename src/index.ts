import { MyMCP, setApiKeyForRequest } from "./MyMCP";

export { MyMCP };

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Extract API key from X-API-Key header or search params
    const apiKey =
      request.headers.get("X-API-Key") || url.searchParams.get("key");

    console.log("apiKey", apiKey);

    if (!apiKey) {
      return new Response("Missing X-API-Key header", { status: 401 });
    }

    // Generate a unique request ID and store the API key
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    setApiKeyForRequest(requestId, apiKey);
    MyMCP.setRequestId(requestId);

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
