// Bootstrap entry point for hosts that run `node index.js` directly instead
// of `npm start` (which would otherwise trigger the "prestart" TypeScript
// build automatically). This compiles src/ -> dist/ first, then launches
// the real compiled bot from dist/index.js.
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const distEntry = path.join(__dirname, "dist", "index.js");

try {
  console.log("[bootstrap] Compiling TypeScript...");
  execSync("npx tsc", { stdio: "inherit", cwd: __dirname });
} catch (err) {
  console.error("[bootstrap] TypeScript compilation failed:", err.message);
  process.exit(1);
}

if (!fs.existsSync(distEntry)) {
  console.error(`[bootstrap] Compiled entry point not found at ${distEntry} after build.`);
  process.exit(1);
}

console.log("[bootstrap] Starting bot...");
require(distEntry);
