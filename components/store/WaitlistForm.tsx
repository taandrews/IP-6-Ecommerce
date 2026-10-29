"use client";

import { useId, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { countryInSentence, countryOptions, isSellableCountry } from "@/lib/countries";
import { useGeo } from "@/components/store/Geo";
import { cn } from "@/lib/utils";
import { WAITLIST_CONSENT_TEXT } from "@/lib/waitlist-consent";


/**
 * Launch waitlist for countries we don't ship to yet. Shown in place of the
 * buy buttons (source "product") and when a checkout address is outside the
 * countries we sell to (source "checkout").
 */
export function WaitlistForm({
  source,
  product,
  defaultEmail = "",
  defaultCountry,
  className,
}: {
  source: "product" | "checkout";
  product?: string;
  defaultEmail?: string;
  defaultCountry?: string;
  className?: string;
}) {
  const id = useId();
  const geo = useGeo();
  const pathname = usePathname();
  const options = useMemo(() => countryOptions().filter(([c]) => !isSellableCountry(c)), []);
  const start = defaultCountry ?? geo.country;
  const [email, setEmail] = useState(defaultEmail);
  const [country, setCountry] = useState(isSellableCountry(start) ? "" : start);
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("Please tick the box so we can email you at launch.");
      return;
    }
    setState("saving");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, country, firstName: firstName || undefined, consent: true, product, page: pathname, source }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "We couldn't save that. Please try again.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("We couldn't save that. Please try again.");
      setState("idle");
    }
  }

  const where = country ? countryInSentence(country) : "your country";

  if (state === "done") {
    return (
      <div className={cn("rounded-md border border-gold-300 bg-surface p-5", className)} role="status">
        <p className="flex items-center gap-2 font-semibold text-navy-800">
          <Check className="size-4 text-gold-700" aria-hidden="true" /> You&apos;re on the list.
        </p>
        <p className="mt-1.5 text-sm text-ink/70">We&apos;ll email {email} when IP6 Original ships to {where}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn("rounded-md border border-cloud-300 bg-surface p-5 space-y-4", className)} noValidate>
      <div>
        <p className="font-semibold text-navy-800">
          {source === "checkout" ? `We don't ship to ${where} yet.` : `Not yet available in ${where}.`}
        </p>
        <p className="mt-1 text-sm text-ink/70">
          {source === "checkout"
            ? "We currently ship to the 50 US states and Washington, DC. Leave your email and we'll tell you when we launch in your country."
            : "Get notified at launch. We currently ship to the 50 US states and Washington, DC."}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-email`} className="label">
            Email <span className="text-danger" aria-hidden>*</span>
          </label>
          <input
            id={`${id}-email`}
            type="email"
            required
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${id}-country`} className="label">
            Country <span className="text-danger" aria-hidden>*</span>
          </label>
          <select id={`${id}-country`} required className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="" disabled>
              Choose your country
            </option>
            {options.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-first`} className="label">
            First name <span className="text-ink/50 font-normal">(optional)</span>
          </label>
          <input
            id={`${id}-first`}
            autoComplete="given-name"
            maxLength={60}
            className="input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
      </div>
      <label className="flex items-start gap-2.5 text-sm text-ink/80">
        <input type="checkbox" className="mt-0.5 size-4 accent-navy-800" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{WAITLIST_CONSENT_TEXT}</span>
      </label>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary w-full justify-center" disabled={state === "saving" || !email || !country}>
        {state === "saving" ? "Saving…" : "Notify me at launch"}
      </button>
      <p className="text-xs text-ink/55">
        Unsubscribe any time. See our <a href="/legal/privacy" className="underline">privacy policy</a>.
      </p>
    </form>
  );
}
