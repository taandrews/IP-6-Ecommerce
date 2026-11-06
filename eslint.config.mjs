import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

// ESLint 9 flat config. Next.js's shared config is loaded through FlatCompat,
// as the Next.js ESLint docs show for eslint-config-next 15.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  // Build output, dependencies, tool caches and the CDK app (its own TypeScript project).
  { ignores: [".next/**", "node_modules/**", "out/**", "coverage/**", ".cache/**", ".claude/**", "public/**", "assets/**", "design-references/**", "infra/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];

export default config;
