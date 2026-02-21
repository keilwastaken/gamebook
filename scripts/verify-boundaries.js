#!/usr/bin/env node
/* global __dirname */

/**
 * Enforces import-layer boundaries for production source files.
 *
 * Scope intentionally excludes tests to keep mocking ergonomics flexible while
 * still guarding runtime architecture.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_ROOTS = ["app", "components", "constants", "hooks", "lib", "utils"];
const EXCLUDED_DIRS = new Set([
  ".git",
  ".expo",
  ".screenshots",
  "android",
  "artifacts",
  "coverage",
  "dist",
  "docs",
  "e2e",
  "ios",
  "node_modules",
  "recordings",
  "reports",
  "tmp",
]);
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

let violations = 0;

function isTestFile(filePath) {
  return (
    filePath.includes(`${path.sep}__tests__${path.sep}`) ||
    filePath.endsWith(".test.ts") ||
    filePath.endsWith(".test.tsx") ||
    filePath.endsWith(".spec.ts") ||
    filePath.endsWith(".spec.tsx")
  );
}

function walkDir(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, files);
      continue;
    }
    const ext = path.extname(entry.name);
    if (!CODE_EXTENSIONS.has(ext)) continue;
    if (entry.name.endsWith(".d.ts")) continue;
    if (isTestFile(fullPath)) continue;
    files.push(fullPath);
  }
}

function getLayer(filePath) {
  const rel = path.relative(ROOT, filePath);
  if (rel.startsWith("..")) return null;
  const first = rel.split(path.sep)[0];
  return SOURCE_ROOTS.includes(first) ? first : null;
}

function parseSpecifiers(source) {
  const specifiers = [];
  const fromRe = /\b(?:import|export)\s+(?:type\s+)?[\s\S]*?\bfrom\s+["']([^"']+)["']/g;
  const sideEffectRe = /\bimport\s+["']([^"']+)["']/g;
  const requireRe = /\brequire\(\s*["']([^"']+)["']\s*\)/g;

  let match;
  while ((match = fromRe.exec(source)) !== null) specifiers.push(match[1]);
  while ((match = sideEffectRe.exec(source)) !== null) specifiers.push(match[1]);
  while ((match = requireRe.exec(source)) !== null) specifiers.push(match[1]);

  return specifiers;
}

function resolveImport(sourceFile, specifier) {
  if (specifier.startsWith("@/")) {
    return path.resolve(ROOT, specifier.slice(2));
  }
  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(sourceFile), specifier);
  }
  return null;
}

function report(sourceFile, specifier, reason) {
  const rel = path.relative(ROOT, sourceFile);
  console.error(`BOUNDARY VIOLATION: ${rel}`);
  console.error(`  import: ${specifier}`);
  console.error(`  reason: ${reason}`);
  violations += 1;
}

function checkRule(sourceFile, sourceLayer, specifier, targetLayer) {
  if (!targetLayer) return;

  if (
    ["components", "lib", "hooks", "constants", "utils"].includes(sourceLayer) &&
    targetLayer === "app"
  ) {
    report(sourceFile, specifier, "Only app/ may import app/ modules.");
    return;
  }

  if (sourceLayer === "lib" && targetLayer === "components") {
    report(sourceFile, specifier, "lib/ cannot depend on UI components.");
    return;
  }

  if (sourceLayer === "constants" && targetLayer !== "constants") {
    report(sourceFile, specifier, "constants/ must stay leaf-like and self-contained.");
    return;
  }

  if (sourceLayer === "hooks" && targetLayer === "components") {
    report(sourceFile, specifier, "hooks/ should not depend on components/.");
    return;
  }
}

function checkBoardEngineBoundary(sourceFile, specifier) {
  if (specifier !== "@/lib/board/engine" && specifier !== "@/lib/board/engine.ts") return;
  const rel = path.relative(ROOT, sourceFile).replaceAll(path.sep, "/");

  if (rel === "lib/game-store.ts") return;
  if (rel.startsWith("lib/board/")) return;

  report(
    sourceFile,
    specifier,
    "Only lib/game-store.ts and lib/board/* may import the board engine directly."
  );
}

function run() {
  const files = [];
  for (const dir of SOURCE_ROOTS) {
    const full = path.join(ROOT, dir);
    if (fs.existsSync(full)) walkDir(full, files);
  }

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, "utf8");
    const sourceLayer = getLayer(filePath);
    if (!sourceLayer) continue;

    const imports = parseSpecifiers(source);
    for (const specifier of imports) {
      checkBoardEngineBoundary(filePath, specifier);

      const resolved = resolveImport(filePath, specifier);
      if (!resolved) continue;
      const targetLayer = getLayer(resolved);
      checkRule(filePath, sourceLayer, specifier, targetLayer);
    }
  }

  if (violations > 0) {
    console.error(`\n${violations} boundary violation(s) found.`);
    process.exit(1);
  }

  console.log("Boundary import checks passed.");
}

run();
