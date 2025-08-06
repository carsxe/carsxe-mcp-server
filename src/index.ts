import { MyMCP, setApiKey } from "./MyMCP";

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

    // Set the API key for this request
    setApiKey(apiKey);

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
