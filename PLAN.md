# IP-6 Research, Inc. — ip6original.com Build Plan

**Role:** Senior Next.js developer + UI/UX engineer
**Target:** Global ecommerce site for IP-6 Research, Inc.
**Domain:** ip6original.com
**Products:** IP6 Original Supplement, IP6 La Santé Cream, IP6-Citrate Water Filter

---

## 0. Hard Constraints (Read Before Every Work Session)

### Regulatory firewall (highest priority)
- **Zero connection** between `ip6original.com` and `ip-6.net` — no links, no references, no citations, no reused content anywhere in code, content, metadata, sitemaps, robots, OG tags, or comments.
- **No disease claims.** Never use *treats, cures, prevents, heals* regarding any medical condition on supplement or skincare pages.
- **DSHEA disclaimer** required in footer of every supplement and skincare page:
  > "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."
- **Water filter** may state device performance claims (e.g., *removes lead and arsenic in under 60 seconds*) — it's a device, not a supplement.
- All health language uses **structure-function claim wording**: *supports immune health, supports healthy cell function, formulated for skin affected by eczema, cortisone-free formula.*

### Design tokens
- Primary: `#1B4332` (deep forest green)
- Secondary: `#C9A84C` (warm gold)
- Accent: `#F8F4EE` (soft ivory)
- Text: `#1A1A1A` (near black)
- Surface: `#FFFFFF`
- Error: `#C0392B` (muted red)
- Headings: **DM Serif Display**
- Body: **Inter**
- Tone: premium, scientific, credible — luxury wellness backed by institutional research

---

## 1. Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS |
| Hosting | AWS Amplify (prod + staging) |
| Database | DynamoDB (orders, users, inventory, subscriptions, reviews, discount codes) |
| Auth | AWS Cognito (user pool + admin group) |
| Payments | Stripe (Payments, Billing, Tax, multi-currency) |
| Email | AWS SES |
| Assets | S3 + CloudFront |
| DNS | Route 53 |
| CMS | Sanity (blog + product content) |
| Analytics | GA4 + Meta Pixel |
| Search | Algolia |

---

## 2. Build Order (Phases)

### Phase 1 — Foundations
1. `create-next-app` with TS + Tailwind + App Router + ESLint.
2. Configure Tailwind theme with brand tokens and font families.
3. Install fonts via `next/font` (Inter, DM Serif Display).
4. Set up `next.config.js` with i18n routing (en default; fr, de, hi placeholders).
5. Project structure:
   ```
   app/
     (marketing)/        # home, about, founder, testimonials, faq, blog, contact, legal
     (shop)/             # shop, product/[slug], cart, checkout
     (account)/          # login, register, forgot-password, dashboard, orders, subscriptions, addresses, payment-methods
     (admin)/            # orders, inventory, customers, discounts, analytics, blog-editor
     api/                # stripe webhooks, shipping rates, reviews, cart, newsletter
   components/
     ui/                 # primitives (Button, Input, Card, Accordion, Drawer, Modal, Badge)
     layout/             # Nav, Footer, CurrencySwitcher, CookieBanner
     product/            # ProductCard, Gallery, VariantSelector, QuantitySelector, SubscriptionToggle, ReviewStars
     cart/               # CartDrawer, LineItem, CartSummary
     checkout/           # ShippingStep, PaymentStep, ReviewStep, ConfirmationStep
     account/            # OrderRow, SubscriptionCard, AddressForm
     admin/              # DataTable, StatCard, OrderStatusSelect
   lib/
     aws/                # dynamo, cognito, ses, s3 clients
     stripe/             # client + server helpers
     sanity/             # client, queries
     algolia/            # client, indexing
     i18n/               # dictionaries
     compliance/         # claim linter, disclaimer component
   types/
   content/              # static content fallbacks
   ```
6. `.env.example` with every variable documented (see §11).
7. Root `layout.tsx`: metadata defaults, font loading, cookie banner mount, analytics scripts gated by consent.

