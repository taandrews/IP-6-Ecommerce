"use client";

import { useEffect } from "react";

/**
 * ALTCHA proof-of-work check (see lib/captcha.ts). It starts solving as soon
 * as the visitor focuses the form, so by the time they submit it's usually
 * done; the answer goes with the form as the "altcha" field.
 */
export function Captcha({ origin = "" }: { origin?: string }) {
  useEffect(() => {
    void import("altcha");
  }, []);
  return (
    <altcha-widget
      challengeurl={`${origin}/api/captcha`}
      name="altcha"
      auto="onfocus"
      hidelogo
      hidefooter
    />
  );
}

/**
 * The form's solved CAPTCHA, waiting for it (or starting it) if the visitor
 * submitted before it finished. Null if it fails or takes over 20 seconds
 * (the server then refuses the form and asks them to try again).
 */
export function captchaPayload(form: HTMLFormElement): Promise<string | null> {
  const read = () => {
    const v = new FormData(form).get("altcha");
    return typeof v === "string" && v ? v : null;
  };
  const ready = read();
  const widget = form.querySelector("altcha-widget") as
    | (HTMLElement & { getState?: () => string; verify?: () => Promise<void> })
    | null;
  if (ready || !widget) return Promise.resolve(ready);
  return new Promise((resolve) => {
    const finish = (value: string | null) => {
      widget.removeEventListener("statechange", onChange);
      clearTimeout(timer);
      resolve(value);
    };
    const onChange = (e: Event) => {
      const { state, payload } = (e as CustomEvent<{ state: string; payload?: string }>).detail ?? {};
      if (state === "verified") finish(payload ?? read());
      else if (state === "error" || state === "expired") finish(null);
    };
    widget.addEventListener("statechange", onChange);
    const timer = setTimeout(() => finish(read()), 20_000);
    // Already solving (it starts when the form is focused): just wait for it.
    if (widget.getState?.() !== "verifying") widget.verify?.().catch(() => finish(null));
  });
}
