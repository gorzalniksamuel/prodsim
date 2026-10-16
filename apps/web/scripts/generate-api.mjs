// Generates openapi/openapi.json (from the FastAPI app) and src/lib/api/schema.d.ts.
// `--check` regenerates into a temp dir and exits 1 if the committed files differ.
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backend = resolve(root, "../../backend");
const check = process.argv.includes("--check");

const committed = {
  spec: join(root, "openapi", "openapi.json"),
  types: join(root, "src", "lib", "api", "schema.d.ts"),
};

function run(cmd, args, cwd = root) {
  const res = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  if (res.status !== 0) {
    console.error(`command failed: ${cmd} ${args.join(" ")}`);
    throw new Error("generation failed");
  }
}

const tmp = check ? mkdtempSync(join(tmpdir(), "prodsim-api-")) : null;
const target = check
  ? { spec: join(tmp, "openapi.json"), types: join(tmp, "schema.d.ts") }
  : committed;

try {
  mkdirSync(dirname(target.spec), { recursive: true });
  mkdirSync(dirname(target.types), { recursive: true });
  run("uv", ["run", "--project", backend, "python", "-m", "prodsim.api.openapi_export", target.spec]);
  run(join(root, "node_modules", ".bin", "openapi-typescript"), [target.spec, "-o", target.types]);

  if (check) {
    const drift = Object.keys(committed).filter((k) => {
      try {
        return readFileSync(committed[k], "utf8") !== readFileSync(target[k], "utf8");
      } catch {
        return true;
      }
    });
    if (drift.length > 0) {
      console.error(
        `API client is out of date (${drift.map((k) => committed[k]).join(", ")}). ` +
          "Run `npm run api:generate` and commit the result.",
      );
      process.exitCode = 1;
    } else {
      console.log("API client is up to date.");
    }
  }
} finally {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
}
