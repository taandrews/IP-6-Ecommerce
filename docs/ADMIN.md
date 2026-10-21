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

1. **Deploy the infrastructure** with the IP6 AWS account (verify it first with `aws sts get-caller-identity`):
   ```bash
   cd infra && npm run diff:prod && npm run deploy:prod
   ```
   This adds the staff user pool, the new tables (Settings, AuditLog, PrivacyRequests, DiscountRedemptions) and new indexes on Orders (GSI3), Reviews (GSI2) and Subscriptions (GSI3). It also adds KMS encryption and the `ip6-prod-app` IAM role. Deleting the customer pool's old `admin` group is intended.
2. **Attach the role to Amplify.** Attach `AppComputeRoleArn` (a stack output) to the Amplify app as its SSR compute role. Remove any `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` from Amplify's environment.
3. **Set Amplify environment variables** (see `.env.example`):
   - `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`
   - `STAFF_COGNITO_USER_POOL_ID`, `STAFF_COGNITO_CLIENT_ID`
   - `DYNAMODB_TABLE_PREFIX=ip6_prod_`
   - `ADMIN_LINK_KEY` (`openssl rand -base64 32`)
   - `APP_ENV=prod`
   - `SES_FROM_EMAIL`, `SES_REPLY_TO`
   - `STRIPE_TAX_ENABLED` (true only once Stripe Tax is set up)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. **Put the Stripe keys in Secrets Manager** (`ip6/prod/stripe`: `secretKey`, `publishableKey`, `webhookSecret`).
5. **Create the Stripe webhook endpoint** `https://<site>/api/stripe/webhook` with these events:
   - `payment_intent.succeeded`
   - `charge.refunded`
   - `charge.dispute.created`
   - `invoice.payment_succeeded`
   - `invoice.upcoming`
   - `invoice.payment_failed`
   - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`

   In Stripe Billing settings, turn on "upcoming renewal" emails to customers (or rely on `invoice.upcoming`, which this app emails) and set how many days ahead.
6. **Verify the SES domain** and move SES out of the sandbox so customer emails deliver.
7. **Create the first owner:**
   ```bash
   STAFF_COGNITO_USER_POOL_ID=<StaffUserPoolId> npx tsx scripts/create-owner.ts you@company.com "Your Name"
   ```
   Sign in at `/admin/login`. You'll set a new password and scan a QR code with an authenticator app. Invite everyone else from Admin, Staff.

## Testing

- `npm test`: unit tests for token verification and pool separation, roles, redirects, server pricing, discounts, CSV injection, PII masking, sealed links, CSRF and the webhook.
- An end-to-end run against local emulators (moto for AWS, a fake Stripe API) covered sign-in for both pools, CSRF and the full checkout. It also covered the webhook (including retries), shipping, refunds, the CSV export, the review moderation cycle, the banner, the verified privacy request and erasure, staff invites and the audit log.
