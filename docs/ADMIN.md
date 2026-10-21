# Admin portal

The admin portal lives at `/admin` on the Amplify site. It manages orders, pre-orders, products and stock, customers and privacy requests, discount codes, subscriptions, the review queue, the site banner, staff, and an activity log. The Shopify store keeps its own admin.

## Security model

- **Two separate Cognito user pools.** Customers sign up in the customer pool. Staff exist only in the staff pool, which has no public sign-up, requires an authenticator app (TOTP) for every sign-in, needs passwords of 12 or more characters, and ends sessions after 12 hours. Tokens are verified against the issuer of the pool they belong to (`lib/auth/jwt.ts`), so a customer token can never open the admin portal.
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
- **Pricing.** The browser never sets a price: checkout prices are recomputed on the server from the catalog and the admin settings (`lib/pricing/quote.ts`). Stripe webhooks are signature-checked and idempotent.

## Deploying

Done on 2026-10-21 (see `infra/README.md`): all four stacks are deployed, the Amplify app runs with the `ip6-prod-app` compute role (no access keys), its environment points at the `ip6_prod_` tables, the prod user pools, the prod assets bucket and CDN, and `APP_ENV=prod`. Local development uses the staging stack through `.env.staging`.

To change infrastructure:

```bash
cd infra && AWS_PROFILE=ip6 npx cdk diff --all && AWS_PROFILE=ip6 npx cdk deploy --all --concurrency 4
```

Amplify environment variables are set with `aws amplify update-app --environment-variables` (the call replaces the whole map, so pass every variable). Amplify rejects variable names starting with `AWS`; the app reads its data-plane region from `APP_AWS_REGION`.

### Still owner-only before launch

1. **Stripe live keys** in Secrets Manager: `ip6/prod/stripe` with `secretKey`, `publishableKey`, `webhookSecret`, plus `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in Amplify. Then create the Stripe webhook endpoint `https://<site>/api/stripe/webhook` with these events:
   - `payment_intent.succeeded`
   - `charge.refunded`
   - `charge.dispute.created`
   - `invoice.payment_succeeded`
   - `invoice.upcoming`
   - `invoice.payment_failed`
   - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`

   In Stripe Billing settings, turn on "upcoming renewal" emails to customers (or rely on `invoice.upcoming`, which this app emails) and set how many days ahead.
2. **SES domain verification.** Create the three DKIM CNAME records that `Ip6ProdStack` outputs (`DkimCname1Name`/`Value` through 3) at the DNS host of ip6original.com (GoDaddy). SES verifies the domain within an hour of the records resolving. The production-access (sandbox exit) request was submitted on 2026-10-21 and is pending AWS review.
3. **Confirm the alert subscriptions.** AWS emailed two SNS confirmation links (one per region) to the alert address. Nothing is delivered until they are confirmed.
4. **Create the first owner:**
   ```bash
   STAFF_COGNITO_USER_POOL_ID=us-east-1_xtRRPg43p npx tsx scripts/create-owner.ts you@company.com "Your Name"
   ```
   Sign in at `/admin/login`. You will set a new password and scan a QR code with an authenticator app. Invite everyone else from Admin, Staff.
5. **At domain cut-over:** attach ip6original.com to the Amplify app, then set `NEXT_PUBLIC_SITE_URL=https://ip6original.com` in Amplify (emailed links are built from it) and redeploy.
6. **Sales tax:** `STRIPE_TAX_ENABLED` is `true`; leave it only once Stripe Tax is configured in the Stripe dashboard.

## Testing

- `npm test`: unit tests for token verification and pool separation, roles, redirects, server pricing, discounts, CSV injection, PII masking, sealed links, CSRF and the webhook.
- An end-to-end run against local emulators (moto for AWS, a fake Stripe API) covered sign-in for both pools, CSRF and the full checkout. It also covered the webhook (including retries), shipping, refunds, the CSV export, the review moderation cycle, the banner, the verified privacy request and erasure, staff invites and the audit log.
