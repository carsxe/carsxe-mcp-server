import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix, relative, resolve, sep } from "node:path";
import {
  DEMO_RECORDING_PLACEHOLDER,
  MCP_SCHEMA,
  MCP_URL,
  PLUGIN_NAME,
  PLUGIN_SCHEMA,
  PLUGIN_VERSION,
  REGISTRATION_URL,
} from "./constants.js";
import { skillAsksForApiKey } from "./skills.js";
import { readZip, type ZipEntry } from "./zip.js";

export type PackageReport = {
  errors: string[];
  warnings: string[];
};

const COMPRESSED_LIMIT = 100 * 1024 * 1024;
const ENTRY_LIMIT = 100 * 1024 * 1024;
const UNCOMPRESSED_LIMIT = 512 * 1024 * 1024;
const IMAGE_LIMIT = 5 * 1024 * 1024;

const CATEGORIES = new Set([
  "Productivity",
  "Creativity",
  "Developer Tools",
  "Business & Operations",
  "Data & Analytics",
  "Communication",
  "Education & Research",
  "Security",
  "Finance",
  "Healthcare",
  "Travel",
  "Entertainment",
  "Other",
]);

const PLUGIN_ROOT_KEYS = new Set([
  "$schema",
  "name",
  "version",
  "description",
  "author",
  "homepage",
  "repository",
  "license",
  "keywords",
  "extensions",
]);

const NAME_PATTERN = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;

const FORBIDDEN_JSON_KEYS = new Set([
  "apps",
  "hooks",
  "clientSecret",
  "client_secret",
  "test_credentials",
  "reviewer_instructions",
]);

const SECRET_PATTERNS: { code: string; pattern: RegExp }[] = [
  { code: "secrets_forbidden", pattern: /X-API-Key/i },
  { code: "secrets_forbidden", pattern: /CARSXE_API_KEY/ },
  { code: "secrets_forbidden", pattern: /clientSecret/ },
  { code: "secrets_forbidden", pattern: /BEGIN [A-Z ]*PRIVATE KEY/ },
  { code: "secrets_forbidden", pattern: /mcp_at_[A-Za-z0-9]/ },
  { code: "secrets_forbidden", pattern: /mcp_rt_[A-Za-z0-9]/ },
  { code: "secrets_forbidden", pattern: /Bearer\s+[A-Za-z0-9._-]{12,}/ },
  { code: "reviewer_credentials_forbidden", pattern: /test_credentials/ },
  { code: "reviewer_credentials_forbidden", pattern: /reviewer_instructions/ },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function oneLine(value: string): boolean {
  return !/[\r\n\u2028\u2029]/.test(value);
}

function supportedText(value: string, allowNewlines: boolean): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    const newline = code === 10 || code === 13;
    if (code === 0x2028 || code === 0x2029 || code === 0x7f) return false;
    if (code < 0x20 && !(allowNewlines && newline)) return false;
  }
  return true;
}

function normalizePrompt(value: string): string {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function contrastAgainstWhite(hex: string): number {
  const r = channel(Number.parseInt(hex.slice(1, 3), 16));
  const g = channel(Number.parseInt(hex.slice(3, 5), 16));
  const b = channel(Number.parseInt(hex.slice(5, 7), 16));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (luminance + 0.05);
}

function httpsProblem(value: string, maxLength: number): string | null {
  if (value.length > maxLength) return `must be ${maxLength} characters or fewer`;
  if (!oneLine(value) || !supportedText(value, false)) return "must use supported text";
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "must be an HTTPS URL";
  }
  if (url.protocol !== "https:" || url.hostname.length === 0) return "must be an HTTPS URL";
  if (url.username || url.password) return "must not contain credentials";
  if (value.includes("TODO") && value !== DEMO_RECORDING_PLACEHOLDER) {
    return "still contains a TODO placeholder";
  }
  return null;
}

function pngSize(data: Buffer): { width: number; height: number } | null {
  if (data.length < 24) return null;
  if (data[0] !== 0x89 || data.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function walkJsonKeys(value: unknown, visit: (key: string) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) walkJsonKeys(item, visit);
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    visit(key);
    walkJsonKeys(child, visit);
  }
}

function readJson(file: string, label: string, errors: string[]): unknown {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    errors.push(`${label}: file is missing or unreadable`);
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    errors.push(`${label}: must contain valid JSON`);
    return null;
  }
}

