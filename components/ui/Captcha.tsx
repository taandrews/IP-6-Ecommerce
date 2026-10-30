"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile check (verified on the server in lib/captcha.ts).
 * Most visitors see it tick itself; Cloudflare only asks for a click when it
 * isn't sure. The token goes with the form as "cf-turnstile-response".
 */

interface Turnstile {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

/** Cloudflare's always-pass test key stands in when no site key is configured (local development). */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const FIELD = "cf-turnstile-response";

let loading: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("turnstile failed to load"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export function Captcha() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let id: string | undefined;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        id = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          theme: "light",
          size: "flexible",
          "response-field-name": FIELD,
          "refresh-expired": "auto",
        });
        ref.current.dataset.widgetId = id;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (id) window.turnstile?.remove(id);
    };
  }, []);
  return <div ref={ref} data-captcha className="min-h-[65px] w-full" />;
}

/**
 * The form's Turnstile token, waiting up to 20 seconds if the check is still
 * running. Each token works once, so the widget is reset right away to have a
 * fresh one ready if the visitor needs to submit again. Null if none arrives
 * (the server then refuses the form and asks them to try again).
 */
export function captchaPayload(form: HTMLFormElement): Promise<string | null> {
  const read = () => {
    const v = new FormData(form).get(FIELD);
    return typeof v === "string" && v ? v : null;
  };
  const take = (token: string | null) => {
    const id = form.querySelector<HTMLElement>("[data-captcha]")?.dataset.widgetId;
    if (token && id) window.turnstile?.reset(id);
    return token;
  };
  const ready = read();
  if (ready) return Promise.resolve(take(ready));
  return new Promise((resolve) => {
    const started = Date.now();
    const poll = setInterval(() => {
      const token = read();
      if (token || Date.now() - started > 20_000) {
        clearInterval(poll);
        resolve(take(token));
      }
    }, 250);
  });
}
