import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DOCS_SECTIONS, searchCarsxeDocs } from "../utils/carsxeDocs.js";

export function registerSearchCarsxeDocsTool(server: McpServer) {
  server.registerTool(
    "search_carsxe_docs",
    {
      title: "Search CarsXE Docs",
      description:
        "Search official CarsXE documentation on docs.carsxe.com so you can write correct API and SDK code. Lists or searches the public llms.txt index and section indexes (products, guides, sdks, integrations). No API key required. Use this before inventing REST paths or SDK method names, then call get_carsxe_docs to read a page as Markdown.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe(
            'Search terms such as "specs from Node" or "plate decoder". Omit to list the docs index.',
          ),
        section: z
          .enum(DOCS_SECTIONS)
          .optional()
          .describe("Limit results to one docs section."),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ query, section }) => {
      const text = await searchCarsxeDocs({ query, section });
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
