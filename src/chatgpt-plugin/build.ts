import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { CHATGPT_EXCLUDED_OWNERSHIP_TOOLS } from "../chatgptSurface.js";
import { loadSanitizedSkills } from "./skills.js";
import { validateZip } from "./validate.js";
import { createZip, type ZipEntry } from "./zip.js";

export function repoRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "../..");
}

function copyTree(source: string, destination: string): void {
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (entry.name === ".DS_Store" || entry.name === "skills") continue;
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) writeFileSync(to, readFileSync(from));
  }
}

/** Assemble the ChatGPT package: chatgpt/ plus sanitized skills. */
export function stagePackage(destination: string, root = repoRoot()): void {
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  copyTree(join(root, "chatgpt"), destination);
  for (const skill of loadSanitizedSkills(join(root, "skills"))) {
    if (isOwnershipSkill(skill.name, skill.markdown)) continue;
    const dir = join(destination, "skills", skill.name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), skill.markdown);
  }
}

export function listPackageFiles(root: string): ZipEntry[] {
  const files: ZipEntry[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        files.push({
          path: relative(root, full).split(sep).join("/"),
          data: readFileSync(full),
        });
      }
    }
  };
  walk(root);
  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}

function isOwnershipSkill(name: string, markdown: string): boolean {
  if (name === "ownership") return true;
  return CHATGPT_EXCLUDED_OWNERSHIP_TOOLS.some((tool) => markdown.includes(tool));
}

export function buildChatgptPlugin(outputPath?: string): { zipPath: string; warnings: string[] } {
  const root = repoRoot();
  const staging = mkdtempSync(join(tmpdir(), "carsxe-chatgpt-stage-"));
  try {
    stagePackage(staging, root);
    const buffer = createZip(listPackageFiles(staging));
    const report = validateZip(buffer);
    if (report.errors.length > 0) {
      throw new Error(report.errors.join("\n"));
    }
    const manifest = JSON.parse(readFileSync(join(staging, "plugin.json"), "utf8")) as {
      version: string;
    };
    const zipPath = outputPath ?? join(root, "dist", `carsxe-chatgpt-plugin-${manifest.version}.zip`);
    mkdirSync(dirname(zipPath), { recursive: true });
    writeFileSync(zipPath, buffer);
    const zipTest = spawnSync("python3", ["-m", "zipfile", "-t", zipPath], { encoding: "utf8" });
    if (zipTest.status !== 0) {
      throw new Error(zipTest.stderr || zipTest.stdout || "python zipfile rejected the archive");
    }
    return { zipPath, warnings: report.warnings };
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  return Boolean(entry && (entry.endsWith("build.ts") || entry.endsWith("build.js")));
}

if (isDirectRun()) {
  try {
    const result = buildChatgptPlugin();
    console.log(result.zipPath);
    for (const warning of result.warnings) console.log(`warning: ${warning}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
