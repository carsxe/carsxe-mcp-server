import assert from "node:assert/strict";
import { mock, test } from "node:test";
import {
  canonicalizeDocsLinks,
  getCarsxeDocs,
  parseLlmsIndex,
  resolveDocsUrl,
  searchCarsxeDocs,
  searchDocsEntries,
  type DocsFetch,
} from "./carsxeDocs.ts";

const SAMPLE_INDEX = `# CarsXE Docs

## Sections

- [Products](https://docs.carsxe.com/docs/products/llms.txt)
- [SDKs](https://docs.carsxe.com/docs/sdks/llms.txt)

## API Schemas

- OpenAPI schema: Machine-readable schema at https://docs.carsxe.com/api/docs?format=openapi

## Pages

- [Get Started](https://docs.carsxe.com/docs/get-started.md): Everything you need to start building with the CarsXE Vehicle Data API.
- [Specifications](https://docs.carsxe.com/docs/products/specifications.md): Decode any 17-character VIN and retrieve full vehicle specifications.
- [Node.js](https://docs.carsxe.com/docs/sdks/node.md): Official CarsXE SDK for Node.js and TypeScript.
- [Java](https://docs.carsxe.com/docs/sdks/java.md): Official CarsXE SDK for Java.
- [Python](https://docs.carsxe.com/docs/sdks/python.md): Official CarsXE SDK for Python.
- [Recall Availability Reason](https://docs.carsxe.com/docs/changelogs/2026-07-08.md): Changelog about recalls.
`;

const SAMPLE_NODE_PAGE = `# Node.js

See also [Get Started](/docs/get-started) and the old host https://carsxe.com/docs/sdks/node

\`\`\`ts
import { CarsXE } from "carsxe-api";
const carsxe = new CarsXE("YOUR_API_KEY");
const vehicle = await carsxe.specs({ vin: "WBAFR7C57CC811956" });
\`\`\`
`;

function mockFetch(handlers: Record<string, { status?: number; body: string; contentType?: string }>): DocsFetch {
  return async (input) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const handler = handlers[url];
    if (!handler) {
      throw new Error(`Unexpected fetch: ${url}`);
    }
    return new Response(handler.body, {
      status: handler.status ?? 200,
      headers: { "content-type": handler.contentType ?? "text/markdown" },
    });
  };
}

test("resolveDocsUrl allows docs.carsxe.com pages and shortcuts", () => {
  const page = resolveDocsUrl("docs/sdks/node");
  assert.equal(page.ok, true);
  if (page.ok) {
    assert.equal(page.url.href, "https://docs.carsxe.com/docs/sdks/node.md");
    assert.equal(page.kind, "page");
  }

  const full = resolveDocsUrl("https://docs.carsxe.com/docs/products/specifications");
  assert.equal(full.ok, true);
  if (full.ok) {
    assert.equal(full.url.href, "https://docs.carsxe.com/docs/products/specifications.md");
  }

  const openapi = resolveDocsUrl("openapi");
  assert.equal(openapi.ok, true);
  if (openapi.ok) {
    assert.equal(openapi.url.href, "https://docs.carsxe.com/api/docs?format=openapi");
    assert.equal(openapi.kind, "openapi");
  }

  const started = resolveDocsUrl("get-started");
  assert.equal(started.ok, true);
  if (started.ok) {
    assert.equal(started.url.href, "https://docs.carsxe.com/docs/get-started.md");
  }
});

test("resolveDocsUrl rejects hosts and paths outside the docs.carsxe.com allowlist", () => {
  const marketingDocs = resolveDocsUrl("https://carsxe.com/docs/sdks/node");
  assert.equal(marketingDocs.ok, false);
  if (!marketingDocs.ok) {
    assert.match(marketingDocs.error, /never carsxe\.com\/docs/);
  }

  const www = resolveDocsUrl("https://www.carsxe.com/docs/get-started");
  assert.equal(www.ok, false);

  const apiHost = resolveDocsUrl("https://api.carsxe.com/specs");
  assert.equal(apiHost.ok, false);
  if (!apiHost.ok) {
    assert.match(apiHost.error, /not allowlisted/);
  }

  const http = resolveDocsUrl("http://docs.carsxe.com/docs/get-started.md");
  assert.equal(http.ok, false);

  const traversal = resolveDocsUrl("https://docs.carsxe.com/docs/../secret");
  assert.equal(traversal.ok, false);

  const credentials = resolveDocsUrl("https://user:pass@docs.carsxe.com/docs/get-started.md");
  assert.equal(credentials.ok, false);

  const empty = resolveDocsUrl("   ");
  assert.equal(empty.ok, false);
});

