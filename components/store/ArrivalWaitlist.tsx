"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, X } from "lucide-react";
import { countryInSentence, isSellableCountry } from "@/lib/countries";
import { useGeo } from "@/components/store/Geo";
import { useWaitlistCountries, useWaitlistSubmit, WaitlistForm } from "@/components/store/WaitlistForm";
import { Captcha } from "@/components/ui/Captcha";
import { readConsentCookie } from "@/lib/consent";
import { WAITLIST_CONSENT_TEXT, WAITLIST_PROMPT_COOKIE, type WaitlistPrompt } from "@/lib/waitlist-consent";

/** Pages viewed this visit, counted per tab so a fresh visit starts again at one. */
const VIEWS_KEY = "ip6_waitlist_views";

function remember(value: WaitlistPrompt) {
  const secure = location.protocol === "https:" ? ";secure" : "";
  document.cookie = `${WAITLIST_PROMPT_COOKIE}=${value};path=/;max-age=${365 * 86400};samesite=lax${secure}`;
}

function countView(): number {
  try {
    const n = Number(sessionStorage.getItem(VIEWS_KEY) ?? "0") + 1;
    sessionStorage.setItem(VIEWS_KEY, String(n));
    return n;
  } catch {
    return 1;
  }
}

/**
 * Launch list for visitors from countries we don't sell to yet.
 *
 * The first page of a visit carries a bold band in the page flow (not an
 * overlay), so the page someone lands on from a search result is never
 * covered. From the second page the sign-up card opens over the page.
 * Closing either, or signing up, stops both (cookie read by the layout).
 * US visitors never get either.
 */
export function ArrivalWaitlist({ initial }: { initial: WaitlistPrompt | null }) {
  const geo = useGeo();
  const pathname = usePathname();
  const [prompt, setPrompt] = useState<WaitlistPrompt | null>(initial);
  const [cardOpen, setCardOpen] = useState(false);
  const [bandJoined, setBandJoined] = useState(false);
  const joinedOn = useRef<string | null>(null);
  const active = !geo.sellable && prompt === null;

  // Count page views (including client-side navigation); open the card from the second.
  useEffect(() => {
    if (!active) return;
    const views = countView();
    // EU/UK visitors answer the cookie notice first; the card waits for a later page.
    if (views >= 2 && readConsentCookie()) setCardOpen(true);
  }, [pathname, active]);

  // After signing up in the band, the thank-you stays until the visitor moves on.
  useEffect(() => {
    if (bandJoined && joinedOn.current && joinedOn.current !== pathname) setBandJoined(false);
  }, [pathname, bandJoined]);

  const close = useCallback(() => {
    setCardOpen(false);
    setPrompt((p) => {
      if (p) return p;
      remember("closed");
      return "closed";
    });
  }, []);

  const joined = useCallback(() => {
    remember("joined");
    joinedOn.current = pathname;
    setPrompt("joined");
  }, [pathname]);

  if (geo.sellable) return null;
  return (
    <>
      {active || bandJoined ? (
        <ArrivalBand
          country={geo.country}
          joined={bandJoined}
          onClose={close}
          onJoined={() => {
            setBandJoined(true);
            joined();
          }}
        />
      ) : null}
      {cardOpen ? <ArrivalCard country={geo.country} onClose={close} onJoined={joined} done={prompt === "joined"} /> : null}
    </>
  );
}

