/**
 * Public CarsXE docs helpers for MCP tools.
 * Only https://docs.carsxe.com is allowlisted — never carsxe.com/docs.
 */

export const DOCS_HOST = "docs.carsxe.com";
export const DOCS_ORIGIN = "https://docs.carsxe.com";
export const ROOT_INDEX_PATH = "/llms.txt";
export const OPENAPI_URL = `${DOCS_ORIGIN}/api/docs?format=openapi`;

export const DOCS_SECTIONS = [
  "products",
  "guides",
  "sdks",
  "integrations",
] as const;

export type DocsSection = (typeof DOCS_SECTIONS)[number];

export type DocsPageKind = "page" | "index" | "openapi" | "other";

export type DocsPageRef = {
  title: string;
  url: string;
  description: string;
};

export type ResolveDocsUrlResult =
  | { ok: true; url: URL; kind: DocsPageKind }
  | { ok: false; error: string };

export type DocsFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

const MAX_DOCS_CHARS = 400_000;
const FETCH_TIMEOUT_MS = 15_000;

const ALLOWED_PATHS = new Set([
  "/llms.txt",
  "/llms-full.txt",
  "/docs.md",
  "/AGENTS.md",
  "/skill.md",
  "/sitemap.md",
  "/api/openapi",
]);

const ALLOWED_PATH_PREFIXES = [
  "/docs/",
  "/api/docs",
  "/.well-known/",
];

const SECTION_INDEX: Record<DocsSection, string> = {
  products: "/docs/products/llms.txt",
  guides: "/docs/guides/llms.txt",
  sdks: "/docs/sdks/llms.txt",
  integrations: "/docs/integrations/llms.txt",
};

const SHORTCUTS: Record<string, string> = {
  openapi: "/api/docs?format=openapi",
  "openapi.yaml": "/api/docs?format=openapi",
  "openapi.json": "/api/docs?format=openapi",
  swagger: "/api/docs?format=openapi",
  schema: "/api/docs?format=openapi",
  "api-schema": "/api/docs?format=openapi",
  index: ROOT_INDEX_PATH,
  llms: ROOT_INDEX_PATH,
  "llms.txt": ROOT_INDEX_PATH,
  "get-started": "/docs/get-started.md",
  getstarted: "/docs/get-started.md",
  "getting-started": "/docs/get-started.md",
  quickstart: "/docs/get-started.md",
  agents: "/docs/guides/agents.md",
  node: "/docs/sdks/node.md",
  nodejs: "/docs/sdks/node.md",
  "node.js": "/docs/sdks/node.md",
  javascript: "/docs/sdks/node.md",
  typescript: "/docs/sdks/node.md",
  python: "/docs/sdks/python.md",
  php: "/docs/sdks/php.md",
  go: "/docs/sdks/go.md",
  java: "/docs/sdks/java.md",
  ruby: "/docs/sdks/ruby.md",
  swift: "/docs/sdks/swift.md",
  csharp: "/docs/sdks/csharp.md",
  "c#": "/docs/sdks/csharp.md",
  cli: "/docs/sdks/cli.md",
  specs: "/docs/products/specifications.md",
  spec: "/docs/products/specifications.md",
  specifications: "/docs/products/specifications.md",
};

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "by",
  "call",
  "do",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "the",
  "to",
  "use",
  "using",
  "what",
  "with",
]);

const TOKEN_ALIASES: Record<string, string[]> = {
  spec: ["specs", "specification", "specifications"],
  specs: ["spec", "specification", "specifications"],
  specification: ["specs", "spec"],
  specifications: ["specs", "spec"],
  node: ["nodejs", "node.js", "javascript", "typescript"],
  nodejs: ["node", "node.js", "javascript", "typescript"],
  js: ["javascript", "node", "nodejs", "typescript"],
  javascript: ["node", "nodejs", "typescript"],
  ts: ["typescript", "node", "nodejs"],
  csharp: ["c#", "dotnet", ".net"],
  ymm: ["year", "make", "model"],
};

const DOCS_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)(?:\s*:\s*(.+))?/g;
const BARE_DOCS_URL_RE = /https:\/\/docs\.carsxe\.com\/[^\s)>\]]+/g;
const CARSXE_DOCS_HOST_RE = /^https?:\/\/(www\.)?carsxe\.com\/docs(\/|$)/i;

