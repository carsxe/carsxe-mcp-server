import { MyMCP } from "./MyMCP";

export { MyMCP };

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Extract API key from X-API-Key header or search params
    const apiKey =
      request.headers.get("X-API-Key") || url.searchParams.get("key");

    if (!apiKey) {
      return new Response("Missing X-API-Key header", { status: 401 });
    }

    console.log("Setting API key in context:", apiKey ? "***" + apiKey.slice(-4) : "null");

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
