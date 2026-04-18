# IP-6 Research, Inc. — ip6original.com

Next.js 14 + TypeScript + Tailwind CSS storefront for IP-6 Research, Inc. Three products (IP6 supplement, La Santé skincare, IP6-Citrate water filter), global checkout, subscriptions, admin, and GDPR-aware consent.

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in credentials
cp .env.example .env.local

# 3. Run dev server
npm run dev

# 4. Run the compliance linter (blocks disease claims / ip-6.net refs)
npm run compliance:check

# 5. Type-check
npm run typecheck
```

## Required services

Before deploying, configure accounts for:

- AWS (Amplify, DynamoDB, Cognito, SES, S3, CloudFront, Route 53)
- Stripe (test mode by default; switch to live at launch — see `lib/stripe/server.ts`)
- Sanity (blog + product CMS)
- Algolia (product search)
- GA4 / Meta Pixel (optional, consent-gated)

All keys live in `.env.example`. Nothing is hard-coded.

## Key directories

| Path | Purpose |
|---|---|
| `app/` | Next.js App Router pages, layouts, API routes |
| `components/` | UI primitives, layout, product, cart, checkout, admin |
| `content/` | Product catalog, testimonials, blog fallback content |
| `lib/` | AWS / Stripe / Sanity / Algolia clients, i18n, compliance linter |
| `types/` | Shared TypeScript types |
| `scripts/compliance-check.ts` | Static check for DSHEA + ip-6.net firewall |

## Regulatory guardrails

- Every supplement and skincare page renders the DSHEA disclaimer.
- `lib/compliance/claim-linter.ts` blocks disease-claim verbs (*treats, cures, prevents, heals*) near medical-context words in supplement/skincare content.
- `scripts/compliance-check.ts` greps the entire codebase for `ip-6.net` references and fails the build if any exist.
- The water filter page uses device performance claims — these are not supplement claims and are compliant.

## Production checklist

See `PLAN.md` §12 for the full launch checklist.