export function resolveDocsUrl(input: string): ResolveDocsUrlResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "A docs path or https://docs.carsxe.com URL is required." };
  }

  if (trimmed.includes("..") || trimmed.includes("\\")) {
    return { ok: false, error: "Path traversal is not allowed." };
  }

  if (CARSXE_DOCS_HOST_RE.test(trimmed)) {
    return {
      ok: false,
      error:
        "Use https://docs.carsxe.com (never carsxe.com/docs). Example: https://docs.carsxe.com/docs/get-started.md",
    };
  }

  const shortcut = SHORTCUTS[trimmed.toLowerCase()];
  if (shortcut) {
    const url = new URL(shortcut, DOCS_ORIGIN);
    return { ok: true, url, kind: classifyDocsUrl(url) };
  }

  let parsed: URL;
  try {
    parsed = parseUserDocsInput(trimmed);
  } catch {
    return { ok: false, error: "Could not parse that docs path or URL." };
  }

  if (parsed.protocol !== "https:") {
    return {
      ok: false,
      error: "Only https://docs.carsxe.com URLs are allowed.",
    };
  }

  if (parsed.hostname !== DOCS_HOST) {
    if (parsed.hostname === "carsxe.com" || parsed.hostname === "www.carsxe.com") {
      return {
        ok: false,
        error: "Use https://docs.carsxe.com (never carsxe.com/docs).",
      };
    }
    return {
      ok: false,
      error: `Host ${parsed.hostname} is not allowlisted. Only ${DOCS_HOST} is allowed.`,
    };
  }

  if (parsed.username || parsed.password || parsed.port) {
    return { ok: false, error: "Docs URLs may not include credentials or a custom port." };
  }

  parsed.hash = "";
  parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";

  if (!isAllowedDocsPath(parsed.pathname)) {
    return {
      ok: false,
      error: `Path ${parsed.pathname} is not an allowed docs.carsxe.com path.`,
    };
  }

  const url = maybeAppendMarkdown(parsed);
  return { ok: true, url, kind: classifyDocsUrl(url) };
}

export function canonicalizeDocsLinks(markdown: string): string {
  return markdown
    .replace(/https?:\/\/(www\.)?carsxe\.com\/docs/gi, `${DOCS_ORIGIN}/docs`)
    .replace(/\]\(\/docs\//g, `](${DOCS_ORIGIN}/docs/`)
    .replace(/\]\(\/llms\.txt/g, `](${DOCS_ORIGIN}/llms.txt`)
    .replace(/\]\(\/llms-full\.txt/g, `](${DOCS_ORIGIN}/llms-full.txt`)
    .replace(/\]\(\/api\/docs/g, `](${DOCS_ORIGIN}/api/docs`)
    .replace(/\]\(\/\.well-known\//g, `](${DOCS_ORIGIN}/.well-known/`);
}

export function parseLlmsIndex(text: string): DocsPageRef[] {
  const entries = new Map<string, DocsPageRef>();

  for (const match of text.matchAll(DOCS_LINK_RE)) {
    const title = match[1]?.trim();
    const href = match[2]?.trim();
    const description = match[3]?.trim() ?? "";
    if (!title || !href) continue;
    const resolved = resolveDocsUrl(href);
    if (!resolved.ok) continue;
    addEntry(entries, {
      title,
      url: resolved.url.href,
      description,
    });
  }

  for (const match of text.matchAll(BARE_DOCS_URL_RE)) {
    const href = match[0];
    const resolved = resolveDocsUrl(href);
    if (!resolved.ok) continue;
    addEntry(entries, {
      title: titleFromUrl(resolved.url),
      url: resolved.url.href,
      description: "",
    });
  }

  return [...entries.values()];
}

export function searchDocsEntries(
  entries: DocsPageRef[],
  query: string,
): DocsPageRef[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return entries.filter((entry) => !isChangelog(entry.url));
  }

  const expanded = expandTokens(tokens);
  const scored = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, expanded) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));

  return scored.map((row) => row.entry);
}

