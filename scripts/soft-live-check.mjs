#!/usr/bin/env node
// Lightweight safeguard check for the soft-live private beta.
// Intentionally simple — a handful of file-existence and content checks,
// not a full test suite. Exits non-zero if anything fails.

import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  [PASS] ${label}`);
  } else {
    console.log(`  [FAIL] ${label}`);
    failures += 1;
  }
}

function fileExists(relativePath) {
  return existsSync(path.join(rootDir, relativePath));
}

console.log("Soft-live safeguard check\n");

console.log("Required files:");
check("src/app/robots.ts exists", fileExists("src/app/robots.ts"));
check("src/app/layout.tsx exists", fileExists("src/app/layout.tsx"));
check("docs/SECURITY_REVIEW.md exists", fileExists("docs/SECURITY_REVIEW.md"));
check("docs/DEPLOYMENT.md exists", fileExists("docs/DEPLOYMENT.md"));
check("docs/SOFT_LIVE_CHECKLIST.md exists", fileExists("docs/SOFT_LIVE_CHECKLIST.md"));
check(".env.example exists", fileExists(".env.example"));

console.log("\nNo sitemap:");
check(
  "no sitemap.ts/sitemap.xml in src/app",
  !fileExists("src/app/sitemap.ts") && !fileExists("src/app/sitemap.xml"),
);

console.log("\nGit tracking:");
try {
  const tracked = execSync("git ls-files", { cwd: rootDir, encoding: "utf8" });
  const trackedFiles = tracked.split("\n").map((line) => line.trim());
  const envLocalTracked = trackedFiles.some((file) => /(^|\/)\.env\.local$/.test(file));
  check("no .env.local tracked by git", !envLocalTracked);
} catch (error) {
  console.log(`  [SKIP] git not available: ${error.message}`);
}

console.log("\nRoot layout / robots content:");
const layoutSource = readFileSync(path.join(rootDir, "src/app/layout.tsx"), "utf8");
check("layout.tsx sets robots index:false", /index:\s*false/.test(layoutSource));
check("layout.tsx sets robots follow:false", /follow:\s*false/.test(layoutSource));

const robotsSource = readFileSync(path.join(rootDir, "src/app/robots.ts"), "utf8");
check("robots.ts disallows crawling", /disallow/i.test(robotsSource));

console.log("\npackage.json scripts:");
const pkg = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
check("dev script exists", Boolean(pkg.scripts?.dev));
check("build script exists", Boolean(pkg.scripts?.build));
check("lint script exists", Boolean(pkg.scripts?.lint));
check("check:soft-live script exists", Boolean(pkg.scripts?.["check:soft-live"]));

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