### Phase 2 — Infrastructure
1. **AWS Amplify**: connect repo, set prod + staging branches, environment variables per env.
2. **DynamoDB tables** (see §8 for schemas): `Users`, `Orders`, `OrderItems`, `Products`, `Inventory`, `Subscriptions`, `Reviews`, `DiscountCodes`.
3. **Cognito**: user pool, email verification, password reset flow, `admin` group.
4. **S3**: `ip6original-assets` bucket (private, CloudFront-fronted), `ip6original-uploads` for admin media.
5. **CloudFront**: distribution fronting S3 + cache policy.
6. **Route 53**: `ip6original.com` apex + `www`, `staging.ip6original.com`.
7. **SES**: domain verification, SPF/DKIM, templates for: `order-confirmation`, `shipping-notification`, `subscription-renewal-reminder`, `subscription-charge-success`, `subscription-charge-failed`, `subscription-cancelled`, `password-reset`.
8. **Stripe**: products + prices for each SKU, one-time + recurring (30/60/90 day), Stripe Tax enabled, webhook endpoint `/api/stripe/webhook`, test mode keys with clear `// TODO: switch to live keys` comment.
9. **Sanity**: schemas for `blogPost`, `author`, `productContent`, `testimonial`, `faq`.
10. **Algolia**: products index, synced on product mutation.

### Phase 3 — Component Library (build before pages)
Navigation, Footer (with DSHEA slot), ProductCard, Hero, TestimonialBlock, FaqAccordion, SubscriptionToggle, QuantitySelector, CartDrawer, CheckoutSteps, AccountPanels, AdminTable, CurrencySwitcher, CookieBanner, StructuredData helper.

Every component: mobile-first, keyboard accessible, WCAG AA contrast, proper ARIA, loading/error states.

### Phase 4 — Public Pages
Build each fully — no placeholders:
- Home, Shop, Product (×3), About, The Founder, Testimonials, FAQ, Blog index, Blog post template, Contact, International Shipping, Cookie Policy, Terms of Service, Privacy Policy, Refund Policy, Shipping Policy, Accessibility Statement.

### Phase 5 — Product Pages (detailed spec §5)

### Phase 6 — Cart + Checkout (detailed spec §6)

### Phase 7 — Account Pages
Login, Register, Forgot Password, Dashboard, Order History, Order Detail, Saved Addresses, Subscription Management, Payment Methods.

### Phase 8 — Admin Dashboard (detailed spec §9)

### Phase 9 — Global Ecommerce Features (detailed spec §7)

### Phase 10 — SEO, Structured Data, Sitemap, Performance

### Phase 11 — QA + Launch Checklist (§12)

---

## 3. Site Architecture (complete page list)

**Public:** `/`, `/shop`, `/shop/ip6-original-supplement`, `/shop/ip6-la-sante-cream`, `/shop/ip6-citrate-water-filter`, `/about`, `/founder`, `/testimonials`, `/faq`, `/blog`, `/blog/[slug]`, `/contact`, `/international-shipping`, `/legal/cookie-policy`, `/legal/terms`, `/legal/privacy`, `/legal/refund-policy`, `/legal/shipping-policy`, `/legal/accessibility`.

**Account:** `/account/login`, `/account/register`, `/account/forgot-password`, `/account`, `/account/orders`, `/account/orders/[id]`, `/account/addresses`, `/account/subscriptions`, `/account/payment-methods`.

**Admin (Cognito `admin` group only):** `/admin`, `/admin/orders`, `/admin/inventory`, `/admin/customers`, `/admin/discounts`, `/admin/analytics`, `/admin/blog`.

---

## 4. Component Library

Base primitives (`components/ui/`): Button, Link, Input, Textarea, Select, Checkbox, Radio, Badge, Card, Accordion, Tabs, Dialog, Drawer, Toast, Tooltip, Skeleton, Spinner, Alert, Pagination, Breadcrumb, Table.

Domain components listed in §2 Phase 3. All expose variant/size props, forward refs, use Tailwind tokens not hex literals, and export TypeScript prop types.

---

## 5. Product Pages (detailed)

### Shared structure for all three
1. Breadcrumb + BreadcrumbList JSON-LD.
2. Gallery (zoom, thumbnails, mobile swipe).
3. Name + short description + purity/claim badge.
4. Variant selector (size/format).
5. Quantity selector.
6. Add-to-cart button (opens CartDrawer).
7. Subscription toggle: One-time vs Subscribe & Save (percentage off).
8. Product highlights.
9. Ingredient / specification list.
10. How to use.
11. Reviews (5-star, stored in DynamoDB `Reviews` table, verified-purchase flag).
12. Product-specific FAQ.
13. Related products.
14. JSON-LD: Product + Review + BreadcrumbList.
15. DSHEA disclaimer in footer (supplement + skincare only).

### IP6 Original Supplement (`/shop/ip6-original-supplement`)
- Hero claim: **"95%+ purity"**.
- Variants: capsule, powder, refill.
- Subscription cycles: 30 and 90 day.
- Founder endorsement section — compliant language only.

