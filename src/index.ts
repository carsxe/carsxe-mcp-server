import { MyMCP } from "./MyMCP";

export { MyMCP };

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Extract API key from X-API-Key header, Authorization Bearer token, or search params
    let apiKey = request.headers.get("X-API-Key");

    // If no X-API-Key header, check Authorization header for Bearer token
    if (!apiKey) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        apiKey = authHeader.substring(7); // Remove "Bearer " prefix
      }
    }

    // If still no API key, check search params
    if (!apiKey) {
      apiKey = url.searchParams.get("key");
    }

    if (!apiKey) {
      return new Response(
        "Missing API key. Provide via X-API-Key header, Authorization Bearer token, or 'key' query parameter",
        { status: 401 }
      );
    }

    // Set the API key in the execution context props
    (ctx as any).props = (ctx as any).props || {};
    (ctx as any).props.API_KEY = apiKey;

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      // @ts-ignore
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      // @ts-ignore
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
