import type { Metadata } from "next";
import { DataDeletionForm } from "./DataDeletionForm";
import { hreflangAlternates } from "@/lib/i18n";
import { EMAIL } from "@/lib/email-addresses";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What personal data IP6 Original collects, why, who it is shared with, how long it is kept, and your rights.",
  alternates: hreflangAlternates("/legal/privacy"),
};

const H2 = "font-display text-display-md text-forest-800 mb-3";

export default function PrivacyPage({ searchParams }: { searchParams: { request?: string } }) {
  const request = searchParams.request;
  return (
    <>
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-display-xl text-forest-800 mb-6">Privacy Policy</h1>
      <p className="text-sm text-ink/60 mb-10">Last updated: October 28, 2026</p>

      {request === "confirmed" ? (
        <p className="mb-8 rounded-md border border-forest-200 bg-forest-50 p-4 text-sm text-forest-800" role="status">
          Thank you. Your request is confirmed and we&apos;ll email you when it&apos;s complete.
        </p>
      ) : request === "invalid" ? (
        <p className="mb-8 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-danger" role="status">
          That confirmation link is invalid or has expired. Please submit the request again.
        </p>
      ) : null}

      <div className="space-y-10 text-ink/85 leading-relaxed">
        <section>
          <h2 className={H2}>1. Who we are</h2>
          <p>
            IP6 Original (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs ip6original.com from Lutherville, Maryland, USA, and is responsible (the
            &ldquo;controller&rdquo;) for the personal data described here. Questions or requests: email{" "}
            <a href={`mailto:${EMAIL.privacy}`} className="underline text-forest-700">{EMAIL.privacy}</a> or use the request form at the end of this page.
          </p>
        </section>

        <section>
          <h2 className={H2}>2. What we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Orders:</strong> your name, email, shipping address, optional phone number, what you bought, prices, discounts, shipping
              method and tracking details.
            </li>
            <li>
              <strong>Payments:</strong> card payments are handled by Stripe. We never see or store your full card number. If you subscribe,
              Stripe keeps your card on file so renewals can be charged.
            </li>
            <li>
              <strong>Account:</strong> if you create one, your name, email and a password. Passwords are stored by Amazon Cognito in hashed form;
              we can&apos;t see them.
            </li>
            <li>
              <strong>Subscriptions:</strong> the product, delivery frequency, price, next renewal date and the address renewals ship to.
            </li>
            <li>
              <strong>Emails you agreed to:</strong> your email address, the date you agreed and where on the site you signed up.
            </li>
            <li>
              <strong>Launch waitlist:</strong> if you are outside the countries we ship to and ask to hear when we launch there, your email,
              the country you choose, your first name if you give it, the country your connection appears to come from (we don&apos;t keep your
              IP address), the product and page you signed up on, the date, and the wording you agreed to. We use it only to email you about
              our launch in your country and product news, keep it apart from our customer records, and delete it when you unsubscribe or ask
              us to.
            </li>
            <li>
              <strong>Reviews:</strong> your rating, review text and the display name you choose. If you are signed in, the review is linked to
              your account so we can mark it as a verified purchase.
            </li>
            <li>
              <strong>Messages:</strong> what you send through the contact form, delivered to our email inbox.
            </li>
            <li>
              <strong>Privacy requests:</strong> your email, the type of request and when it was verified and completed.
            </li>
            <li>
              <strong>Technical data:</strong> our hosting provider logs requests (IP address, browser, pages, time) to keep the site secure and
              running. With your consent (see section 7), analytics and advertising tools also collect usage data.
            </li>
          </ul>
          <p className="mt-3">
            The questions in our pre-order pop-up are answered in your browser only and are not sent to us. We don&apos;t ask for or store
            health records.
          </p>
        </section>

        <section>
          <h2 className={H2}>3. Why we use it, and our legal basis</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              To take payment, ship your order, run subscriptions and send order, shipping, renewal and account emails (to perform our contract with
              you).
            </li>
            <li>To keep tax and accounting records (legal obligation).</li>
            <li>To prevent fraud, secure accounts and the site, and handle disputes (our legitimate interests).</li>
            <li>To send offers and updates, only if you agreed (consent; withdraw at any time).</li>
            <li>To measure site use and advertising, as set out in section 7 (consent in the EU and UK; otherwise until you opt out).</li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>4. Who we share it with</h2>
          <p className="mb-3">We use these service providers, who process data on our behalf and under their data protection terms:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Amazon Web Services</strong> (USA): hosting, database, sign-in (Cognito) and email delivery.</li>
            <li><strong>Stripe</strong> (USA): payments, fraud screening, saved cards for subscriptions and, where enabled, sales tax calculation.</li>
            <li><strong>Shipping carriers</strong> (for example USPS, UPS, FedEx, DHL): your name and address, to deliver your order.</li>
            <li><strong>Google Analytics</strong> and <strong>Meta (Facebook) Pixel</strong>: only as described in section 7.</li>
          </ul>
          <p className="mt-3">
            We may also disclose data when the law requires it, or to professional advisers. We don&apos;t sell personal data for money. Under some
            US state laws (including California), using the Meta Pixel for ad measurement can count as &ldquo;sharing&rdquo; for advertising. You
            can opt out with <strong>Your privacy choices</strong> in the footer, and we treat a browser&apos;s Global Privacy Control signal as
            that opt-out.
          </p>
        </section>

        <section>
          <h2 className={H2}>5. How long we keep it</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Checkouts that are never paid: deleted automatically after 7 days.</li>
            <li>Paid orders: kept as long as tax and accounting law requires. If you ask us to delete your data, we remove your name, email, phone and address from them.</li>
            <li>Accounts: until you delete your account.</li>
            <li>Email sign-ups: until you unsubscribe.</li>
            <li>Reviews: while published, or until you ask us to remove them.</li>
            <li>Unconfirmed privacy requests: 48 hours. Completed requests: 2 years, as a record that we handled them.</li>
            <li>Staff activity records (who viewed or changed data in our admin system): 2 years.</li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>6. How we protect it</h2>
          <p>
            Data is encrypted in transit (HTTPS) and at rest. Only our staff can open customer records, through a separate staff login that
            requires an authenticator app; each person&apos;s access depends on their role, and views, exports and changes are logged. Card data stays
            with Stripe.
          </p>
        </section>

        <section>
          <h2 className={H2}>7. Cookies, analytics and advertising</h2>
          <p>
            Essential cookies keep you signed in and your cart working. Analytics (Google Analytics) and ad measurement (Meta Pixel) are optional.
            Visitors in the EU and UK are asked first and nothing optional runs until they agree. Elsewhere they run until you switch them off
            under <strong>Your privacy choices</strong>; a Global Privacy Control signal always switches off ad measurement. Details are in our{" "}
            <a href="/legal/cookie-policy" className="underline text-forest-700">Cookie Policy</a>.
          </p>
        </section>

        <section>
          <h2 className={H2}>8. Your rights</h2>
          <p className="mb-3">Depending on where you live, you can:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Get a copy</strong> of your data. Signed-in customers can download it any time from{" "}
              <a href="/account/privacy" className="underline text-forest-700">Account, Privacy and data</a>; otherwise use the form below.
            </li>
            <li>
              <strong>Correct</strong> it, by emailing{" "}
              <a href={`mailto:${EMAIL.privacy}`} className="underline text-forest-700">{EMAIL.privacy}</a>.
            </li>
            <li><strong>Delete</strong> it, from your account page or with the form below.</li>
            <li><strong>Stop marketing emails</strong> from your account page, or by contacting us.</li>
            <li><strong>Withdraw consent</strong> to cookies at any time with Your privacy choices.</li>
            <li><strong>Object</strong> to processing based on our legitimate interests, or ask us to restrict it.</li>
          </ul>
          <p className="mt-3">
            To protect you, requests made without signing in are confirmed through a link sent to the email address in question. We reply within 30
            days (45 days where US state law allows). We won&apos;t treat you differently for using these rights. If you disagree with our
            response, reply to it to appeal, and you can also complain to your local data protection authority.
          </p>
        </section>

        <section>
          <h2 className={H2}>9. International transfers</h2>
          <p>
            Our systems run in the United States. For customers in the EU, UK and elsewhere, transfers rely on the Standard Contractual Clauses in
            our providers&apos; data processing terms.
          </p>
        </section>

        <section>
          <h2 className={H2}>10. Children</h2>
          <p>This site is not intended for children under 18, and we don&apos;t knowingly collect their data.</p>
        </section>

        <section>
          <h2 className={H2}>11. Changes</h2>
          <p>If we change this policy we&apos;ll update the date above, and tell account holders by email about significant changes.</p>
        </section>

        <section className="rounded-lg border border-ivory-300 bg-ivory-200 p-6" id="request">
          <h2 className="font-display text-xl text-forest-800 mb-2">Request a copy or deletion of your data</h2>
          <p className="text-sm text-ink/75 mb-4">
            Enter the email address you used with us. We&apos;ll send a confirmation link to that address; nothing happens until you click it.
            Signed in? It&apos;s quicker from your <a href="/account/privacy" className="underline text-forest-700">account page</a>.
          </p>
          <DataDeletionForm />
        </section>
      </div>
    </>
  );
}
