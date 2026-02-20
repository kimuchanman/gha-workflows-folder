import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(__dirname, "..", "manifest.json");

try {
  const raw = readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(raw);

  const errors = [];

  if (manifest.manifest_version !== 3) {
    errors.push(`manifest_version must be 3, got ${manifest.manifest_version}`);
  }
  if (!manifest.name) {
    errors.push("name is required");
  }
  if (!manifest.version) {
    errors.push("version is required");
  }
  if (!manifest.content_scripts?.length) {
    errors.push("content_scripts must have at least one entry");
  } else {
    const cs = manifest.content_scripts[0];
    if (!cs.matches?.length) {
      errors.push("content_scripts[0].matches is required");
    }
    if (!cs.js?.length) {
      errors.push("content_scripts[0].js is required");
    }
  }

  // Verify referenced files exist
  for (const cs of manifest.content_scripts || []) {
    for (const file of [...(cs.js || []), ...(cs.css || [])]) {
      try {
        readFileSync(resolve(__dirname, "..", file));
      } catch {
        errors.push(`Referenced file not found: ${file}`);
      }
    }
  }
  for (const [, iconPath] of Object.entries(manifest.icons || {})) {
    try {
      readFileSync(resolve(__dirname, "..", iconPath));
    } catch {
      errors.push(`Referenced icon not found: ${iconPath}`);
    }
  }

  if (errors.length > 0) {
    console.error("Manifest validation failed:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log("Manifest validation passed");
} catch (e) {
  console.error(`Failed to read/parse manifest.json: ${e.message}`);
  process.exit(1);
}