export async function searchCarsxeDocs(
  options: {
    query?: string;
    section?: DocsSection;
    fetchFn?: DocsFetch;
  } = {},
): Promise<string> {
  const fetchFn = options.fetchFn ?? fetch;
  const query = options.query?.trim() ?? "";
  const section = options.section;

  const rootIndex = await fetchAllowlistedText(
    new URL(ROOT_INDEX_PATH, DOCS_ORIGIN),
    fetchFn,
  );
  if (!rootIndex.ok) {
    return `❌ Could not load the CarsXE docs index (${DOCS_ORIGIN}${ROOT_INDEX_PATH}): ${rootIndex.error}`;
  }

  let entries = parseLlmsIndex(rootIndex.text);
  let usedIndex = `${DOCS_ORIGIN}${ROOT_INDEX_PATH}`;

  if (section) {
    const sectionPath = SECTION_INDEX[section];
    const sectionIndex = await fetchAllowlistedText(
      new URL(sectionPath, DOCS_ORIGIN),
      fetchFn,
    );
    if (sectionIndex.ok) {
      entries = parseLlmsIndex(sectionIndex.text);
      usedIndex = `${DOCS_ORIGIN}${sectionPath}`;
    } else {
      entries = entries.filter((entry) =>
        entry.url.includes(`/docs/${section}/`),
      );
    }
  }

  entries = mergeEntries(entries, builtInCodeGenPages());

  const matches = query ? searchDocsEntries(entries, query) : searchDocsEntries(entries, "");
  return formatSearchResults({
    query,
    section,
    indexUrl: usedIndex,
    matches: matches.slice(0, query ? 12 : 40),
    total: matches.length,
  });
}

export async function getCarsxeDocs(
  path: string,
  fetchFn: DocsFetch = fetch,
): Promise<string> {
  const resolved = resolveDocsUrl(path);
  if (!resolved.ok) {
    return `❌ ${resolved.error}`;
  }

  let result = await fetchAllowlistedText(resolved.url, fetchFn);
  if (
    !result.ok &&
    resolved.kind === "page" &&
    !resolved.url.pathname.endsWith(".md")
  ) {
    const markdownUrl = new URL(resolved.url.href);
    markdownUrl.pathname = `${markdownUrl.pathname}.md`;
    result = await fetchAllowlistedText(markdownUrl, fetchFn);
  }

  if (!result.ok) {
    return `❌ Failed to fetch ${resolved.url.href}: ${result.error}`;
  }

  if (looksLikeHtml(result.text, result.contentType) && resolved.kind === "page") {
    return `❌ ${resolved.url.href} returned HTML instead of Markdown. Retry with a .md path such as ${toMarkdownHref(resolved.url)}.`;
  }

  const body = canonicalizeDocsLinks(maybeFenceOpenApi(result.text, resolved.kind, result.contentType));
  const truncated = truncateDocs(body);
  const canonical = toCanonicalHref(resolved.url);

  return [
    `# ${pageHeading(resolved.url, resolved.kind)}`,
    "",
    `Source: ${canonical}`,
    `Markdown: ${toMarkdownHref(resolved.url)}`,
    "",
    truncated,
  ].join("\n");
}

async function fetchAllowlistedText(
  url: URL,
  fetchFn: DocsFetch,
): Promise<{ ok: true; text: string; contentType: string } | { ok: false; error: string }> {
  const resolved = resolveDocsUrl(url.href);
  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }

  try {
    const response = await fetchFn(resolved.url, {
      headers: {
        Accept:
          resolved.kind === "openapi"
            ? "application/yaml, application/json;q=0.9, text/plain;q=0.8, */*;q=0.1"
            : "text/markdown, text/plain;q=0.9, application/json;q=0.6, */*;q=0.1",
        "User-Agent": "carsxe-mcp-server",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const text = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    return { ok: true, text, contentType };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return { ok: false, error: message };
  }
}

function parseUserDocsInput(input: string): URL {
  if (/^https?:\/\//i.test(input)) {
    return new URL(input);
  }
  if (input.startsWith("//")) {
    return new URL(`https:${input}`);
  }
  if (/^docs\.carsxe\.com\//i.test(input)) {
    return new URL(`https://${input}`);
  }

  const withSlash = input.startsWith("/") ? input : `/${input}`;
  return new URL(prefixDocsPath(withSlash), DOCS_ORIGIN);
}

function prefixDocsPath(path: string): string {
  if (
    path === "/docs" ||
    path.startsWith("/docs/") ||
    path.startsWith("/api/") ||
    path.startsWith("/.well-known/") ||
    ALLOWED_PATHS.has(path.split("?")[0] ?? path)
  ) {
    return path;
  }

  const section = DOCS_SECTIONS.find(
    (name) => path === `/${name}` || path.startsWith(`/${name}/`),
  );
  if (section) {
    return `/docs${path}`;
  }

  return `/docs${path}`;
}

function isAllowedDocsPath(pathname: string): boolean {
  if (ALLOWED_PATHS.has(pathname)) return true;
  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix),
  );
}

