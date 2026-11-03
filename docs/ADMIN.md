# Admin portal

The admin portal lives at `/admin` on the Amplify site. Shopify is the commerce back end (checkout, payments, tax, orders, refunds, subscriptions, discounts, customer accounts and order emails), so those are worked in Shopify admin; the portal shows them and links there. The portal itself handles the pre-order switch (it drives the Shopify automatic discount), customer lookup with privacy export and erasure, the launch waitlist, privacy requests, the review queue, the site banner, the blog, staff and an activity log. See `docs/PLATFORM-PLAN.md`.

## Security model

- **Staff sign-in.** Customers sign in to Shopify customer accounts, not this site. Staff exist only in the Cognito staff pool, which has no public sign-up, requires an authenticator app (TOTP) for every sign-in, needs passwords of 12 or more characters, and ends sessions after 12 hours. Tokens are verified against the issuer of the pool they belong to (`lib/auth/jwt.ts`).
- **Every request is verified on the server.** The middleware and every admin route check the token signature, issuer, audience and expiry. Each admin API route also checks the caller's role (`lib/auth/roles.ts`, `lib/admin/guard.ts`).
- **Roles.**
  - Owner: everything.
  - Staff: shipping, stock, subscriptions, reviews and the banner. Sees customer details.
  - View only: read-only, with customer names and emails masked.
  - Refunds, exports, erasure, prices, staff management and the activity log are owner-only.
- **CSRF.** Cross-site state-changing requests are refused (an Origin check in `middleware.ts`), and staff cookies are `SameSite=Strict`.
- **Personal data.**
  - Customer emails never appear in admin URLs; links use AES-GCM sealed tokens (`ADMIN_LINK_KEY`).
  - Searches send emails in the request body, never the URL.
  - Every view, export and erasure of customer data is written to the activity log, which never stores the personal data itself.
  - CSV exports are protected against formula injection.
- **At rest.** All tables are encrypted with a customer-managed KMS key; point-in-time recovery is on in prod, and the audit log always has it.
- **Pricing.** The browser never sets a price. `/api/checkout` maps the cart to Shopify variant and selling-plan IDs on the server and Shopify prices the order (discounts, tax, shipping) on its hosted checkout.
- **Shopify access.** Both Shopify tokens are in Secrets Manager at `ip6/<env>/shopify`: `storefrontToken` (the Headless channel's private Storefront token, used server-side for the catalog and checkout) and `adminToken` (the staff portal and privacy erasure). Amplify env vars `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_PREORDER_DISCOUNT_ID` and `NEXT_PUBLIC_SHOPIFY_ACCOUNT_URL` are required; the build fails or the feature reports an error when one is missing.

## Deploying

Done on 2026-10-21 (see `infra/README.md`): all four stacks are deployed, the Amplify app runs with the `ip6-prod-app` compute role (no access keys), its environment points at the `ip6_prod_` tables, the prod user pools, the prod assets bucket and CDN, and `APP_ENV=prod`. Local development uses the staging stack through `.env.staging`.

To change infrastructure:

```bash
cd infra && AWS_PROFILE=ip6 npx cdk diff --all && AWS_PROFILE=ip6 npx cdk deploy --all --concurrency 4
```

Amplify environment variables are set with `aws amplify update-app --environment-variables` (the call replaces the whole map, so pass every variable). Amplify rejects variable names starting with `AWS`; the app reads its data-plane region from `APP_AWS_REGION`.

### Still owner-only before launch

1. **Shopify launch:** a paid Shopify plan, Shopify Payments set up by the owner, Shopify Markets selling to the US only, shipping rates that match the site's free-shipping line, and the store password turned off (Shopify blocks checkout while it is on). Order, shipping and subscription emails are Shopify's own (Settings, Notifications): set the sender to orders@ip6original.com, the store email to support@ip6original.com, staff order alerts to orders@ip6original.com, and add Shopify's sender-domain DNS records at GoDaddy.
2. **SES domain verification.** Create the three DKIM CNAME records that `Ip6ProdStack` outputs (`DkimCname1Name`/`Value` through 3) at the DNS host of ip6original.com (GoDaddy). SES verifies the domain within an hour of the records resolving. The production-access (sandbox exit) request was submitted on 2026-10-21 and is pending AWS review.
3. **Confirm the alert subscriptions.** AWS emailed two SNS confirmation links (one per region) to the alert address. Nothing is delivered until they are confirmed.
4. **Create the first owner:**
   ```bash
   STAFF_COGNITO_USER_POOL_ID=us-east-1_xtRRPg43p npx tsx scripts/create-owner.ts you@company.com "Your Name"
   ```
   Sign in at `/admin/login`. You will set a new password and scan a QR code with an authenticator app. Invite everyone else from Admin, Staff.
5. **At domain cut-over:** move Shopify's primary domain to shop.ip6original.com, attach ip6original.com to the Amplify app, set `NEXT_PUBLIC_SITE_URL=https://ip6original.com` in Amplify (emailed links are built from it) and redeploy, then set Theme settings, Headless storefront, to https://ip6original.com so the hidden Shopify theme sends visitors there.
6. **Sales tax:** configured in Shopify (Settings, Taxes and duties).

## Testing

- `npm test`: unit tests for token verification and pool separation, roles, redirects, the Shopify catalog merge, CSV injection, PII masking, sealed links and CSRF.
- Checkout is Shopify's hosted page; test it on Shopify with its test gateway (card number 1 succeeds, 2 declines).
