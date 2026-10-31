import { mkdirSync, copyFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const bundle = path.join(root, "workbuddy");
mkdirSync(path.join(bundle, "skills/dogcare-companion/references"), { recursive: true });
copyFileSync(path.join(root, "schemas/assess-request.schema.json"), path.join(bundle, "skills/dogcare-companion/references/assess-request.schema.json"));
copyFileSync(path.join(root, "knowledge/questionnaire.json"), path.join(bundle, "skills/dogcare-companion/references/questionnaire.json"));
copyFileSync(path.join(root, "public/images/default-dog-avatar.png"), path.join(bundle, "icon.png"));
mkdirSync(path.join(root, "public/downloads"), { recursive: true });
const output = path.join(root, "public/downloads/dogcare-workbuddy.zip");
rmSync(output, { force: true });
execFileSync("zip", ["-X", "-q", "-r", output, "connector-meta.json", "mcp.json", "icon.png", "skills", "README.md"], { cwd: bundle });
console.log("Created public/downloads/dogcare-workbuddy.zip (no keys, records or private books).");