function maybeAppendMarkdown(url: URL): URL {
  const next = new URL(url.href);
  const path = next.pathname;
  const isDocsPage =
    path === "/docs" ||
    (path.startsWith("/docs/") && !path.endsWith("/llms.txt") && !path.endsWith("/llms-full.txt"));
  if (isDocsPage && !/\.(md|txt|json|xml|ya?ml)$/i.test(path)) {
    next.pathname = `${path}.md`;
  }
  return next;
}

function classifyDocsUrl(url: URL): DocsPageKind {
  if (url.pathname.endsWith("llms.txt") || url.pathname.endsWith("llms-full.txt")) {
    return "index";
  }
  if (
    url.pathname === "/api/openapi" ||
    (url.pathname === "/api/docs" && url.searchParams.get("format") === "openapi")
  ) {
    return "openapi";
  }
  if (url.pathname === "/docs" || url.pathname.startsWith("/docs/")) {
    return "page";
  }
  return "other";
}

function addEntry(entries: Map<string, DocsPageRef>, entry: DocsPageRef): void {
  const key = canonicalEntryKey(entry.url);
  const existing = entries.get(key);
  if (!existing) {
    entries.set(key, entry);
    return;
  }
  if (entry.description.length > existing.description.length) {
    entries.set(key, { ...existing, description: entry.description, title: existing.title || entry.title });
  }
}

function mergeEntries(base: DocsPageRef[], extras: DocsPageRef[]): DocsPageRef[] {
  const entries = new Map<string, DocsPageRef>();
  for (const entry of [...base, ...extras]) {
    addEntry(entries, entry);
  }
  return [...entries.values()];
}

function canonicalEntryKey(href: string): string {
  try {
    const url = new URL(href);
    url.hash = "";
    if (url.pathname.endsWith(".md")) {
      url.pathname = url.pathname.slice(0, -3);
    }
    return url.href;
  } catch {
    return href;
  }
}

function titleFromUrl(url: URL): string {
  if (classifyDocsUrl(url) === "openapi") return "OpenAPI schema";
  const slug = url.pathname.replace(/\.md$/, "").split("/").filter(Boolean).pop();
  if (!slug) return url.href;
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9#+.]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set<string>();
  for (const token of tokens) {
    expanded.add(token);
    for (const alias of TOKEN_ALIASES[token] ?? []) {
      expanded.add(alias);
    }
  }
  return [...expanded];
}

function scoreEntry(entry: DocsPageRef, tokens: string[]): number {
  const title = entry.title.toLowerCase();
  const description = entry.description.toLowerCase();
  const url = entry.url.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (title === token || title.split(/\s+/).includes(token)) score += 5;
    else if (includesToken(title, token)) score += 3;
    if (includesToken(url, token)) score += 2;
    if (includesToken(description, token)) score += 1;
  }

  if (isChangelog(entry.url)) score -= 2;
  return score;
}

function includesToken(haystack: string, token: string): boolean {
  if (haystack.includes(token)) return true;
  if (token.length < 3) return false;
  return haystack
    .split(/[^a-z0-9]+/i)
    .some((word) => word.startsWith(token) || (token.startsWith(word) && word.length >= 4));
}

function isChangelog(url: string): boolean {
  return url.includes("/docs/changelogs/");
}