function ArrivalBand({ country, joined, onClose, onJoined }: { country: string; joined: boolean; onClose: () => void; onJoined: () => void }) {
  const id = useId();
  const options = useWaitlistCountries();
  const [email, setEmail] = useState("");
  const [chosen, setChosen] = useState(isSellableCountry(country) ? "" : country);
  const [consent, setConsent] = useState(false);
  const { state, error, submit } = useWaitlistSubmit({ source: "arrival", onDone: onJoined });
  const where = countryInSentence(chosen || country);

  return (
    <section
      data-nosnippet
      aria-labelledby={`${id}-title`}
      className="relative bg-navy-800 text-surface border-b-4 border-gold-500"
    >
      <div className="container py-4 lg:py-8">
        {joined ? (
          <div role="status" className="flex items-start gap-3 pr-10">
            <Check className="size-6 mt-0.5 text-gold-300 shrink-0" aria-hidden="true" />
            <div>
              <p id={`${id}-title`} className="font-display text-2xl lg:text-3xl text-surface">You&apos;re nearly on the list for {where}.</p>
              <p className="mt-1 text-surface/80">We sent a confirmation link to {email}. Click it and we&apos;ll email you the day we launch there.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-10 pr-8 lg:pr-12">
            <div>
              <p className="text-[11px] lg:text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Shipping update</p>
              <h2 id={`${id}-title`} className="mt-1.5 lg:mt-2 font-display text-[1.4rem] leading-tight lg:text-4xl text-surface">
                IP6 Original doesn&apos;t ship to {where} yet.
              </h2>
              <p className="hidden sm:block mt-2 text-surface/80 lg:text-lg">
                We ship to the 50 US states and Washington, DC. Join the launch list and we&apos;ll email you the day we reach {where}.
              </p>
            </div>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void submit(e.currentTarget, { email, country: chosen, consent });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
                <label htmlFor={`${id}-email`} className="sr-only">
                  Email
                </label>
                <input
                  id={`${id}-email`}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Your email"
                  className="input text-ink"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor={`${id}-country`} className="sr-only">
                  Country
                </label>
                <select id={`${id}-country`} required className="input text-ink" value={chosen} onChange={(e) => setChosen(e.target.value)}>
                  <option value="" disabled>
                    Your country
                  </option>
                  {options.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={state === "saving" || !email || !chosen}
                  className="col-span-2 sm:col-span-1 btn justify-center rounded-full bg-gold-500 px-6 py-3 font-semibold text-navy-900 hover:bg-gold-400 disabled:bg-gold-300 disabled:text-navy-800/70 whitespace-nowrap"
                >
                  {state === "saving" ? "Saving…" : "Notify me at launch"}
                </button>
              </div>
              <label className="flex items-start gap-2.5 text-xs sm:text-sm text-surface/85">
                <input type="checkbox" className="mt-0.5 size-4 accent-gold-500" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>
                  {WAITLIST_CONSENT_TEXT} Unsubscribe any time. <a href="/legal/privacy" className="underline">Privacy policy</a>.
                </span>
              </label>
              <Captcha appearance="interaction-only" />
              {error ? (
                <p className="text-sm font-medium text-gold-200" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-2 top-2 lg:right-4 lg:top-4 p-2 rounded-full text-surface/80 hover:text-surface hover:bg-navy-700"
      >
        <X className="size-5" />
      </button>
    </section>
  );
}

function ArrivalCard({ country, onClose, onJoined, done }: { country: string; onClose: () => void; onJoined: () => void; done: boolean }) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<Element | null>(null);
  const where = countryInSentence(country);

  useEffect(() => {
    lastFocused.current = document.activeElement;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("input, select, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const f = Array.from(panel.current.querySelectorAll<HTMLElement>("button, [href], input, select, [tabindex]:not([tabindex='-1'])")).filter(
        (el) => el.offsetParent !== null && !(el as HTMLButtonElement).disabled,
      );
      if (!f.length) return;
      const first = f[0]!;
      const last = f[f.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      (lastFocused.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      data-nosnippet
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-navy-900/60 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className="relative w-full sm:max-w-[34rem] max-h-[92vh] overflow-y-auto bg-surface rounded-t-2xl sm:rounded-2xl border-t-[6px] border-gold-500 shadow-2xl"
      >
        <div className="bg-navy-800 px-6 pt-7 pb-6 sm:px-8 text-surface">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Shipping update</p>
          <h2 id={`${id}-title`} className="mt-2 font-display text-[1.75rem] leading-tight sm:text-3xl pr-8 text-surface">
            IP6 Original isn&apos;t in {where} yet.
          </h2>
        </div>
        <div className="px-6 py-6 sm:px-8">
          <WaitlistForm source="arrival" defaultCountry={country} onDone={onJoined} className="border-0 p-0" />
          <button type="button" onClick={onClose} className="mt-4 w-full text-center text-sm font-medium text-ink/70 underline underline-offset-2 hover:text-ink">
            {done ? "Done" : "Keep browsing"}
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 p-2 rounded-full text-surface/80 hover:text-surface hover:bg-navy-700"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}

