# Checkout testing

## Check pricing on the actual site

```powershell
npm run checkout:check -- http://localhost:3058
npm run checkout:check -- https://main.d1ypn0wsqjh17o.amplifyapp.com
```

The command requests real quotes for each currently purchasable catalog variant at quantities one and two. It checks the returned cart and total arithmetic, prints each result, and exits with a nonzero status if any check fails. Run it after deployment, not only on localhost.

It only calls `/api/checkout/quote`. It does not create an order, create a PaymentIntent, send order email, or charge a card. When tax is enabled it calls Stripe Tax just as checkout does. A passing quote check does not establish that payments or webhooks work, and a zero tax result alone does not prove tax is configured correctly.

## Automated regression checks

```powershell
npm run test:checkout
```

These use mocked Stripe and AWS services, so they need no credentials and create no external records. Coverage includes missing Stripe keys with tax enabled, tax failures, server-calculated payment totals, invalid/retired cart items, and paid-order webhook processing. Mocks do not replace testing the deployed configuration.

## Test a complete payment without real money

Use a separate staging deployment or local environment connected to the staging stack. Do not switch the customer-facing site to test keys.

1. In AWS Secrets Manager, configure `ip6/staging/stripe` with `secretKey`, `publishableKey`, and `webhookSecret` from the same Stripe sandbox. Use sandbox `sk_test_...` and `pk_test_...` keys. Configure the webhook signing secret for the endpoint receiving sandbox events.
2. Set `APP_ENV=staging`, `DYNAMODB_TABLE_PREFIX=ip6_staging_`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to that sandbox's publishable key in the staging deployment. Use the staging AWS resources listed in `.env.staging`. Rebuild after changing `NEXT_PUBLIC_*` values. Keep local override keys consistent if using environment variables instead of Secrets Manager.
3. Configure Stripe Tax in that sandbox when `STRIPE_TAX_ENABLED=true`. Do not disable tax merely to make a failing checkout appear to work.
4. Configure the staging webhook endpoint at `/api/stripe/webhook` with the events in [ADMIN.md](ADMIN.md). For localhost, forward events using Stripe CLI and use its signing secret with the matching sandbox API keys in local environment variables.
5. Run the quote check against that environment. Then add a product, enter a test shipping address and an email inbox you control, select delivery, and reach payment.
6. In the sandbox only, use Stripe's test card `4242 4242 4242 4242`, any future expiry, and a three-digit CVC. Verify the confirmation, the sandbox PaymentIntent, the staging order's paid status, and webhook processing. Test records and email may be created in staging, but no real card is charged.

Stripe references: [test cards](https://docs.stripe.com/testing), [testing Stripe Tax](https://docs.stripe.com/tax/testing), [Stripe CLI](https://docs.stripe.com/stripe-cli).

## Configuration failure found on October 27, 2026

The deployed quote endpoint returned HTTP 500 while the same request succeeded locally. Production had `STRIPE_TAX_ENABLED=true`; both `ip6/prod/stripe` and `ip6/staging/stripe` still contained placeholder keys. The server rejected the secret before a Stripe request could be made. Configure valid production keys, the matching publishable key in Amplify, the production webhook signing secret, and Stripe Tax before verifying live checkout. Do not put secret values in source control or chat.
