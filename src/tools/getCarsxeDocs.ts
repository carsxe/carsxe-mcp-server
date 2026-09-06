import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCarsxeDocs } from "../utils/carsxeDocs.js";

export function registerGetCarsxeDocsTool(server: McpServer) {
  server.registerTool(
    "get_carsxe_docs",
    {
      title: "Get CarsXE Docs",
      description:
        "Fetch an official CarsXE docs page as Markdown from docs.carsxe.com only (never carsxe.com/docs). No API key required. Pass a path, a shortcut (openapi, get-started, agents, node, python, specs), or a https://docs.carsxe.com URL. Use this to load get-started, SDK quickstarts, product references, or the OpenAPI schema before writing integration code.",
      inputSchema: {
        path: z
          .string()
          .min(1)
          .describe(
            "Docs path, shortcut, or https://docs.carsxe.com URL. Examples: docs/sdks/node, get-started, openapi, https://docs.carsxe.com/docs/products/specifications.md",
          ),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ path }) => {
      const text = await getCarsxeDocs(path);
      return {
        content: [
          {
            type: "text",
            text,
          },
        ],
      };
    },
  );
}
