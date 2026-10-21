import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(resolve(root, "manifest.json"), "utf-8")
);

/**
 * Files the extension needs at runtime, as referenced from manifest.json.
 */
function filesReferencedByManifest() {
  const files = new Set(["manifest.json"]);
  for (const cs of manifest.content_scripts ?? []) {
    (cs.js ?? []).forEach((f) => files.add(f));
    (cs.css ?? []).forEach((f) => files.add(f));
  }
  Object.values(manifest.icons ?? {}).forEach((f) => files.add(f));
  return files;
}

describe("npm run package", () => {
  let zipPath;
  let entries;

  beforeAll(() => {
    zipPath = execFileSync("sh", ["scripts/package.sh"], {
      cwd: root,
      encoding: "utf-8",
    }).trim();
    entries = execFileSync("unzip", ["-Z1", zipPath], {
      cwd: root,
      encoding: "utf-8",
    })
      .split("\n")
      .filter(Boolean);
  });

  it("names the zip after the manifest version", () => {
    expect(zipPath).toBe(`dist/gha-workflows-folder-v${manifest.version}.zip`);
  });

  it("puts everything under a single gha-workflows-folder/ directory", () => {
    for (const entry of entries) {
      expect(entry.startsWith("gha-workflows-folder/")).toBe(true);
    }
  });

  it("includes every file referenced by manifest.json", () => {
    for (const file of filesReferencedByManifest()) {
      expect(entries).toContain(`gha-workflows-folder/${file}`);
    }
  });

  it("includes no files other than those referenced by manifest.json", () => {
    const expected = filesReferencedByManifest();
    const files = entries
      .filter((entry) => !entry.endsWith("/"))
      .map((entry) => entry.slice("gha-workflows-folder/".length));
    for (const file of files) {
      expect(expected.has(file)).toBe(true);
    }
  });
});
