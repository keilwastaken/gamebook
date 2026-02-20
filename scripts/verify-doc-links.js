#!/usr/bin/env node

/**
 * Verifies that all relative markdown links in docs/ resolve to existing files.
 * Used by CI to catch stale or broken cross-references.
 */

const fs = require("fs");
const path = require("path");

const DOCS_DIR = path.join(__dirname, "..", "docs");
const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

let errors = 0;

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const dir = path.dirname(filePath);
  let match;

  while ((match = LINK_RE.exec(content)) !== null) {
    const [, , href] = match;

    if (href.startsWith("http://") || href.startsWith("https://")) continue;
    if (href.startsWith("#")) continue;

    const target = path.resolve(dir, href);

    if (!fs.existsSync(target)) {
      const rel = path.relative(process.cwd(), filePath);
      console.error(`BROKEN LINK in ${rel}: [${match[1]}](${href})`);
      console.error(`  -> resolved to: ${target}`);
      errors++;
    }
  }
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full);
    } else if (entry.name.endsWith(".md")) {
      checkFile(full);
    }
  }
}

if (!fs.existsSync(DOCS_DIR)) {
  console.error("docs/ directory not found");
  process.exit(1);
}

walkDir(DOCS_DIR);

// Also check AGENTS.md and CLAUDE.md at root
for (const name of ["AGENTS.md", "CLAUDE.md"]) {
  const p = path.join(__dirname, "..", name);
  if (fs.existsSync(p)) checkFile(p);
}

if (errors > 0) {
  console.error(`\n${errors} broken link(s) found.`);
  process.exit(1);
} else {
  console.log("All doc links verified.");
}
