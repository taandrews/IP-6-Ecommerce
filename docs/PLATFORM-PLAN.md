# Platform plan

Agreed plan as of 2026-11-02. This is the target setup, not a description of what is built today: the Amplify site still runs its own Stripe checkout until the move to Shopify checkout is done.

## Who does what

- **Custom site (Amplify):** the only storefront. It shows the products and cart, pulling products, prices and stock from Shopify.
- **Shopify:** runs in the background only. It handles checkout on a Shopify-hosted checkout page, payments, tax, orders, subscriptions and customer accounts.
- **Shopify storefront:** hidden. Customers never see the Shopify theme.
- **Stripe:** removed. Shopify Payments takes payments instead (it runs on Stripe underneath).
- **Fulfillment:** orders flow to Willings with UPS labels and packing slips. The UPS setup is waiting on Willings' answers.
- **Email:** SES handles the site's own email (contact form, privacy requests, newsletter and waitlist confirmations). Shopify sends the order emails.

## Open items

- UPS setup: waiting on Willings.
