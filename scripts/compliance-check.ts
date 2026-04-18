#!/usr/bin/env tsx
/**
 * Scans product + content data + page text for compliance violations.
 * Fails the build if disease-claim language or references to the research
 * site (ip-6.net) are detected on supplement / skincare surfaces.
 *
 * Run locally:    pnpm compliance:check
 * Run in CI:      same command, non-zero exit on findings
 */

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { products } from "../content/products";
import { testimonials } from "../content/testimonials";
import { blogPosts } from "../content/blog-posts";
import { lintContent } from "../lib/compliance/claim-linter";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "content", "lib"];
const SCAN_EXTS = [".tsx", ".ts", ".md", ".mdx", ".json"];
const FORBIDDEN = /(ip-6\.net|www\.ip-6\.net|https?:\/\/ip-?6\.net)/i;

async function walk(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") continue;
      files.push(...(await walk(full)));
    } else if (SCAN_EXTS.some((x) => e.name.endsWith(x))) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  let errors = 0;

  // 1) Scan source for forbidden-site references
  // Skip the compliance module itself — it must contain the string to detect it.
  const SELF_EXCLUDE = new Set([
    "lib/compliance/claim-linter.ts",
    "scripts/compliance-check.ts",
  ]);
  for (const dir of SCAN_DIRS) {
    const files = await walk(join(ROOT, dir));
    for (const f of files) {
      const rel = relative(ROOT, f).replace(/\\/g, "/");
      if (SELF_EXCLUDE.has(rel)) continue;
      const txt = await readFile(f, "utf8");
      if (FORBIDDEN.test(txt)) {
        console.error(`[compliance] Forbidden reference to ip-6.net in ${rel}`);
        errors++;
      }
    }
  }

  // 2) Lint product content
  for (const p of products) {
    const context = p.category;
    const blob = [
      p.name,
      p.shortDescription,
      p.heroClaim,
      ...p.highlights,
      ...(p.ingredients ?? []),
      ...(p.specifications?.map((s) => `${s.label} ${s.value}`) ?? []),
      ...p.howToUse,
      ...p.faq.flatMap((f) => [f.q, f.a]),
    ].join("\n");
    const findings = lintContent(blob, context);
    for (const f of findings) {
      if (f.severity === "error") {
        console.error(`[compliance] ${p.sku} · ${f.rule}: ${f.match}\n  ${f.context}`);
        errors++;
      }
    }
  }

  // 3) Lint testimonials
  for (const t of testimonials) {
    const findings = lintContent(t.body, t.productSku?.startsWith("SUP-") ? "supplement" : t.productSku?.startsWith("SKN-") ? "skincare" : "general");
    for (const f of findings) {
      if (f.severity === "error") {
        console.error(`[compliance] testimonial ${t.id} · ${f.rule}: ${f.match}`);
        errors++;
      }
    }
  }

  // 4) Lint blog post bodies
  for (const p of blogPosts) {
    const blob = [p.title, p.excerpt, ...p.content.flatMap((b) => [b.heading ?? "", b.paragraph])].join("\n");
    const findings = lintContent(blob, "general");
    for (const f of findings) {
      if (f.severity === "error") {
        console.error(`[compliance] blog ${p.slug} · ${f.rule}: ${f.match}`);
        errors++;
      }
    }
  }

  if (errors > 0) {
    console.error(`\nCompliance check failed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log("Compliance check passed. No disease-claim or ip-6.net references found.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
