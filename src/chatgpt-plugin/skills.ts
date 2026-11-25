import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PROHIBITION =
  "ChatGPT signs the user in with OAuth. Never ask the user for an API key, token, or password.";

/** Rewrite Claude/Cursor skill copy so the ChatGPT package never asks for an API key. */
export function sanitizeSkillMarkdown(markdown: string, skillName: string): string {
  let text = markdown
    .replaceAll(
      "Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.",
      PROHIBITION,
    )
    .replaceAll("Auth stays API key / OAuth. ", `${PROHIBITION} `);

  if (skillName === "ownership") {
    text +=
      "\n\n## Privacy\n\n" +
      "`get_ownership_by_person` and `get_ownership_by_address` return personal data about other people, including name, age, gender, street address, email, phone, and demographics. Call them only when the user asks for that lookup.\n";
  }
  return text;
}

/**
 * A skill asks for an API key when it mentions one outside the explicit
 * prohibition sentence. That sentence is allowed because it tells the model
 * not to ask.
 */
export function skillAsksForApiKey(markdown: string): string | null {
  for (const line of markdown.split(/\r?\n/)) {
    const remaining = line.replace(/never ask the user for an api key/gi, "");
    if (/api[-_ ]?key/i.test(remaining) || /x-api-key/i.test(remaining)) {
      return line.trim();
    }
  }
  return null;
}

export function loadSanitizedSkills(skillsRoot: string): { name: string; markdown: string }[] {
  const names = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
  return names.map((name) => ({
    name,
    markdown: sanitizeSkillMarkdown(
      readFileSync(join(skillsRoot, name, "SKILL.md"), "utf8"),
      name,
    ),
  }));
}