### IP6 La Santé Cream (`/shop/ip6-la-sante-cream`)
- Hero claim: **"Cortisone-free"**.
- Three SKUs: eczema cream, UV protection, sensitive skin moisturizer.
- Before/after testimonials — customer-submitted only, no clinical claims.
- Subscription cycles: 30 and 60 day.

### IP6-Citrate Water Filter (`/shop/ip6-citrate-water-filter`)
- Hero claim: **"Removes lead and arsenic in under 60 seconds"**.
- Feature: no electricity required.
- Technical specifications section.
- Filter replacement cartridge subscription: 60 and 90 day cycles.
- Humanitarian use case section for developing markets.
- NSF certification badge placeholder — feature-flagged via env var `NEXT_PUBLIC_NSF_CERTIFIED=false` until certified.
- Ships to all countries (no supplement/skincare restriction).

---

## 6. Cart + Checkout

### Cart Drawer
- Right-side slide-in, never navigates away.
- Line items: image, name, variant, qty controls, line total, remove.
- Subscription badge per subscription line.
- Summary: subtotal, estimated shipping, estimated tax, total.
- Subscription summary block if any subscription items.
- Proceed-to-checkout CTA.

### Checkout (multi-step at `/checkout`)
1. **Shipping address** — autocomplete, country-restricted for supplement/skincare.
2. **Shipping method** — real-time rate calc via `/api/shipping/rates` with destination + cart weight.
3. **Payment** — Stripe Elements (Payment Element), saved cards for authenticated users.
4. **Review** — full summary, terms checkbox.
5. **Confirmation** — order number, estimated delivery, account-creation prompt for guests, SES order confirmation email dispatched.

Guest + authenticated flows both supported. Server-side order creation happens after `payment_intent.succeeded` webhook, not client-side, to prevent double-charge/ghost-order issues.

---

## 7. Global Ecommerce

### Currency
- Auto-detect via `Accept-Language` + IP (Cloudflare/Amplify headers).
- Supported: USD, CAD, GBP, AUD, EUR, INR.
- Stripe handles conversion + multi-currency pricing (one Price object per currency per SKU).
- Header currency switcher overrides detection; persists to cookie.

### Shipping
- Rate calculator API returns per-destination rates from a configurable carrier table.
- `PERMITTED_SUPPLEMENT_COUNTRIES` env var gates supplement + skincare destinations.
- Water filter ships globally.
- Estimated delivery dates shown in checkout + confirmation email.

### Tax
- Stripe Tax enabled — handles US state sales tax, EU VAT, CA GST/HST, AU GST automatically.

### GDPR / Cookie consent
- Banner on first visit, gated by EU/UK geolocation.
- Three options: Accept all, Reject non-essential, Customize.
- Consent stored in `ip6_consent` cookie (1 year).
- Analytics scripts only mount when consent granted.
- Data deletion request form on `/legal/privacy` posts to `/api/privacy/deletion-request`.

### i18n
- Next.js App Router i18n with `en` at launch.
- Dictionary files in `lib/i18n/dictionaries/{en,fr,de,hi}.json` — `fr`, `de`, `hi` empty stubs.
- `hreflang` tags emitted from root layout.

---

## 8. DynamoDB Schemas

Single-table-ish per-domain for clarity (one table per entity is fine at this scale). Proper GSIs for every query pattern.

| Table | PK | SK | GSIs | Notes |
|---|---|---|---|---|
| `Users` | `userId` | — | `GSI1 email` | synced from Cognito sub |
| `Orders` | `orderId` | — | `GSI1 userId + createdAt`, `GSI2 status + createdAt` | |
| `OrderItems` | `orderId` | `sku` | `GSI1 sku + createdAt` | |
| `Products` | `sku` | — | `GSI1 category` | content authored in Sanity, mirrored here for fast reads |
| `Inventory` | `sku` | — | `GSI1 lowStock (sparse)` | low stock alerts |
| `Subscriptions` | `subscriptionId` | — | `GSI1 userId + status`, `GSI2 nextChargeDate` | mirror of Stripe sub |
| `Reviews` | `sku` | `reviewId` | `GSI1 userId + createdAt` | verified-purchase flag |
| `DiscountCodes` | `code` | — | `GSI1 active + expiresAt` | |

---

## 9. Admin Dashboard

Protected via middleware checking Cognito group `admin`. Non-admin → 403.