test("canonicalizeDocsLinks rewrites carsxe.com/docs to docs.carsxe.com", () => {
  const rewritten = canonicalizeDocsLinks(
    "See https://carsxe.com/docs/sdks/node and [Specs](/docs/products/specifications).",
  );
  assert.equal(
    rewritten,
    "See https://docs.carsxe.com/docs/sdks/node and [Specs](https://docs.carsxe.com/docs/products/specifications).",
  );
  assert.doesNotMatch(rewritten, /https?:\/\/(www\.)?carsxe\.com\/docs/);
});

test("parseLlmsIndex and searchDocsEntries find Node specs pages", () => {
  const entries = parseLlmsIndex(SAMPLE_INDEX);
  const titles = entries.map((entry) => entry.title);
  assert.ok(titles.includes("Specifications"));
  assert.ok(titles.includes("Node.js"));
  assert.ok(titles.includes("OpenAPI schema"));

  const matches = searchDocsEntries(entries, "how do I call specs from Node?");
  const matchTitles = matches.map((entry) => entry.title);
  assert.ok(matchTitles.includes("Specifications"));
  assert.ok(matchTitles.includes("Node.js"));
  assert.ok(!matchTitles.includes("Java"));
});

test("search_carsxe_docs happy path uses the mocked llms.txt index", async () => {
  const fetchFn = mockFetch({
    "https://docs.carsxe.com/llms.txt": { body: SAMPLE_INDEX },
  });

  const markdown = await searchCarsxeDocs({
    query: "specs from Node",
    fetchFn,
  });

  assert.match(markdown, /Canonical host: https:\/\/docs\.carsxe\.com/);
  assert.match(markdown, /never carsxe\.com\/docs/);
  assert.match(markdown, /\[Node\.js\]\(https:\/\/docs\.carsxe\.com\/docs\/sdks\/node\)/);
  assert.match(markdown, /\[Specifications\]\(https:\/\/docs\.carsxe\.com\/docs\/products\/specifications\)/);
  assert.match(markdown, /get_carsxe_docs/);
  assert.doesNotMatch(markdown, /https?:\/\/(www\.)?carsxe\.com\/docs/);
});

test("get_carsxe_docs happy path fetches Markdown from an allowlisted URL", async () => {
  const fetchFn = mock.fn<DocsFetch>(
    mockFetch({
      "https://docs.carsxe.com/docs/sdks/node.md": { body: SAMPLE_NODE_PAGE },
    }),
  );

  const markdown = await getCarsxeDocs("docs/sdks/node", fetchFn);

  assert.match(markdown, /Source: https:\/\/docs\.carsxe\.com\/docs\/sdks\/node/);
  assert.match(markdown, /carsxe-api/);
  assert.match(markdown, /carsxe\.specs/);
  assert.match(markdown, /https:\/\/docs\.carsxe\.com\/docs\/get-started/);
  assert.doesNotMatch(markdown, /https:\/\/carsxe\.com\/docs/);
  assert.equal(fetchFn.mock.callCount(), 1);
});

test("get_carsxe_docs does not fetch rejected hosts", async () => {
  const fetchFn = mock.fn<DocsFetch>(async () => {
    throw new Error("fetch should not be called");
  });

  const markdown = await getCarsxeDocs("https://carsxe.com/docs/sdks/node", fetchFn);

  assert.match(markdown, /❌/);
  assert.match(markdown, /never carsxe\.com\/docs/);
  assert.equal(fetchFn.mock.callCount(), 0);
});

test("get_carsxe_docs fetches OpenAPI via the openapi shortcut", async () => {
  const fetchFn = mockFetch({
    "https://docs.carsxe.com/api/docs?format=openapi": {
      body: "openapi: 3.1.0\ninfo:\n  title: CarsXE API\n",
      contentType: "application/yaml",
    },
  });

  const markdown = await getCarsxeDocs("openapi", fetchFn);
  assert.match(markdown, /CarsXE OpenAPI schema/);
  assert.match(markdown, /```yaml/);
  assert.match(markdown, /title: CarsXE API/);
});
