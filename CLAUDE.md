# IP-6 Ecommerce (ip6original.com)

Next.js 14 + TypeScript + Tailwind storefront for IP-6 Research, Inc. Three products (IP6 supplement, La Sante skincare, IP6-Citrate water filter), global checkout, subscriptions, admin, GDPR-aware consent. See `README.md` and `PLAN.md`.

## Commands (from package.json)

```bash
npm run dev               # next dev -p 3058
npm run build             # next build
npm run lint              # next lint
npm run typecheck         # tsc --noEmit
npm run compliance:check  # tsx scripts/compliance-check.ts
```

## Infrastructure (`infra/`, AWS CDK)

```bash
npm run synth
npm run diff:staging | diff:prod
npm run deploy:staging    # Ip6StagingStack, no approval prompt
npm run deploy:prod       # Ip6ProdStack, approval on broadening
```

## Hard constraint (regulatory separation, stated in "IP6 Shopify/CLAUDE.md")

- `ip-6.net` is research/information ONLY: no commercial content, no product links.
- Redirects flow `ip6original.com` -> `ip-6.net`, never the reverse.

<!-- BEGIN:universal-rules v1 (2026-07-06). Shared block, identical across all Projects repos. If you change it here, change it everywhere. -->
## Universal Rules (all projects)

### Verify, never guess
- Never fabricate or assume anything: facts, copy, metrics, capabilities, file paths, code, or system state. If it was not verified this session (file read, command output, log, screenshot), do not assert it. Verify first or say "not verified."
- Every diagnosis needs evidence: a log line, an error message, a config value, or documentation. No speculation presented as an answer.
- For UI changes, verify visually before claiming done: take a screenshot (Playwright or browser), view it, confirm it matches intent. Exit codes and "the code looks right" are not verification.

### Scope discipline
- Do exactly what was asked, nothing more. No opportunistic refactors, no "improving" adjacent code, no scope creep.
- Fix root causes, not symptoms. No workarounds, no temporary hacks, no debug code in production.
- Questions get answers, not code changes. "Investigate", "report back", "look into" mean findings only.

### Response style
- TLDR first: lead with the answer in 1-3 sentences. No preamble, no recap, no closing flourishes. Expand only when asked.
- No em dashes anywhere: copy, code comments, chat replies.
- No AI-slop language (delve, seamless, robust, leverage, elevate, "not just X, but Y", "in today's world") and no AI-slop design (01/02/03 numbered badges, identical icon-card grids, purple/indigo gradients, the hero + three-features + stats + CTA template).

### Security
- Never print secret values (keys, tokens, credentials) to output, logs, or chat, and never commit them. Env vars and secret stores only. If a secret is exposed, say so immediately; it must be rotated.
- Validate all input server-side (Zod or equivalent). Enforce auth server-side on every request. Never trust the client.

### AWS
- Always use this project's designated AWS profile. Verify with `aws sts get-caller-identity` before the first AWS action of a session. Wrong account or missing credentials: STOP and ask, never fall back to default credentials.
<!-- END:universal-rules v1 -->