- **Orders:** filterable table (status, date range, customer), inline status update, detail drawer.
- **Inventory:** SKU table, editable stock, low-stock threshold alerts.
- **Customers:** search + filter, click-through to order history.
- **Discount codes:** create/edit/delete, percentage or fixed, expiry, usage limits, per-user limits.
- **Analytics:** daily revenue, order count, top products, conversion rate, active subscriptions — computed from DynamoDB via scheduled aggregations into an `AnalyticsDaily` table to avoid full-table scans.
- **Blog editor:** embedded Sanity Studio at `/admin/blog` (or external link to hosted Studio).

---

## 10. SEO + AEO

- `generateMetadata` on every page: title, description, OG, Twitter card, canonical.
- Product JSON-LD: `Product`, `Review`, `AggregateRating`, `BreadcrumbList`.
- Blog JSON-LD: `Article`.
- `app/sitemap.ts` — dynamic, pulls products + blog slugs.
- `app/robots.ts` — allows all, disallows `/admin`, `/account`, `/api`, `/checkout`.
- `next/image` everywhere, WebP + fallback, meaningful alt text.
- `hreflang` tags per locale.
- Core Web Vitals target: LCP < 2.5s, INP < 200ms, CLS < 0.1.

---

## 11. Environment Variables (`.env.example`)

```
# Site
NEXT_PUBLIC_SITE_URL=https://ip6original.com
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_NSF_CERTIFIED=false
PERMITTED_SUPPLEMENT_COUNTRIES=US,CA,GB,AU,DE,FR,IE,NL,NZ

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DYNAMODB_TABLE_PREFIX=ip6_prod_
S3_ASSETS_BUCKET=ip6original-assets
CLOUDFRONT_DOMAIN=
SES_FROM_EMAIL=hello@ip6original.com

# Cognito
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
COGNITO_ADMIN_GROUP=admin

# Stripe (TEST MODE — switch to live keys at launch)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=

# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=
ALGOLIA_ADMIN_KEY=

# Analytics
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_META_PIXEL_ID=
```

---

## 12. Launch Checklist

- [ ] DSHEA disclaimer on every supplement + skincare page footer.
- [ ] Zero references to `ip-6.net` across repo (`grep -ri 'ip-6.net' .` returns 0 results).
- [ ] No banned words (*treats, cures, prevents, heals*) used about medical conditions — run `lib/compliance/claim-linter.ts` over content.
- [ ] Stripe in test mode with explicit `// TODO: switch to live keys` comment at the config site.
- [ ] `.env.example` complete and checked in; no secrets in repo.
- [ ] Sitemap includes all public pages (no admin, account, api, checkout).
- [ ] Cookie consent fires for EU + UK; analytics gated on consent.
- [ ] `/admin/*` returns 403 for non-admin users (middleware test).
- [ ] Stripe subscription webhooks handled: `customer.subscription.created|updated|deleted`, `invoice.payment_succeeded|failed`.
- [ ] Order confirmation email sends via SES (end-to-end test).
- [ ] All three product pages render on mobile (Chrome, Safari iOS, Firefox Android).
- [ ] Lighthouse ≥ 90 on Performance, Accessibility, Best Practices, SEO across home, product, cart, checkout.
- [ ] Keyboard nav works on every interactive element (tab order, focus ring, ESC closes drawers/modals).
- [ ] Rate limiting on all `/api/*` routes.
- [ ] hreflang tags present and correct.

---

## 13. Open Questions / Decisions to Confirm

1. **Sanity Studio hosting** — embedded at `/admin/blog` or external `studio.ip6original.com`?
2. **Shipping carrier** — which carrier API(s) feed the rate calculator? (EasyPost, Shippo, direct USPS/UPS/DHL?)
3. **Founder endorsement** — exact approved copy for the supplement page.
4. **Humanitarian program** — is there a partner org or just narrative copy on the filter page?
5. **Initial blog posts** — seed content or empty-state at launch?
6. **Permitted countries** — final list for supplement + skincare restriction.
7. **Brand photography** — assets available, or placeholder during build?

---

## 14. Notes on Execution

This is a multi-week senior-engineer project. Building the entire thing in a single automated pass — without real AWS/Stripe/Sanity credentials, without brand assets, without the founder copy, without carrier API access — would produce code that compiles but can't deploy. The plan above is sequenced so each phase produces something shippable and verifiable before the next phase layers on. Work through the phases in order; revisit §0 constraints at the start of every session.