function requireString(
  value: unknown,
  code: string,
  errors: string[],
  options: { max: number; allowNewlines?: boolean; oneLine?: boolean },
): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${code}: required non-empty string`);
    return false;
  }
  if ((options.oneLine ?? !options.allowNewlines) && !oneLine(value)) {
    errors.push(`${code}: must fit on one line`);
    return false;
  }
  if (!supportedText(value, options.allowNewlines === true)) {
    errors.push(`${code}: must use supported text`);
    return false;
  }
  if (value.length > options.max) {
    errors.push(`${code}: must be ${options.max} characters or fewer`);
    return false;
  }
  return true;
}

function checkAsset(root: string, declared: unknown, field: string, errors: string[]): void {
  const code = field === "logo" ? "plugin_logo_path_missing" : "plugin_composer_icon_path_missing";
  if (typeof declared !== "string" || declared.length === 0) {
    errors.push(`${code}: ${field} is required`);
    return;
  }
  if (!declared.startsWith("./")) {
    errors.push(`branding_asset_path_missing_root_prefix: ${field} must start with ./`);
    return;
  }
  if (declared.includes("\\") || declared.split("/").includes("..")) {
    errors.push(`declared_asset_path_unsafe: ${field} must stay inside the package`);
    return;
  }
  const relativePath = declared.slice(2);
  const absolute = resolve(root, relativePath);
  const rootResolved = resolve(root);
  if (absolute !== rootResolved && !absolute.startsWith(`${rootResolved}${sep}`)) {
    errors.push(`declared_asset_path_outside_package: ${field} is outside the package`);
    return;
  }
  let data: Buffer;
  try {
    data = readFileSync(absolute);
  } catch {
    errors.push(`declared_asset_file_missing: ${field} file does not exist`);
    return;
  }
  if (data.length > IMAGE_LIMIT) {
    errors.push(`image_file_too_large: ${field} must be 5 MiB or less`);
    return;
  }
  if (!declared.toLowerCase().endsWith(".png")) {
    errors.push(`image_file_format_unsupported: ${field} must be a PNG for this package`);
    return;
  }
  const size = pngSize(data);
  if (!size) {
    errors.push(`raster_image_decode_failed: ${field} is not a PNG`);
    return;
  }
  if (size.width !== size.height) {
    errors.push(`raster_image_not_square: ${field} must be square`);
    return;
  }
  if (size.width < 48) {
    errors.push(`raster_image_dimensions_too_small: ${field} must be at least 48x48`);
  }
  if (size.width > 4096) {
    errors.push(`raster_image_dimensions_too_large: ${field} must be at most 4096x4096`);
  }
}

function validateInterface(root: string, iface: unknown, errors: string[]): void {
  if (!isRecord(iface)) {
    errors.push("plugin_interface_wrong_type: interface must be an object");
    return;
  }
  requireString(iface.displayName, "plugin_display_name_too_long", errors, { max: 30 });
  requireString(iface.shortDescription, "plugin_short_description_too_long", errors, { max: 30 });
  requireString(iface.longDescription, "plugin_long_description_too_long", errors, {
    max: 4000,
    allowNewlines: true,
    oneLine: false,
  });
  requireString(iface.developerName, "plugin_developer_name_too_long", errors, { max: 80 });
  if (iface.category !== undefined && !CATEGORIES.has(String(iface.category))) {
    errors.push(
      "plugin_category_unknown: category must be one of the documented directory categories",
    );
  }
  if (!Array.isArray(iface.capabilities) || iface.capabilities.length > 20) {
    errors.push("plugin_capabilities_too_many: capabilities must be a list of at most 20");
  } else {
    for (const capability of iface.capabilities) {
      requireString(capability, "plugin_capability_invalid", errors, { max: 120 });
    }
  }
  for (const field of ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]) {
    const value = iface[field];
    if (typeof value !== "string") {
      errors.push(`plugin_${field}_missing: ${field} is required`);
      continue;
    }
    const problem = httpsProblem(value, 1024);
    if (problem) errors.push(`plugin_${field}_format: ${field} ${problem}`);
  }
  if (!Array.isArray(iface.defaultPrompt) || iface.defaultPrompt.length === 0) {
    errors.push("plugin_default_prompt_empty: provide up to 3 starter prompts");
  } else if (iface.defaultPrompt.length > 3) {
    errors.push("plugin_default_prompt_too_many: at most 3 starter prompts");
  } else {
    const seen = new Set<string>();
    for (const prompt of iface.defaultPrompt) {
      if (!requireString(prompt, "plugin_default_prompt_too_long", errors, { max: 128 })) continue;
      if (/@\w/.test(prompt)) {
        errors.push("plugin_default_prompt_mention: starter prompts must not contain @mentions");
      }
      const normalized = normalizePrompt(prompt);
      if (seen.has(normalized)) {
        errors.push("plugin_default_prompt_duplicate: starter prompts must be unique");
      }
      seen.add(normalized);
    }
  }
  if (iface.brandColor !== undefined) {
    if (typeof iface.brandColor !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(iface.brandColor)) {
      errors.push("plugin_brand_color_format: brandColor must be a six-digit hex color");
    } else if (contrastAgainstWhite(iface.brandColor) < 2) {
      errors.push("plugin_brand_color_contrast: brandColor must have at least 2:1 contrast against white");
    }
  }
  checkAsset(root, iface.logo, "logo", errors);
  checkAsset(root, iface.composerIcon, "composerIcon", errors);
}

function validateReview(review: unknown, errors: string[], warnings: string[]): void {
  if (!isRecord(review) || !isRecord(review.test_cases)) {
    errors.push("review_test_cases_missing: review.test_cases is required");
    return;
  }
  const positive = review.test_cases.positive;
  const negative = review.test_cases.negative;
  if (!Array.isArray(positive) || positive.length !== 5) {
    errors.push("review_positive_count: exactly 5 positive test cases are required");
  } else {
    for (const testCase of positive) {
      if (!isRecord(testCase)) {
        errors.push("review_positive_case: each positive case must be an object");
        continue;
      }
      requireString(testCase.description, "review_description", errors, {
        max: 4000,
        allowNewlines: true,
        oneLine: false,
      });
      requireString(testCase.prompt, "review_prompt", errors, {
        max: 4000,
        allowNewlines: true,
        oneLine: false,
      });
      requireString(testCase.tools_triggered, "review_tools_triggered", errors, { max: 1000 });
      requireString(testCase.expected_behavior, "review_expected_behavior", errors, {
        max: 4000,
        allowNewlines: true,
        oneLine: false,
      });
    }
  }
  if (!Array.isArray(negative) || negative.length !== 3) {
    errors.push("review_negative_count: exactly 3 negative test cases are required");
  } else {
    for (const testCase of negative) {
      if (!isRecord(testCase)) {
        errors.push("review_negative_case: each negative case must be an object");
        continue;
      }
      requireString(testCase.description, "review_description", errors, { max: 4000 });
      requireString(testCase.prompt, "review_prompt", errors, { max: 4000 });
    }
  }
  if (typeof review.demo_recording_url !== "string") {
    errors.push("demo_recording_url_missing: a reviewer video URL is required");
  } else if (review.demo_recording_url === DEMO_RECORDING_PLACEHOLDER) {
    warnings.push(
      "demo_recording_url is still the TODO placeholder. Replace it with a reviewer-accessible recording and rebuild before submitting for review.",
    );
  } else {
    const problem = httpsProblem(review.demo_recording_url, 1024);
    if (problem) errors.push(`demo_recording_url: ${problem}`);
  }
  if (review.commerce !== false) {
    errors.push("review_commerce: commerce must be false; this plugin does not take payment");
  }
}

function validatePluginManifest(root: string, errors: string[], warnings: string[]): void {
  const manifest = readJson(join(root, "plugin.json"), "plugin_manifest_json_malformed", errors);
  if (!isRecord(manifest)) return;
  for (const key of Object.keys(manifest)) {
    if (!PLUGIN_ROOT_KEYS.has(key)) {
      errors.push(`plugin_manifest_unknown_field: ${key} is not in the Agent Plugins schema`);
    }
  }
  if (manifest.$schema !== PLUGIN_SCHEMA) {
    errors.push("plugin_manifest_schema: $schema must be the Agent Plugins 1.0.0 plugin schema");
  }
  if (typeof manifest.name !== "string" || !NAME_PATTERN.test(manifest.name)) {
    errors.push(
      "plugin_name_format: name must be kebab-case (lowercase letters, digits, single hyphens or dots)",
    );
  } else if (manifest.name !== PLUGIN_NAME) {
    errors.push(`plugin_name_mismatch: expected package name ${PLUGIN_NAME}`);
  }
  if (typeof manifest.version !== "string" || !SEMVER_PATTERN.test(manifest.version)) {
    errors.push("plugin_version_not_semver: version must be a semantic version");
  } else if (manifest.version !== PLUGIN_VERSION) {
    errors.push(`plugin_version_not_semver: expected version ${PLUGIN_VERSION}`);
  }
  requireString(manifest.description, "plugin_description_too_long", errors, {
    max: 1024,
    allowNewlines: true,
    oneLine: false,
  });
  if (!isRecord(manifest.author) || typeof manifest.author.name !== "string") {
    errors.push("plugin_developer_missing: author.name is required");
  } else if (typeof manifest.author.url === "string") {
    const problem = httpsProblem(manifest.author.url, 2048);
    if (problem) errors.push(`plugin_author_url_not_https: author.url ${problem}`);
  }
  if (typeof manifest.homepage === "string") {
    const problem = httpsProblem(manifest.homepage, 2048);
    if (problem) errors.push(`plugin_homepage_format: homepage ${problem}`);
  }
  if (manifest.keywords !== undefined) {
    if (!Array.isArray(manifest.keywords) || manifest.keywords.length > 25) {
      errors.push("plugin_keywords_too_many: at most 25 keywords");
    }
  }
  const extensions = manifest.extensions;
  if (!isRecord(extensions) || !isRecord(extensions["com.openai"])) {
    errors.push("openai_extension_missing: extensions.com.openai is required");
    return;
  }
  const openai = extensions["com.openai"];
  walkJsonKeys(openai, (key) => {
    if (FORBIDDEN_JSON_KEYS.has(key)) {
      const code = key === "apps" || key === "hooks" ? "app_configuration_excluded" : "secrets_forbidden";
      errors.push(`${code}: plugin.json must not include ${key}`);
    }
  });
  validateInterface(root, openai.interface, errors);
  validateReview(openai.review, errors, warnings);
  const publication = openai.publication;
  if (!isRecord(publication)) {
    errors.push("publication_release_notes_missing: publication.release_notes is required");
  } else {
    requireString(publication.release_notes, "publication_release_notes", errors, {
      max: 4000,
      allowNewlines: true,
      oneLine: false,
    });
  }
}

function validateMcp(root: string, errors: string[], warnings: string[]): void {
  const manifest = readJson(join(root, "mcp.json"), "mcp_manifest_json_malformed", errors);
  if (!isRecord(manifest)) return;
  if (manifest.$schema !== MCP_SCHEMA) {
    errors.push("mcp_manifest_schema: $schema must be the Agent Plugins 1.0.0 MCP schema");
  }
  if (!isRecord(manifest.mcpServers)) {
    errors.push("mcp_servers_missing: mcpServers must be an object");
    return;
  }
  const names = Object.keys(manifest.mcpServers);
  if (names.length !== 1) {
    errors.push("mcp_server_count: the package must define exactly one MCP server");
    return;
  }
  const server = manifest.mcpServers[names[0]];
  if (!isRecord(server)) {
    errors.push("mcp_server_wrong_type: the server entry must be an object");
    return;
  }
  if (server.type !== "streamable-http") {
    errors.push("mcp_server_type: type must be streamable-http");
  }
  if (server.url !== MCP_URL) {
    errors.push(`mcp_server_url: url must be ${MCP_URL}`);
  }
  if ("headers" in server) {
    errors.push(
      "mcp_headers_forbidden: ChatGPT mcp.json must not set server headers. Keep the X-API-Key header in the repo-root mcp.json only.",
    );
  }
  const extensions = server.extensions;
  if (!isRecord(extensions) || !isRecord(extensions["com.openai"])) {
    errors.push("oauth_dcr_required: server extensions.com.openai.auth is required");
    return;
  }
  warnings.push(
    "mcp_schema_extensions: OpenAI reads OAuth from extensions.com.openai.auth on the server. The published Agent Plugins MCP schema still rejects that field (additionalProperties: false). This package follows the OpenAI docs.",
  );
  const auth = extensions["com.openai"].auth;
  if (!isRecord(auth) || auth.type !== "oauth") {
    errors.push("oauth_dcr_required: auth.type must be oauth");
    return;
  }
  walkJsonKeys(auth, (key) => {
    if (FORBIDDEN_JSON_KEYS.has(key) || key === "clientId") {
      errors.push(`secrets_forbidden: OAuth DCR auth must not include ${key}`);
    }
  });
  if (!isRecord(auth.client) || auth.client.mode !== "dcr") {
    errors.push("oauth_dcr_required: client.mode must be dcr");
  }
  if (auth.registrationUrl !== REGISTRATION_URL) {
    errors.push(`oauth_dcr_required: registrationUrl must be ${REGISTRATION_URL}`);
  }
  if (!Array.isArray(auth.baseScopes) || !auth.baseScopes.includes("mcp")) {
    errors.push("oauth_dcr_required: baseScopes must include mcp");
  }
}

function parseFrontmatter(markdown: string): { name: string; description: string; body: string } | null {
  if (!markdown.startsWith("---\n") && !markdown.startsWith("---\r\n")) return null;
  const end = markdown.indexOf("\n---", 3);
  if (end < 0) return null;
  const raw = markdown.slice(markdown.indexOf("\n") + 1, end);
  const body = markdown.slice(end + 4).trim();
  const fields: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    fields[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  if (!fields.name || !fields.description) return null;
  return { name: fields.name, description: fields.description, body };
}

function validateSkills(root: string, pluginName: string, errors: string[]): void {
  const skillsDir = join(root, "skills");
  let entries: { name: string; isDirectory: boolean }[];
  try {
    entries = readdirSync(skillsDir, { withFileTypes: true }).map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
    }));
  } catch {
    errors.push(
      "plugin_runtime_surface_missing: the ZIP must contain at least one skill under skills/",
    );
    return;
  }
  const skillDirs = entries.filter((entry) => entry.isDirectory && !entry.name.startsWith("."));
  if (skillDirs.length === 0) {
    errors.push("plugin_runtime_surface_missing: the ZIP must contain at least one skill");
  }
  const seen = new Set<string>();
  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      errors.push(`skill_directory_hidden: ${entry.name} must not be hidden`);
      continue;
    }
    if (!entry.isDirectory) {
      errors.push(`skill_manifest_nested: ${entry.name} is not a skill directory`);
      continue;
    }
    const markdown = readFileSync(join(skillsDir, entry.name, "SKILL.md"), "utf8");
    const frontmatter = parseFrontmatter(markdown);
    if (!frontmatter) {
      errors.push(`skill_frontmatter_missing: skills/${entry.name}/SKILL.md needs name and description`);
      continue;
    }
    if (frontmatter.description.length > 1024) {
      errors.push(`skill_description_too_long: ${frontmatter.name}`);
    }
    if (frontmatter.body.length === 0) {
      errors.push(`skill_body_empty: ${frontmatter.name}`);
    }
    const identity = `${pluginName}:${frontmatter.name}`;
    if (identity.length > 64) {
      errors.push(`skill_identity_too_long: ${identity}`);
    }
    if (seen.has(frontmatter.name)) {
      errors.push(`skill_identity_duplicate: ${frontmatter.name}`);
    }
    seen.add(frontmatter.name);
    const ask = skillAsksForApiKey(markdown);
    if (ask) {
      errors.push(`skill_requests_api_key: skills/${entry.name} asks for an API key (${ask})`);
    }
  }
}

function scanTextFiles(root: string, errors: string[]): void {
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      const rel = relative(root, full).split(sep).join("/");
      if (entry.isDirectory()) {
        if (entry.name === "hooks" || rel.split("/").includes("hooks")) {
          errors.push(`hooks_forbidden: ${rel} is not allowed in a directory submission`);
        }
        stack.push(full);
        continue;
      }
      if (entry.name === ".app.json" || rel.endsWith(".app.json")) {
        errors.push(`app_configuration_excluded: ${rel} must not be in the ZIP`);
      }
      if (entry.name === ".env" || entry.name.startsWith(".env.")) {
        errors.push(`secrets_forbidden: ${rel} must not be in the ZIP`);
      }
      if (!/\.(json|md|txt|yml|yaml)$/i.test(entry.name)) continue;
      const text = readFileSync(full, "utf8");
      if (text.includes(".app.json") || /["']apps["']\s*:/.test(text)) {
        errors.push(`app_configuration_excluded: ${rel} references apps or .app.json`);
      }
      for (const secret of SECRET_PATTERNS) {
        if (secret.pattern.test(text)) {
          errors.push(`${secret.code}: ${rel} contains forbidden material`);
        }
      }
    }
  }
}

export function validatePackage(root: string): PackageReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!exists(join(root, "plugin.json"))) {
    errors.push("plugin_manifest_missing: plugin.json is required at the plugin root");
    return { errors, warnings };
  }
  validatePluginManifest(root, errors, warnings);
  validateMcp(root, errors, warnings);
  validateSkills(root, PLUGIN_NAME, errors);
  scanTextFiles(root, errors);
  return { errors: unique(errors), warnings: unique(warnings) };
}

function exists(file: string): boolean {
  try {
    readFileSync(file);
    return true;
  } catch {
    return false;
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function zipPathProblem(path: string): string | null {
  if (path.length === 0) return "archive_member_path_empty";
  if (path !== path.trim()) return "archive_member_path_has_outer_whitespace";
  if (path.includes("\\")) return "archive_member_path_has_backslash";
  if (path.startsWith("/") || /^[A-Za-z]:/.test(path)) return "archive_member_path_absolute";
  const segments = path.split("/");
  if (segments.some((segment) => segment.length === 0)) return "archive_member_path_has_empty_segment";
  if (segments.includes("..")) return "archive_member_path_has_parent_segment";
  if (segments.length > 20) return "archive_member_path_too_deep";
  if (segments.includes("hooks") || path.endsWith(".app.json")) {
    return segments.includes("hooks") ? "hooks_forbidden" : "app_configuration_excluded";
  }
  return null;
}

export function validateZip(buffer: Buffer): PackageReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (buffer.length === 0) errors.push("archive_empty: archive must not be empty");
  if (buffer.length > COMPRESSED_LIMIT) errors.push("archive_too_large: ZIP must be 100 MB or less");
  let entries: ZipEntry[];
  try {
    entries = readZip(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "archive_format_not_zip";
    errors.push(message.startsWith("archive_") ? message : `archive_format_not_zip: ${message}`);
    return { errors, warnings };
  }
  if (entries.length === 0) errors.push("archive_empty: archive has no files");
  if (entries.length > 5000) errors.push("archive_too_many_entries: more than 5000 entries");
  const seen = new Set<string>();
  const folded = new Set<string>();
  let uncompressed = 0;
  for (const entry of entries) {
    const problem = zipPathProblem(entry.path);
    if (problem) errors.push(`${problem}: ${entry.path}`);
    if (seen.has(entry.path)) errors.push(`archive_member_path_duplicate: ${entry.path}`);
    seen.add(entry.path);
    const normalized = entry.path.normalize("NFC").toLowerCase();
    if (folded.has(normalized)) {
      errors.push(`archive_member_path_normalization_collision: ${entry.path}`);
    }
    folded.add(normalized);
    if (entry.data.length > ENTRY_LIMIT) {
      errors.push(`archive_member_too_large: ${entry.path}`);
    }
    uncompressed += entry.data.length;
  }
  if (uncompressed > UNCOMPRESSED_LIMIT) {
    errors.push("archive_uncompressed_too_large: extracted archive must be 512 MiB or less");
  }
  const topLevel = new Set(entries.map((entry) => entry.path.split("/")[0]));
  const hasRootManifest = entries.some((entry) => entry.path === "plugin.json");
  if (!hasRootManifest) {
    const dirs = [...topLevel].filter((name) =>
      entries.some((entry) => entry.path.startsWith(`${name}/`)),
    );
    if (dirs.length !== 1 || !entries.some((entry) => entry.path === `${dirs[0]}/plugin.json`)) {
      errors.push(
        "plugin_root_ambiguous: ZIP must contain exactly one plugin root, at the archive root or in one top-level directory",
      );
    } else if ([...topLevel].some((name) => name !== dirs[0])) {
      errors.push("plugin_root_has_siblings: a top-level plugin directory must not have sibling files");
    }
  }
  if (errors.length > 0) return { errors: unique(errors), warnings };

  const temp = mkdtempSync(join(tmpdir(), "carsxe-chatgpt-zip-"));
  try {
    const pluginRoot = hasRootManifest
      ? temp
      : join(temp, entries.find((entry) => entry.path.endsWith("/plugin.json"))?.path.split("/")[0] ?? "");
    for (const entry of entries) {
      const destination = join(temp, ...entry.path.split("/"));
      const relativeToTemp = relative(temp, destination);
      if (relativeToTemp.startsWith("..") || posix.isAbsolute(entry.path)) continue;
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, entry.data);
    }
    const report = validatePackage(pluginRoot);
    return {
      errors: unique([...errors, ...report.errors]),
      warnings: unique([...warnings, ...report.warnings]),
    };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
