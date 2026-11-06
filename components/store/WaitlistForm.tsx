"use client";

import { useId, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { countryInSentence, countryOptions, isSellableCountry } from "@/lib/countries";
import { useGeo } from "@/components/store/Geo";
import { cn } from "@/lib/utils";
import { WAITLIST_CONSENT_TEXT } from "@/lib/waitlist-consent";
import { Captcha, captchaPayload } from "@/components/ui/Captcha";
import { currentCampaign } from "@/lib/campaign";


export type WaitlistSource = "product" | "checkout" | "arrival";

/** Saves a launch-list sign-up through /api/waitlist (CAPTCHA, consent, double opt-in). */
export function useWaitlistSubmit({ source, product, onDone }: { source: WaitlistSource; product?: string; onDone?: () => void }) {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(form: HTMLFormElement, v: { email: string; country: string; firstName: string; consent: boolean }) {
    setError(null);
    if (!v.firstName.trim()) {
      setError("Please add your first name.");
      return;
    }
    if (!v.consent) {
      setError("Please tick the box so we can email you at launch.");
      return;
    }
    setState("saving");
    try {
      const captcha = await captchaPayload(form);
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v.email, country: v.country, firstName: v.firstName.trim(), consent: true, product, page: pathname, source, campaign: currentCampaign(), captcha }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "We couldn't save that. Please try again.");
        setState("idle");
        return;
      }
      setState("done");
      onDone?.();
    } catch {
      setError("We couldn't save that. Please try again.");
      setState("idle");
    }
  }

  return { state, error, submit };
}

/** Countries the launch list is for (every country we don't sell to yet). */
export function useWaitlistCountries() {
  return useMemo(() => countryOptions().filter(([c]) => !isSellableCountry(c)), []);
}

/**
 * Launch waitlist for countries we don't ship to yet. Shown in place of the
 * buy buttons (source "product"), when a checkout address is outside the
 * countries we sell to (source "checkout"), and in the card that greets
 * visitors from those countries (source "arrival").
 */
export function WaitlistForm({
  source,
  product,
  defaultEmail = "",
  defaultCountry,
  className,
  onDone,
}: {
  source: WaitlistSource;
  product?: string;
  defaultEmail?: string;
  defaultCountry?: string;
  className?: string;
  onDone?: () => void;
}) {
  const id = useId();
  const geo = useGeo();
  const options = useWaitlistCountries();
  const start = defaultCountry ?? geo.country;
  const [email, setEmail] = useState(defaultEmail);
  const [country, setCountry] = useState(isSellableCountry(start) ? "" : start);
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const { state, error, submit: send } = useWaitlistSubmit({ source, product, onDone });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send(e.currentTarget, { email, country, firstName, consent });
  }

  const where = country ? countryInSentence(country) : "your country";

  if (state === "done") {
    return (
      <div className={cn("rounded-md border border-gold-300 bg-surface p-5", className)} role="status">
        <p className="flex items-center gap-2 font-semibold text-navy-800">
          <Check className="size-4 text-gold-700" aria-hidden="true" /> Check your inbox.
        </p>
        <p className="mt-1.5 text-sm text-ink/70">We sent a link to {email}. Click it to confirm, and we&apos;ll email you when IP6 Original ships to {where}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn("rounded-md border border-cloud-300 bg-surface p-5 space-y-4", className)} noValidate>
      <div>
        <p className="font-semibold text-navy-800">
          {source === "checkout" ? `We don't ship to ${where} yet.` : source === "arrival" ? `Be first when we launch in ${where}.` : `Not yet available in ${where}.`}
        </p>
        <p className="mt-1 text-sm text-ink/70">
          {source === "checkout"
            ? "We currently ship to the 50 US states and Washington, DC. Leave your email and we'll tell you when we launch in your country."
            : source === "arrival"
              ? "We ship to the 50 US states and Washington, DC today. Leave your email and we'll tell you the day IP6 Original reaches you."
              : "Get notified at launch. We currently ship to the 50 US states and Washington, DC."}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-first`} className="label">
            First name <span className="text-danger" aria-hidden>*</span>
          </label>
          <input
            id={`${id}-first`}
            required
            autoComplete="given-name"
            maxLength={60}
            className="input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
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
      </div>
      <label className="flex items-start gap-2.5 text-sm text-ink/80">
        <input type="checkbox" className="mt-0.5 size-4 accent-navy-800" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{WAITLIST_CONSENT_TEXT}</span>
      </label>
      <Captcha action="waitlist" />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary w-full justify-center" disabled={state === "saving" || !firstName.trim() || !email || !country}>
        {state === "saving" ? "Saving…" : "Notify me at launch"}
      </button>
      <p className="text-xs text-ink/55">
        Unsubscribe any time. See our <a href="/legal/privacy" className="underline">privacy policy</a>.
      </p>
    </form>
  );
}