function builtInCodeGenPages(): DocsPageRef[] {
  return [
    {
      title: "Get Started",
      url: `${DOCS_ORIGIN}/docs/get-started.md`,
      description: "Authenticate and make a first CarsXE API request.",
    },
    {
      title: "OpenAPI schema",
      url: OPENAPI_URL,
      description: "Machine-readable OpenAPI schema for generating client code.",
    },
    {
      title: "Agents & AI",
      url: `${DOCS_ORIGIN}/docs/guides/agents.md`,
      description: "Agent-readable docs, markdown routes, and API call patterns.",
    },
    {
      title: "Node.js SDK",
      url: `${DOCS_ORIGIN}/docs/sdks/node.md`,
      description: "Official CarsXE SDK for Node.js and TypeScript.",
    },
  ];
}

function formatSearchResults(options: {
  query: string;
  section?: DocsSection;
  indexUrl: string;
  matches: DocsPageRef[];
  total: number;
}): string {
  const { query, section, indexUrl, matches, total } = options;
  const lines = [
    `# CarsXE docs ${query ? "search" : "index"}`,
    "",
    `Canonical host: ${DOCS_ORIGIN} (never carsxe.com/docs)`,
    `Index: ${indexUrl}`,
  ];

  if (section) lines.push(`Section: ${section}`);
  if (query) lines.push(`Query: \`${query}\``);
  lines.push("");

  if (matches.length === 0) {
    lines.push("No matching pages. Try a product name (`specifications`), an SDK (`node`, `python`), or omit the query to list the index.");
    lines.push("");
    lines.push("Code-generation shortcuts for `get_carsxe_docs`: `get-started`, `openapi`, `agents`, `node`.");
    return lines.join("\n");
  }

  lines.push(query ? `## Matches (${matches.length} of ${total})` : "## Pages");
  lines.push("");

  for (const match of matches) {
    const canonical = toCanonicalHref(new URL(match.url));
    const markdown = toMarkdownHref(new URL(match.url));
    lines.push(`### [${match.title}](${canonical})`);
    if (match.description) lines.push(match.description);
    lines.push(`- Markdown: ${markdown}`);
    lines.push(`- Fetch with \`get_carsxe_docs\` path \`${toToolPath(match.url)}\``);
    lines.push("");
  }

  lines.push("## Next step");
  lines.push(
    "Call `get_carsxe_docs` with a match path (or shortcuts `get-started`, `openapi`, `agents`, `node`) to load official Markdown before writing CarsXE client code.",
  );
  return lines.join("\n");
}

function toCanonicalHref(url: URL): string {
  const canonical = new URL(url.href);
  if (canonical.pathname.endsWith(".md") && canonical.pathname !== "/docs.md") {
    canonical.pathname = canonical.pathname.slice(0, -3);
  }
  return canonical.href;
}

function toMarkdownHref(url: URL): string {
  if (classifyDocsUrl(url) !== "page") return url.href;
  if (url.pathname.endsWith(".md")) return url.href;
  const markdown = new URL(url.href);
  markdown.pathname = `${markdown.pathname}.md`;
  return markdown.href;
}

function toToolPath(href: string): string {
  const url = new URL(href);
  if (classifyDocsUrl(url) === "openapi") return "openapi";
  const path = url.pathname.replace(/^\//, "");
  return path.endsWith(".md") ? path : path;
}

function pageHeading(url: URL, kind: DocsPageKind): string {
  if (kind === "openapi") return "CarsXE OpenAPI schema";
  if (kind === "index") return "CarsXE docs index";
  return titleFromUrl(url);
}

function maybeFenceOpenApi(text: string, kind: DocsPageKind, contentType: string): string {
  if (kind !== "openapi") return text;
  if (text.trimStart().startsWith("```")) return text;
  const lang = contentType.includes("json") || text.trimStart().startsWith("{") ? "json" : "yaml";
  return `\`\`\`${lang}\n${text.trimEnd()}\n\`\`\``;
}

function looksLikeHtml(text: string, contentType: string): boolean {
  if (contentType.includes("text/html")) return true;
  const start = text.trimStart().slice(0, 64).toLowerCase();
  return start.startsWith("<!doctype html") || start.startsWith("<html");
}

function truncateDocs(text: string): string {
  if (text.length <= MAX_DOCS_CHARS) return text;
  return `${text.slice(0, MAX_DOCS_CHARS)}\n\n… truncated after ${MAX_DOCS_CHARS} characters. Fetch a more specific page if you need the rest.\n`;
}
