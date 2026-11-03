# Platform plan

Agreed 2026-11-02 and built the same day. The Amplify site reads products, prices, stock and subscription plans from Shopify's Storefront API (Headless channel) and sends the cart to Shopify's hosted checkout. Stripe, the site's own checkout, customer sign-in and order records are removed. Code: `lib/shopify/`, `app/api/checkout/route.ts`, `theme/snippets/ip6-headless-redirect.liquid`.

## Who does what

- **Custom site (Amplify):** the only storefront. It shows the products and cart, pulling products, prices and stock from Shopify.
- **Shopify:** runs in the background only. It handles checkout on a Shopify-hosted checkout page, payments, tax, orders, subscriptions and customer accounts.
- **Shopify storefront:** hidden. Customers never see the Shopify theme.
- **Stripe:** removed. Shopify Payments takes payments instead (it runs on Stripe underneath).
- **Fulfillment:** orders flow to Willings with UPS labels and packing slips. The UPS setup is waiting on Willings' answers.
- **Email:** SES handles the site's own email (contact form, privacy requests, newsletter and waitlist confirmations). Shopify sends the order emails.

## Open items

- UPS setup: waiting on Willings.
- Shopify checkout opens only after the store password is turned off (needs a paid plan and Shopify Payments).
- Shopify email settings (sender orders@, store email support@, staff alerts to orders@, sender-domain DNS at GoDaddy).
- Domain cut-over: Shopify to shop.ip6original.com, Amplify to ip6original.com, then point the theme's Headless storefront setting at https://ip6original.com.
